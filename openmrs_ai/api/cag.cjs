const pdfParser = require("pdf-parse");

let currentRSE = null;
let modulabDocuments = [];

const MAX_CONTEXT_CHUNKS = 20;

function generateId() {
    return Math.random().toString(36).substring(2, 12);
}

function chunkText(text, chunkSize = 1500, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = start + chunkSize;
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

// standard words to make rules
function detectDocumentType(text) {
    const t = text.toLowerCase();

    const modulabKeywords = [
        "hemograma",
        "val. referência",
        "val referência",
        "valor de referência",
        "res. anteriores",
        "res anteriores",
        "resultado",
    ];

    const matches = modulabKeywords.filter(k => t.includes(k)).length;

    // ehr usually don't have these types of words, so having 3 of these will do probably for everything
    return matches >= 3 ? "MODULAB" : "RSE";
}

// LLM config
async function callLLM(prompt, temperature = 0.2) {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gemma3:12b-it-qat",
            prompt,
            stream: false,
            keep_alive: "20m",
            options: {
                temperature,
                num_predict: 1500
            }
        })
    });

    const data = await response.json();
    let output = data.response;
    output = output
        .replace(/<\/end_of_turn>/g, "")
        .replace(/<end_of_turn>/g, "")
        .replace(/<start_of_turn>/g, "")
        .replace(/=/g, "")
        .trim();
    return output;
}

// upload documents
async function uploadDocument(req, res) {
    try {
        const data = await pdfParser(req.file.buffer);
        const text = data.text || "";

        const type = detectDocumentType(text);
        const chunks = chunkText(text);

        const document = {
            id: generateId(),
            type,
            filename: req.file.originalname,
            chunks: chunks.map((t, i) => ({
                id: `${Date.now()}_${i}`,
                text: t
            }))
        };

        if (type === "RSE") {
            currentRSE = document; // if more than 1 ehr is uploaded, the latter is the valid one
            console.log("Novo RSE carregado:", req.file.originalname);
        } else {
            modulabDocuments.push(document);
            console.log("Análises carregadas:", req.file.originalname);
        }

        return res.json({
            success: true,
            type
        });

    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({
            success: false,
            error: "Erro ao processar PDF"
        });
    }
}

// LLM context builders
function buildRSEContext() {
    if (!currentRSE) return "";
    return currentRSE.chunks
        .map(c => c.text)
        .join("\n\n");
}

function buildModulabContext() {
    return modulabDocuments
        .flatMap(doc => doc.chunks)
        .map(c => c.text)
        .join("\n\n");
}

function extractRelevantLabs(text) {

    if (!text) return "";
    const keywords = [
        "hemoglobina",
        "leucócitos",
        "leucocitos",
        "neutrófilos",
        "neutrofilos",
        "linfócitos",
        "linfocitos",
        "monócitos",
        "eosinófilos",
        "basófilos",
        "granulócitos imaturos",
        "eritroblastos",
        "eritrócitos",
        "hematócrito",
        "monocitos",
        "eosinofilos",
        "basofilos",
        "granulocitos imaturos",
        "eritrocitos",
        "hematocrito",
        "vcm",
        "hcm",
        "chcm",
        "rdw",
        "plaquetócrito",
        "plaquetocrito",
        "plaquetas",
        "pdw",
        "vpm",
        "ureia",
        "glicose",
        "creatinina",
        "sódio",
        "potássio",
        "sodio",
        "potassio",
        "cloro",
        "cálcio total",
        "calcio total",
        "magnésio",
        "magnesio",
        "proteínas totais",
        "proteinas totais",
        "albumina",
        "ácido úrico",
        "acido urico",
        "bilirrubina total",
        "bilirrubina direta",
        "fosfatase alcalina",
        "TGO / AST",
        "TGP / ALT",
        "gama GT",
        "lactato desidrogenase",
    ];

    const lines = text.split("\n");
    const results = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        const matchedKeyword = keywords.find(k => lower.includes(k));
        if (!matchedKeyword) continue;
        const match = line.match(
            /([0-9]+(?:[.,][0-9]+)?)\s*([0-9]*\^?[0-9]*\s*[a-zA-Zμ%\/\^\-]+(?:\/[a-zA-Z0-9]+)*)?/
        );
        if (match) {
            const value = match[1]?.replace(",", ".") || "";
            let unit = (match[2] || "").trim();
            unit = unit
                .replace(/\s*\/\s*/g, "/")
                .replace(/\s*\^\s*/g, "^")
                .replace(/\s+/g, " ")
                .trim();

            let formatted = "";
            if (unit === "%") {
                formatted = `${matchedKeyword}: ${value}%`;
            }
            else if (unit.includes("10^")) {
                formatted = `${matchedKeyword}: ${value} ${unit}`;
            }
            else {
                formatted = `${matchedKeyword}: ${value} ${unit}`.trim();
            }
            results.push(formatted);
        } else {
            results.push(line.trim());
        }
    }
    return results.join("\n");
}

