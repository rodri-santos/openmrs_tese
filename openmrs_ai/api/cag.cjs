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
    const lines = text.split("\n");
    const results = [];

    function normalizeUnit(unit) {

        if (!unit) return "";

        return unit
            .replace(/\s+/g, " ")
            .replace(/10\s*\^?\s*3\s*\/\s*[µμu]L/gi, "mm3")
            .replace(/10\s*\^?\s*3\s*[\/]?\s*[µμu]L/gi, "mm3")
            .trim();
    }

    function extractValueAndUnit(line) {

        const match = line.match(
            /([0-9]+(?:[.,][0-9]+)?)\s*(10\s*\^?\s*3\s*\/\s*[µμu]L|10\s*\^?\s*3\s*[\/]?\s*[µμu]L|[%]|[a-zA-Zµμ]+(?:\/[a-zA-Zµμ]+)?)/i
        );

        if (!match) return null;

        const value = match[1].replace(",", ".");
        const unit = normalizeUnit(match[2]);

        return {
            value,
            unit
        };
    }

    for (const originalLine of lines) {
        const line = originalLine.trim();
        if (!line) continue;
        const lower = line.toLowerCase();

        if (
            lower.includes("neutrófilos") ||
            lower.includes("neutrofilos")
        ) {
            const absoluteMatch = line.match(
                /%\s*([0-9]+(?:[.,][0-9]+)?)\s*10\s*\^?\s*3\s*\/\s*[µμu]L/i
            );
            if (absoluteMatch) {
                const value = absoluteMatch[1].replace(",", ".");
                results.push(
                    `Neutrófilos: ${value} mm3`
                );
                continue;
            }
        }

        if (
            lower.includes("leucócitos") ||
            lower.includes("leucocitos")
        ) {
            const match = line.match(
                /leuc[oó]citos\s*:?\s*([0-9]+(?:[.,][0-9]+)?)\s*10\s*\^?\s*3\s*\/\s*[µμu]L/i
            );

            if (match) {

                const value = match[1].replace(",", ".");
                results.push(
                    `Leucócitos: ${value} mm3`
                );
                continue;
            }
        }

        if (lower.includes("plaquetas")) {
            const match = line.match(
                /plaquetas\s*:?\s*([0-9]+(?:[.,][0-9]+)?)\s*10\s*\^?\s*3\s*\/\s*[µμu]L/i
            );

            if (match) {

                const value = match[1].replace(",", ".");
                results.push(
                    `Plaquetas: ${value} mm3`
                );
                continue;
            }
        }

        const keywords = [
            "hemoglobina",
            "linfócitos",
            "linfocitos",
            "monócitos",
            "monocitos",
            "eosinófilos",
            "eosinofilos",
            "basófilos",
            "basofilos",
            "granulócitos imaturos",
            "granulocitos imaturos",
            "eritroblastos",
            "eritrócitos",
            "eritrocitos",
            "hematócrito",
            "hematocrito",
            "vcm",
            "hcm",
            "chcm",
            "rdw",
            "plaquetócrito",
            "plaquetocrito",
            "pdw",
            "vpm",
            "ureia",
            "glicose",
            "creatinina",
            "sódio",
            "sodio",
            "potássio",
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
            "tgo / ast",
            "tgp / alt",
            "gama gt",
            "lactato desidrogenase"
        ];


        const matchedKeyword = keywords.find(
            keyword => lower.includes(keyword)
        );

        if (!matchedKeyword) continue;
        const extracted = extractValueAndUnit(line);
        if (!extracted) continue;
        let name = matchedKeyword;

        const names = {
            "linfocitos": "Linfócitos",
            "linfócitos": "Linfócitos",
            "monocitos": "Monócitos",
            "monócitos": "Monócitos",
            "eosinofilos": "Eosinófilos",
            "eosinófilos": "Eosinófilos",
            "basofilos": "Basófilos",
            "basófilos": "Basófilos",
            "granulocitos imaturos": "Granulócitos imaturos",
            "granulócitos imaturos": "Granulócitos imaturos",
            "eritrocitos": "Eritrócitos",
            "eritrócitos": "Eritrócitos",
            "hematocrito": "Hematócrito",
            "hematócrito": "Hematócrito",
            "plaquetocrito": "Plaquetócrito",
            "plaquetócrito": "Plaquetócrito",
            "proteinas totais": "Proteínas totais",
            "proteínas totais": "Proteínas totais",
            "acido urico": "Ácido úrico",
            "ácido úrico": "Ácido úrico",
            "sodio": "Sódio",
            "sódio": "Sódio",
            "potassio": "Potássio",
            "potássio": "Potássio"
        };

        if (names[matchedKeyword]) {
            name = names[matchedKeyword];
        } else {
            name =
                matchedKeyword.charAt(0).toUpperCase() +
                matchedKeyword.slice(1);
        }
        results.push(
            `${name}: ${extracted.value}${extracted.unit ? " " + extracted.unit : ""}`
        );
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
Atualizar o Registo de Saúde Eletrónico (RSE) com base na instrução do utilizador.

REGRAS ABSOLUTAS:
- Não inventes informação clínica
- Não dês output das análises filtradas
- Usa apenas dados presentes no RSE ou nas análises
- Não explicas nada
- Não comentas resultados
- Não conversas
- Responde apenas com o RSE final
- Mantém estrutura clínica original
- Usa português europeu
- Se a instrução pedir algo inexistente, ignora
- Não dês output disto: ==================== </end_of_turn>

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