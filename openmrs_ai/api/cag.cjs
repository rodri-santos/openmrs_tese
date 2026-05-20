const pdfParser = require("pdf-parse");

// =====================================================
// Sessão temporária (RAM)
// =====================================================

// Estrutura:
//
// documents = [
//   {
//      id,
//      filename,
//      uploadedAt,
//      chunks: [
//          {
//              id,
//              text
//          }
//      ]
//   }
// ]

let documents = [];

let cache = [];

const MAX_CONTEXT_CHUNKS = 5;

function normalizeText(text = "") {

    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function generateId() {

    return Math.random()
        .toString(36)
        .substring(2, 12);
}

// =====================================================
// Chunking
// =====================================================

function chunkText(
    text,
    chunkSize = 1200,
    overlap = 150
) {

    const chunks = [];

    let start = 0;

    while (start < text.length) {

        const end = start + chunkSize;

        chunks.push(
            text.slice(start, end)
        );

        start += chunkSize - overlap;
    }

    return chunks;
}

function buildContext(question = "") {

    const normalizedQuestion =
        normalizeText(question);

    const questionWords =
        normalizedQuestion
            .split(" ")
            .filter(word => word.length > 2);

    // Flatten de todos os chunks
    const allChunks =
        documents.flatMap(doc =>

            doc.chunks.map(chunk => ({
                ...chunk,
                source: doc.filename
            }))
        );

    // Ranking lexical simples
    const scoredChunks =
        allChunks.map(chunk => {

            const normalizedChunk =
                normalizeText(chunk.text);

            let score = 0;

            for (const word of questionWords) {

                if (
                    normalizedChunk.includes(word)
                ) {
                    score++;
                }
            }

            return {
                ...chunk,
                score
            };
        });

    // Seleciona os melhores
    const selectedChunks =
        scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_CONTEXT_CHUNKS);

    // Sem contexto relevante
    if (
        selectedChunks.length === 0
    ) {
        return "";
    }

    return selectedChunks
        .map(chunk =>

            `[DOCUMENTO: ${chunk.source}]

${chunk.text}`
        )
        .join("\n\n");
}

// =====================================================
// Warmup modelo
// =====================================================

async function warmupModel(req, res) {

    try {

        console.log(
            "Starting model..."
        );

        await fetch(
            "http://localhost:11434/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    model:
                        "gemma3:12b-it-qat",

                    prompt: "Hello",

                    stream: false,

                    keep_alive: "20m"
                })
            }
        );

        console.log("Model up.");

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "ERROR WARMUP:",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message
        });
    }
}

// =====================================================
// LLM
// =====================================================

async function callLLM(
    prompt,
    temperature = 0.2
) {

    const response = await fetch(
        "http://localhost:11434/api/generate",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                model:
                    "gemma3:12b-it-qat",

                prompt,

                stream: false,

                keep_alive: "20m",

                options: {

                    temperature,

                    num_predict: 512
                }
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            "Erro ao contactar o Ollama."
        );
    }

    const data =
        await response.json();

    return data.response;
}

function cleanAnswer(text = "") {

    return text

        // remove markdown quebrado
        .replace(/\*\*/g, "")

        // remove bullets estranhos
        .replace(/\s+\*\s+/g, " ")

        // remove múltiplos espaços
        .replace(/\s{2,}/g, " ")

        // corrige linhas
        .replace(/\n{3,}/g, "\n\n")

        .trim();
}

// =====================================================
// Query principal
// =====================================================