// specific task prompt
async function generateDocument(req, res) {

    const instruction = req.body?.instruction || "";
    const rse = buildRSEContext();
    const labRaw = buildModulabContext();
    const lab = extractRelevantLabs(labRaw);

    if (!rse) {
        return res.status(400).json({
            success: false,
            error: "Sem RSE carregado"
        });
    }

    const prompt = `
És um motor clínico de atualização de documentos médicos.

TAREFA:

Atualizar o Registo de Saúde Eletrónico (RSE) com base na instrução do utilizador e nos dados clínicos disponíveis.

REGRAS ABSOLUTAS:

- Não inventes informação clínica.
- Usa apenas informação presente no RSE, nas análises ou na instrução do utilizador.
- A instrução do utilizador determina quais os dados das análises que devem ser utilizados.
- NÃO utilizes dados das análises que não sejam necessários para cumprir a instrução.
- NÃO copies todos os dados das análises para o RSE.
- NÃO cries uma nova secção de "Avaliação Analítica".
- Se um parâmetro solicitado já existir no RSE, atualiza o seu valor na posição onde esse parâmetro já se encontra.
- Se um parâmetro solicitado não existir no RSE, adiciona-o dentro da secção "Avaliação Analítica" já existente.
- Mantém todos os restantes dados do RSE inalterados.
- Não alteres parâmetros que não tenham sido mencionados na instrução.
- Não removas informação que não esteja relacionada com a instrução.
- Responde apenas com o RSE final.
- Não expliques as alterações efetuadas.
- Não apresentes os dados das análises separadamente.
- Mantém a estrutura clínica original.
- Usa português europeu.

Sobre os dados das análises:
Os dados apresentados na secção "ANÁLISES" são dados de origem e não devem ser copiados diretamente para o RSE.
Analisa a instrução do utilizador e determina quais os parâmetros necessários para executar a tarefa.
Utiliza apenas esses parâmetros.
Quando a instrução pedir para atualizar um valor existente, substitui o valor antigo pelo novo valor.
Quando a instrução pedir para adicionar um parâmetro que ainda não existe no RSE, adiciona esse parâmetro na secção avaliação analítica, mantendo a estrutura existente.
Nunca acrescentes ao final do documento uma lista ou secção contendo os resultados das análises.

====================
RSE
====================

${rse}

====================
ANÁLISES
====================

${lab}

====================
INSTRUÇÃO DO UTILIZADOR
====================

${instruction}

====================
INSTRUÇÕES FINAIS DE OUTPUT
====================

O conteúdo apresentado anteriormente é APENAS CONTEXTO para executar a tarefa.

Não apresentes o RSE original antes do resultado.
Não apresentes uma comparação entre o RSE original e o atualizado.
Não escrevas "RSE", "RSE atualizado", "Resultado", "Antes", "Depois" ou qualquer outro cabeçalho.
Não apresentes os dados das análises separadamente.

Devolve uma única versão do RSE: o RSE FINAL ATUALIZADO.
O RSE final deve manter todo o conteúdo original e incorporar apenas as alterações solicitadas na instrução.
RESPOSTA:
`;

    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });

    } catch (err) {
        console.error("Generate error:", err);
        return res.status(500).json({
            success: false,
            error: "Erro ao gerar documento"
        });
    }
}

// session reset
async function endSession(req, res) {
    currentRSE = null;
    modulabDocuments = [];
    return res.json({
        success: true
    });
}

// session info
async function getSessionInfo(req, res) {
    return res.json({
        rse: currentRSE ? 1 : 0,
        modulab: modulabDocuments.length,
        total: (currentRSE ? 1 : 0) + modulabDocuments.length
    });
}

module.exports = {
    uploadDocument,
    generateDocument,
    endSession,
    getSessionInfo
};