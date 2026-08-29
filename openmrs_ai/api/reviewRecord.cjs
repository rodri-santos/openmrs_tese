async function callLLM(prompt, temperature = 0) {

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
                temperature,
                num_predict: 1500
            }
        })
    });

    const data = await response.json();
    return (data.response || "")
        .replace(/<\/?end_of_turn>/g, "")
        .replace(/Registo Clínico Revisado/gi, "Registo Clínico Revisto")
        .replace(/\bRevisado\b/gi, "Revisto")
        .replace(/\brevisado\b/gi, "revisto")
        .trim();
}

async function reviewRecord(req, res) {

    const { record } = req.body;
    if (!record || !record.trim()) {
        return res.json({
            success: false,
            result: "Sem registo para rever."
        });
    }

    const prompt = `
És um assistente de revisão de registos clínicos.

TAREFA:
Melhorar a qualidade do texto clínico fornecido.

REGRAS:
- não inventar informação
- não adicionar novos dados clínicos
- não remover informação importante
- não mudar para unidades SI nem alterar nenhumas unidades já presentes (ex: manter "mm3", nunca converter para "x 10^9/L")
- não alterar títulos
- corrigir apenas:
  • ortografia
  • gramática
  • clareza
  • estrutura

EXEMPLO DE MANUTENÇÃO DE UNIDADES:
Entrada: Neutrófilos: x mm3 | Leucócitos: y mm3
Saída:
- Neutrófilos: x mm3
- Leucócitos: y mm3

FORMATAÇÃO:
- texto clínico em formato limpo
- usar bullets quando fizer sentido
- manter linguagem médica profissional
- português europeu

REGISTO ORIGINAL:

${record}

REGISTO REVISTO:
`;

    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });

    } catch (err) {
        console.error("Review error:", err);
        return res.status(500).json({
            success: false,
            result: "Erro ao rever registo."
        });
    }
}

module.exports = {
    reviewRecord
};