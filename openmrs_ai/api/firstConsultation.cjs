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
                num_predict: 1800

            }

        })

    });

    const data = await response.json();

    return data.response
        .replace(/<\/?end_of_turn>/g, "")
        .replace(/enfermeiragem/gi, "enfermagem")
        .replace(/n\.?\s*º?\s*de\s*matr[ií]cula/gi, "N.º SNS")
        .replace(/\*\*/g, "")
        .replace(/^\s*\*\s+/gm, "- ")
        .trim();

}

// =======================================================
// GERAR PRIMEIRO REGISTO
// =======================================================

async function generateFirstConsultation(req, res) {

    const { instruction } = req.body;

    const prompt = `
És um sistema de apoio à documentação clínica.

Objetivo:
Gerar um registo de enfermagem referente à primeira consulta.

Regras obrigatórias:

- Usa português de portugal europeu.
- Escreve apenas informação suportada.
- Não inventes dados.
- Não cries valores fictícios.
- Organiza o texto em secções clínicas.
- Mantém uma linguagem profissional.
- Responde apenas com o registo.
- É enfermagem em vez de enfermeiragem.
- No fim, quero sempre "Enfermeiro Responsável: [Nome]".

Notas clínicas:

${instruction}

Registo:
`;

    const result = await callLLM(prompt);

    res.json({

        success: true,
        result

    });

}

// =======================================================
// APLICAR INSTRUÇÕES AO REGISTO
// =======================================================

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
- Nunca apagues conteúdo que não esteja relacionado com a instrução.
- Mantém o formato clínico.
- Mantém títulos e listas.
- Responde apenas com o novo registo.
- Não insiras valores que não sejam pedidos na Instrução.

========================
REGISTO

${record}

========================
INSTRUÇÃO

${instruction}

========================

Novo registo:
`;

    const result = await callLLM(prompt);

    res.json({

        success: true,
        result

    });

}

module.exports = {
    generateFirstConsultation,
    updateFirstConsultation
};