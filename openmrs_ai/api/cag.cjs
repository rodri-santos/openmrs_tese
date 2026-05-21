const pdfParser = require("pdf-parse");

let documents = [];
let cache = [];

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

function buildContextByType(type) {
    return documents
        .filter(doc => doc.type === type)
        .flatMap(doc => doc.chunks)
        .map(c => c.text)
        .join("\n\n");
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
    return data.response;
}

// =====================================================
// UPLOAD RSE
// =====================================================

async function uploadRSE(req, res) {

    const data = await pdfParser(req.file.buffer);
    const chunks = chunkText(data.text || "");
    console.log("uploadRSE");

    documents.push({
        id: generateId(),
        type: "RSE",
        filename: req.file.originalname,
        chunks: chunks.map((t, i) => ({
            id: `${Date.now()}_${i}`,
            text: t
        }))
    });
    console.log("UPLOAD RSE RECEBIDO");

    console.log("FILE:", req.file);

    console.log("BODY:", req.body);
    res.json({
        success: true,
        type: "RSE"
    });

}

// =====================================================
// UPLOAD MODULAB
// =====================================================

async function uploadModulab(req, res) {

    const data = await pdfParser(req.file.buffer);
    const chunks = chunkText(data.text || "");

    documents.push({
        id: generateId(),
        type: "MODULAB",
        filename: req.file.originalname,
        chunks: chunks.map((t, i) => ({
            id: `${Date.now()}_${i}`,
            text: t
        }))
    });
    console.log("UPLOAD MODULAB RECEBIDO");
    console.log("FILE:", req.file);

    res.json({
        success: true,
        type: "MODULAB"
    });
}

// =====================================================
// REWRITE ENGINE (CAG CORE)
// =====================================================

async function rewriteRSE(req, res) {

    const rse = buildContextByType("RSE");
    const lab = buildContextByType("MODULAB");

    if (!rse) {
        return res.status(400).json({
            success: false,
            error: "Sem RSE carregado"
        });
    }

    if (!lab) {
        return res.status(400).json({
            success: false,
            error: "Sem Modulab carregado"
        });
    }

    const prompt = `
És um motor clínico de REESCRITA DE DOCUMENTOS.

IMPORTANTE:
- NÃO és um assistente
- NÃO respondes a perguntas
- NÃO explicas nada
- NÃO dás recomendações
- NÃO analisas o texto

TAREFA ÚNICA:
Reescrever o Registo de Saúde Eletrónico (RSE) atualizado com base no MODULAB.

REGRAS ABSOLUTAS:
- Responde APENAS com o RSE final
- NÃO escrevas texto fora do documento
- NÃO expliques valores laboratoriais
- NÃO interpretes resultados
- NÃO uses linguagem conversacional
- Mantém estrutura clínica original
- MODULAB substitui sempre o RSE em valores laboratoriais
- Usa português europeu

FORMATO OBRIGATÓRIO:
Markdown clínico limpo

================ RSE ORIGINAL ================

${rse}

================ MODULAB ================

${lab}

================ OUTPUT (APENAS RSE FINAL) ================
`;

    const result = await callLLM(prompt);

    res.json({
        success: true,
        result
    });
}

// =====================================================
// RESET
// =====================================================

async function endSession(req, res) {
    documents = [];
    cache = [];

    res.json({ success: true });
}

// =====================================================
// INFO
// =====================================================

async function getSessionInfo(req, res) {
    res.json({
        rse: documents.filter(d => d.type === "RSE").length,
        modulab: documents.filter(d => d.type === "MODULAB").length,
        total: documents.length
    });
}

module.exports = {
    uploadRSE,
    uploadModulab,
    rewriteRSE,
    endSession,
    getSessionInfo
};