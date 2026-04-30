const pdfParser = require("pdf-parse");

console.log("*****************************************");
console.log("🚀 SISTEMA CAG V2 (VERSÃO CLASSE) CARREGADO!");
console.log("Caminho: " + __filename);
console.log("*****************************************");

let sessionContext = "";
let cache = [];

async function callLLM(prompt) {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gemma3:27b-it-qat",
            prompt: prompt,
            stream: false
        })
    });
    const data = await response.json();
    return data.response;
}

async function handleCAGQuery(req, res) {
    const { question } = req.body;
    const hit = cache.find(c => c.question.toLowerCase().trim() === question.toLowerCase().trim());
    if (hit) return res.json({ answer: hit.answer, cached: true });

    const prompt = `Contexto: ${sessionContext || "Vazio"}\n\nPergunta: ${question}\n\nResponde apenas com base no contexto.`;

    try {
        const answer = await callLLM(prompt);
        cache.push({ question, answer });
        res.json({ answer, cached: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function uploadPDF(req, res) {
    if (!req.file) return res.status(400).json({ success: false, error: "Ficheiro não recebido." });

    try {
        console.log("📥 A processar novo PDF...");

        // --- TENTATIVA DE IMPORTAÇÃO DIRETA ---
        // Se o require normal falhou, tentamos ir buscar a função diretamente ao motor
        let pdf;
        try {
            pdf = require('pdf-parse/lib/pdf-parse.js');
        } catch (e) {
            pdf = require('pdf-parse');
        }

        // Garantir que temos a função de extração
        const parse = (typeof pdf === 'function') ? pdf : (pdf.default || pdf.PDFParse);

        if (!parse) throw new Error("Não foi possível encontrar a função de extração.");

        // Executar a extração (pdf-parse é SEMPRE uma função que recebe o buffer)
        const data = await parse(req.file.buffer);

        // Verificação de segurança
        const text = data.text || "";

        if (text.trim().length === 0) {
            console.log("⚠️ A extração falhou (0 caracteres). O PDF pode ser uma imagem/scan.");
            return res.status(422).json({
                success: false,
                error: "O PDF parece estar vazio ou é uma imagem (não selecionável)."
            });
        }

        sessionContext += "\n" + text;
        console.log("✅ PDF lido com sucesso!");
        console.log("📊 Caracteres extraídos:", text.length);
        console.log("📝 Início do texto:", text.substring(0, 100).replace(/\n/g, ' '));

        res.json({ success: true, message: "PDF carregado!" });
    } catch (error) {
        console.error("❌ ERRO NO UPLOAD:", error.message);
        res.status(500).json({ success: false, error: "Erro: " + error.message });
    }
}

async function endSession(req, res) {
    sessionContext = "";
    cache = [];
    res.json({ success: true });
}

module.exports = {
    handleCAGQuery,
    uploadPDF,
    endSession
};