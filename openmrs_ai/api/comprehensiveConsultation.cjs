const pdfParser = require("pdf-parse");
let firstConsultation = null;
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

function detectDocumentType(text) {
    const t = text.toLowerCase();
    const modulabKeywords = [
        "hemograma",
        "val. referência",
        "val referência",
        "valor de referência",
        "res. anteriores",
        "res anteriores",
        "resultado"
    ];
    const matches = modulabKeywords.filter(k => t.includes(k)).length;
    return matches >= 2 ? "MODULAB" : "CONSULTA";
}

async function callLLM(prompt, temperature = 0.2) {
    const response = await fetch(
        "http://localhost:11434/api/generate",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma3:12b-it-qat",
                prompt,
                stream: false,
                keep_alive: "20m",
                options: {
                    temperature,
                    num_predict: 1800
                }
            })
        }
    );
    const data = await response.json();
    return (data.response || "")
        .replace(/<\/?end_of_turn>/g, "")
        .replace(/<start_of_turn>/g, "")
        .replace(/=/g, "")
        .replace(/Registo Clínico Revisado/gi, "Registo Clínico Revisto")
        .replace(/\bRevisado\b/gi, "Revisto")
        .replace(/\brevisado\b/gi, "revisto")
        .replace(/enfermeiragem/gi, "enfermagem")
        .replace(/n\.?\s*º?\s*de\s*matr[ií]cula/gi, "N.º SNS")
        .replace(/\*\*/g, "")
        .replace(/^\s*\*\s+/gm, "- ")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/^\s*\*\s+/gm, "- ")
        .replace(/^\s*\d+\.\s+/gm, "- ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

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
        if (type === "CONSULTA") {
            firstConsultation = document;
            console.log(
                "Primeira consulta carregada:",
                req.file.originalname
            );
        } else {
            modulabDocuments.push(document);
            console.log(
                "Análises carregadas:",
                req.file.originalname
            );
        }
        return res.json({
            success: true,
            type
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Erro ao processar PDF."
        });
    }
}

function buildFirstConsultationContext() {
    if (!firstConsultation) return "";
    return firstConsultation.chunks
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
        "tgo",
        "ast",
        "tgp",
        "alt",
        "gama gt",
        "lactato desidrogenase"

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
            const value = match[1].replace(",", ".");
            let unit = (match[2] || "").trim();
            unit = unit
                .replace(/\s*\/\s*/g, "/")
                .replace(/\s*\^\s*/g, "^")
                .replace(/\s+/g, " ")
                .trim();
            results.push(
                `${matchedKeyword}: ${value}${unit ? " " + unit : ""}`
            );
        }
    }
    return results.join("\n");
}

async function generateFirstConsultation(req, res) {
    const { instruction } = req.body;
    const prompt = `
És um sistema de apoio à documentação clínica.

Objetivo:
Gerar um registo de enfermagem referente à primeira consulta.

Regras obrigatórias:

- Usa português europeu.
- Escreve apenas informação suportada.
- Não inventes dados.
- Não cries valores fictícios.
- Organiza o texto em secções clínicas.
- Mantém linguagem profissional.
- Responde apenas com o registo.
- Utiliza sempre "enfermagem".
- No final acrescenta:
Enfermeiro Responsável: [Nome]

Notas clínicas:

${instruction}

Registo:
`;
    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Erro ao gerar a primeira consulta."
        });
    }
}

async function updateFirstConsultation(req, res) {
    const {
        record,
        instruction
    } = req.body;

    const prompt = `
És um sistema de apoio à documentação clínica.

Recebes:

1. Um registo clínico.
2. Uma instrução do enfermeiro.

Objetivo:
Atualizar o registo existente.

Regras obrigatórias:

- Mantém toda a restante informação.
- Altera apenas o necessário.
- Nunca inventes informação.
- Nunca apagues conteúdo não relacionado.
- Mantém o formato clínico.
- Mantém títulos e listas.
- Responde apenas com o novo registo.
- Não acrescentes informação que não esteja presente.

====================
REGISTO
====================

${record}

====================
INSTRUÇÃO
====================

${instruction}

====================

Novo registo:
`;
    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Erro ao atualizar o registo."
        });
    }
}

async function generateComprehensiveConsultation(req, res) {
    const instruction = req.body?.instruction || "";
    const firstConsultationText =
        buildFirstConsultationContext();
    const analysesRaw =
        buildModulabContext();
    const analyses =
        extractRelevantLabs(analysesRaw);
    if (!firstConsultationText) {
        return res.status(400).json({
            success: false,
            error: "Não existe uma primeira consulta carregada."
        });
    }

    const prompt = `
És um sistema de apoio à documentação clínica em oncologia.

Recebes:

1. Um registo correspondente à primeira consulta.
2. Resultados laboratoriais.
3. Uma instrução do enfermeiro.

Objetivo:

Gerar um novo registo de consulta completo.

Este novo registo deve corresponder a uma consulta posterior.

REGRAS OBRIGATÓRIAS

- Usa apenas informação presente.
- Nunca inventes dados clínicos.
- Nunca cries sintomas.
- Nunca cries antecedentes.
- Nunca cries exames.
- Nunca cries medicação.
- Nunca cries valores laboratoriais.
- Utiliza apenas os resultados laboratoriais fornecidos.
- Atualiza apenas o que a instrução solicitar.
- Mantém toda a restante informação clínica.
- Mantém a estrutura do registo.
- Mantém uma linguagem profissional.
- Português europeu.
- Responde apenas com o registo final.

====================
PRIMEIRA CONSULTA
====================

${firstConsultationText}

====================
RESULTADOS LABORATORIAIS
====================

${analyses}

====================
INSTRUÇÃO
====================

${instruction}

====================
NOVO REGISTO
====================
`;
    try {
        const result =
            await callLLM(prompt);
        return res.json({
            success: true,
            result
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Erro ao gerar a consulta."
        });
    }
}

async function endSession(req, res) {
    firstConsultation = null;
    modulabDocuments = [];
    return res.json({
        success: true
    });
}

async function getSessionInfo(req, res) {
    return res.json({
        firstConsultation: firstConsultation ? 1 : 0,
        modulab: modulabDocuments.length,
        total:
            (firstConsultation ? 1 : 0) +
            modulabDocuments.length
    });
}

async function reviewCurrentRecord(req, res) {
    const { record } = req.body;
    if (!record || !record.trim()) {
        return res.json({
            success: false,
            result: "Sem registo para rever."
        });
    }

    const prompt = `
És um assistente de revisão de registos clínicos.

Objetivo:
Melhorar apenas a qualidade da escrita.

Regras:
- não inventar informação
- não remover informação clínica
- corrigir apenas ortografia, gramática e clareza
- manter português europeu
- responder apenas com o registo revisto

REGISTO:

${record}

REGISTO REVISTO:
`;
    try {
        const result = await callLLM(prompt, 0.1);
        return res.json({
            success: true,
            result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            result: "Erro ao rever registo."
        });
    }
}

module.exports = {
    uploadDocument,
    generateComprehensiveConsultation,
    reviewCurrentRecord,
    endSession,
    getSessionInfo
};