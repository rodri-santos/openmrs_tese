async function callLLM(prompt, temperature = 0.2) {

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

    return data.response
        .replace(/<\/?end_of_turn>/g, "")
        .trim();
}

async function generateFirstConsultation(req, res) {

    const { instruction } = req.body;

    const prompt = `
És um sistema de apoio à documentação clínica.

Tarefa:
Gerar um registo de enfermagem referente à primeira consulta.

Regras:

- Usa português europeu.
- Escreve em linguagem clínica.
- Não inventes informação não suportada.
- Mantém uma estrutura clara.
- Responde apenas com o registo.

Informação fornecida:

${instruction}

Registo:
`;

    const result = await callLLM(prompt);

    res.json({

        success: true,

        result

    });

}

module.exports = {

    generateFirstConsultation

};