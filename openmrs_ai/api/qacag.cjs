const pdfParser = require("pdf-parse");

let sessionChunks = [];
let cache = [];

const MAX_CONTEXT_CHUNKS = 5;

// =====================================================
// Utils
// =====================================================

function normalizeText(text = "") {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function chunkText(text, chunkSize = 2500, overlap = 300) {

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
// Build Context
// =====================================================

function buildContext() {

    return sessionChunks
        .slice(-MAX_CONTEXT_CHUNKS)
        .map(c => c.text)
        .join("\n\n");
}

// =====================================================
// LLM
// =====================================================

async function callLLM(prompt) {

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

                options: {
                    temperature: 0.2,
                    num_predict: 700
                }
            })
        }
    );

    const data = await response.json();

    return data.response;
}

// =====================================================
// Upload PDF
// =====================================================

async function uploadPDF(req, res) {

    try {

        console.log("QA PDF RECEBIDO");

        const data =
            await pdfParser(req.file.buffer);

        const text =
            data.text || "";

        const chunks =
            chunkText(text);

        sessionChunks.push(
            ...chunks.map((chunk, i) => ({
                id: `${Date.now()}_${i}`,
                text: chunk
            }))
        );

        console.log("QA PDF PROCESSADO");

        res.json({
            success: true,
            chunks: chunks.length
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// =====================================================
// QA Query
// =====================================================

async function askQuestion(req, res) {

    try {

        const { question } = req.body;

        const normalized =
            normalizeText(question);

        const cached =
            cache.find(
                c => c.question === normalized
            );

        if (cached) {

            return res.json({
                success: true,
                cached: true,
                answer: cached.answer
            });
        }

        const context =
            buildContext();

        const prompt = `
És um assistente clínico QA.

Responde APENAS com base no contexto.

Se a resposta não existir:

"Não encontrei essa informação."

================ CONTEXTO ================

${context}

================ PERGUNTA ================

${question}

================ RESPOSTA ================
`;

        const answer =
            await callLLM(prompt);

        cache.push({
            question: normalized,
            answer
        });

        res.json({
            success: true,
            cached: false,
            answer
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// =====================================================
// Reset
// =====================================================

async function endSession(req, res) {

    sessionChunks = [];
    cache = [];

    res.json({
        success: true
    });
}

module.exports = {
    uploadPDF,
    askQuestion,
    endSession
};