async function handleCAGQuery(req, res) {

    try {

        const {
            question,
            temperature = 0.2,
            useCache = true
        } = req.body;

        if (
            !question ||
            question.trim().length === 0
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Pergunta inválida."
            });
        }

        // =====================================================
        // Cache lookup
        // =====================================================

        const normalizedQuestion =
            normalizeText(question);

        const hit = useCache
            ? cache.find(c =>

                normalizeText(c.question)
                === normalizedQuestion

                &&

                c.temperature === temperature
            )
            : null;

        if (hit) {

            console.log(
                "CACHE HIT"
            );

            return res.json({

                success: true,

                cached: true,

                answer: hit.answer
            });
        }

        // =====================================================
        // Build contexto
        // =====================================================

        const context =
            buildContext(question);

        // =====================================================
        // Prompt
        // =====================================================

        const prompt = `
És um assistente clínico.

Responde APENAS com base no contexto fornecido.

NÃO inventes informação.

NÃO uses conhecimento externo.

Se a resposta não existir no contexto, responde:

"Não encontrei essa informação nos documentos fornecidos."

================ CONTEXTO ================

${context || "Sem documentos carregados."}

================ PERGUNTA ================

${question}

================ RESPOSTA ================
`;

        // =====================================================
        // LLM
        // =====================================================
        const rawAnswer =
            await callLLM(
                prompt,
                temperature
            );

        const answer =
            cleanAnswer(rawAnswer);

        // =====================================================
        // Cache store
        // =====================================================

        if (useCache) {

            cache.push({

                question,

                answer,

                temperature,

                timestamp: Date.now()
            });

            console.log(
                "Nova resposta guardada em cache."
            );
        }

        res.json({

            success: true,

            cached: false,

            temperature,

            answer
        });

    } catch (error) {

        console.error(
            "ERRO QUERY:",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message
        });
    }
}

// =====================================================
// Upload PDF
// =====================================================

async function uploadPDF(req, res) {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                error:
                    "Ficheiro não recebido."
            });
        }

        console.log(
            "A processar novo PDF..."
        );

        // =====================================================
        // Parse PDF
        // =====================================================

        const data =
            await pdfParser(
                req.file.buffer
            );

        const text =
            data.text || "";

        if (
            text.trim().length === 0
        ) {

            return res.status(422).json({

                success: false,

                error:
                    "PDF vazio ou scanned."
            });
        }

        // =====================================================
        // Chunking
        // =====================================================

        const chunks =
            chunkText(text);

        // =====================================================
        // Documento
        // =====================================================

        const document = {

            id: generateId(),

            filename:
                req.file.originalname,

            uploadedAt:
                Date.now(),

            chunks: chunks.map(
                (chunk, index) => ({

                    id:
                        `${Date.now()}_${index}`,

                    text: chunk
                })
            )
        };

        documents.push(document);

        console.log(
            "PDF carregado."
        );

        console.log(
            "Documento:",
            document.filename
        );

        console.log(
            "Chunks criados:",
            chunks.length
        );

        console.log(
            "Total documentos:",
            documents.length
        );

        // =====================================================
        // Response
        // =====================================================

        res.json({

            success: true,

            documentId:
                document.id,

            filename:
                document.filename,

            chunksCreated:
                chunks.length,

            totalDocuments:
                documents.length
        });

    } catch (error) {

        console.error(
            "ERRO NO UPLOAD:",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message
        });
    }
}

async function endSession(req, res) {

    try {

        documents = [];
        cache = [];

        console.log(
            "Sessão CAG limpa."
        );

        res.json({

            success: true,

            message:
                "Sessão terminada."
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            error: error.message
        });
    }
}

// =====================================================
// Info sessão
// =====================================================

async function getSessionInfo(req, res) {

    const totalChunks =
        documents.reduce(
            (acc, doc) =>
                acc + doc.chunks.length,
            0
        );

    res.json({

        success: true,

        totalDocuments:
            documents.length,

        totalChunks,

        cacheEntries:
            cache.length,

        documents:
            documents.map(doc => ({

                id: doc.id,

                filename:
                    doc.filename,

                uploadedAt:
                    doc.uploadedAt,

                chunks:
                    doc.chunks.length
            }))
    });
}

module.exports = {
    handleCAGQuery,
    uploadPDF,
    endSession,
    getSessionInfo,
    warmupModel
};