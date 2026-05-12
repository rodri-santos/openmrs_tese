// api/cag.cjs

const pdfParser = require("pdf-parse");

// =========================
// Sessão temporária (RAM)
// =========================

let sessionDocuments = [];
let cache = [];

// =========================
// Config
// =========================

const MAX_CONTEXT_DOCUMENTS = 3;

// =========================
// Utils
// =========================

function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function buildContext() {
    return sessionDocuments
        .slice(-MAX_CONTEXT_DOCUMENTS)
        .join("\n\n");
}

// =========================
// LLM
// =========================

async function warmupModel(req, res) {

    try {

        console.log("A aquecer modelo...");

        await fetch("http://localhost:11434/api/generate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                model: "gemma3:12b-it-qat",
                prompt: "Hello",
                stream: false,
                keep_alive: "20m"
            })
        });

        console.log("Modelo pronto.");

        res.json({
            success: true
        });

    } catch (error) {

        console.error("ERRO WARMUP:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function callLLM(prompt) {

    const response = await fetch("http://localhost:11434/api/generate", {
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
                num_predict: 512,
                temperature: 0.2
            }
        })
    });

    if (!response.ok) {
        throw new Error("Erro ao contactar o Ollama.");
    }

    const data = await response.json();

    return data.response;
}

// =========================
// Query CAG
// =========================

async function handleCAGQuery(req, res) {
    try {
        const { question } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Pergunta inválida."
            });
        }

        // =========================
        // Cache hit
        // =========================

        const normalizedQuestion = normalizeText(question);

        const hit = cache.find(
            c => normalizeText(c.question) === normalizedQuestion
        );

        if (hit) {
            console.log("CACHE HIT");

            return res.json({
                success: true,
                cached: true,
                answer: hit.answer
            });
        }

        // =========================
        // Contexto
        // =========================

        const context = buildContext();

        const prompt = `
És um assistente clínico.

Responde APENAS com base no contexto fornecido.

Se a informação não estiver presente no contexto, diz:
"Não encontrei essa informação nos documentos fornecidos."

================ CONTEXTO ================

${context || "Sem documentos carregados."}

================ PERGUNTA ================

${question}

================ RESPOSTA ================
`;

        // =========================
        // Chamada ao LLM
        // =========================

        const answer = await callLLM(prompt);

        // =========================
        // Guardar cache
        // =========================

        cache.push({
            question,
            answer,
            timestamp: Date.now()
        });

        console.log("Nova resposta guardada em cache.");

        res.json({
            success: true,
            cached: false,
            answer
        });

    } catch (error) {
        console.error("ERRO QUERY:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// =========================
// Upload PDF
// =========================

async function uploadPDF(req, res) {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Ficheiro não recebido."
            });
        }

        console.log("A processar novo PDF...");

        // =========================
        // Parse PDF
        // =========================

        const data = await pdfParser(req.file.buffer);

        const text = data.text || "";

        // =========================
        // Verificações
        // =========================

        if (text.trim().length === 0) {
            return res.status(422).json({
                success: false,
                error: "O PDF parece estar vazio ou é uma imagem/scanned PDF."
            });
        }

        // =========================
        // Guardar em RAM
        // =========================

        sessionDocuments.push(text);

        console.log("PDF lido com sucesso.");
        console.log("Caracteres extraídos:", text.length);
        console.log("Número de documentos:", sessionDocuments.length);

        res.json({
            success: true,
            message: "PDF carregado com sucesso.",
            characters: text.length,
            documentsLoaded: sessionDocuments.length
        });

    } catch (error) {

        console.error("ERRO NO UPLOAD:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// =========================
// Reset sessão
// =========================

async function endSession(req, res) {
    try {

        sessionDocuments = [];
        cache = [];

        console.log("Sessão CAG limpa.");

        res.json({
            success: true,
            message: "Sessão terminada."
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// =========================
// Debug endpoint (opcional)
// =========================

async function getSessionInfo(req, res) {
    res.json({
        success: true,
        documentsLoaded: sessionDocuments.length,
        cacheEntries: cache.length
    });
}

// =========================
// Exports
// =========================

module.exports = {
    handleCAGQuery,
    uploadPDF,
    endSession,
    getSessionInfo,
    warmupModel
};