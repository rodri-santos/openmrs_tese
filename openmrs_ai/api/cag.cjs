const pdfParser = require("pdf-parse");

let currentRSE = null;
let modulabDocuments = [];

const MAX_CONTEXT_CHUNKS = 20;

// =====================================================
// UTILS
// =====================================================

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

// =====================================================
// CLASSIFICAÇÃO POR REGRAS (SEM LLM)
// =====================================================

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
        //"leucócitos",
        //"neutrófilos",
        //"hemoglobina",
        //"plaquetas"
    ];

    const matches = modulabKeywords.filter(k => t.includes(k)).length;

    // se tiver pelo menos 2 keywords, assume análises
    return matches >= 2 ? "MODULAB" : "RSE";
}

// =====================================================
// LLM
// =====================================================

async function callLLM(prompt, temperature = 0.2) {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gemma3:12b-it-qat",
            //model: "gemma4:latest",
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
    //return data.response;
}

// =====================================================
// UPLOAD ÚNICO (RSE OU MODULAB)
// =====================================================

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
            currentRSE = document; // sempre substitui o anterior
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


// =====================================================
// CONTEXTO HELPERS
// =====================================================

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
        "pdw",
        "vpm"
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

            // normalização leve da unidade (sem destruir estrutura)
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

// =====================================================
// REWRITE ENGINE (INSTRUCTION-DRIVEN)
// =====================================================

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
Atualizar o Registo de Saúde Eletrónico (RSE) com base na instrução do utilizador.

REGRAS ABSOLUTAS:
- NÃO inventes informação clínica
- NÃO dês output das análises filtradas
- Usa apenas dados presentes no RSE ou nas análises
- NÃO explicas nada
- NÃO comentas resultados
- NÃO conversas
- Responde apenas com o RSE final
- Mantém estrutura clínica original
- Usa português europeu
- Se a instrução pedir algo inexistente, ignora
- NÃO dês output disto: ==================== </end_of_turn>

====================
RSE
====================

${rse}

====================
ANÁLISES (FILTRADAS - APENAS PARÂMETROS SOLICITADOS)
====================

${lab}

====================
INSTRUÇÃO DO UTILIZADOR
====================

${instruction}

====================
OUTPUT (APENAS RSE FINAL)
====================
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

// =====================================================
// RESET SESSÃO
// =====================================================

async function endSession(req, res) {
    currentRSE = null;
    modulabDocuments = [];

    return res.json({
        success: true
    });
}

// =====================================================
// INFO DA SESSÃO
// =====================================================

async function getSessionInfo(req, res) {
    return res.json({
        rse: currentRSE ? 1 : 0,
        modulab: modulabDocuments.length,
        total: (currentRSE ? 1 : 0) + modulabDocuments.length
    });
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    uploadDocument,
    generateDocument,
    endSession,
    getSessionInfo
};