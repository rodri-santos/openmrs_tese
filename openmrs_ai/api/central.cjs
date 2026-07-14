const fetch = global.fetch;

let currentRecord = "";
let history = [];

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

                    num_predict: 2500

                }

            })

        }
    );

    const data = await response.json();

    return data.response
        .replace(/<\/end_of_turn>/g, "")
        .trim();

}

async function generateRecord(req, res) {

    const { notes } = req.body;

    if (!notes?.trim()) {

        return res.status(400).json({

            success: false,

            error: "Sem notas clínicas."

        });

    }

    const prompt = `
És um sistema de apoio à documentação clínica.

Tarefa:
Reescrever e estruturar notas clínicas num registo de enfermagem completo e coerente.

Regras:
- Usa português europeu.
- Usa linguagem clínica natural.
- NÃO uses placeholders como [Inserir ...].
- NÃO deixes campos vazios.
- Se informação não existir, omite a secção ou adapta o texto.
- Não inventes informação clínica.
- Mantém toda a informação relevante.
- Escreve de forma fluida e clínica (não estilo formulário rígido).

Estrutura desejada (pode ser adaptada conforme necessário):
- Identificação
- Subjetivo
- Objetivo
- Antecedentes
- Medicação
- Avaliação
- Plano

Notas clínicas:
${notes}

Registo final:
`;

    const result = await callLLM(prompt);

    currentRecord = result;

    history = [result];

    res.json({

        success: true,

        result

    });

}

async function editRecord(req, res) {

    const { instruction } = req.body;

    if (!currentRecord) {
        return res.status(400).json({
            success: false,
            error: "Ainda não existe nenhum registo."
        });
    }

    if (!instruction?.trim()) {
        return res.status(400).json({
            success: false,
            error: "Sem instrução."
        });
    }

    const prompt = `
És um editor de documentação clínica.

Recebes:

1. Um registo clínico já existente.

2. Uma instrução do enfermeiro.

A tua função é editar apenas o que foi pedido.

REGRAS ABSOLUTAS

- Nunca respondas em modo conversa.
- Nunca expliques alterações.
- Nunca faças comentários.
- Nunca acrescentes informação clínica não pedida.
- Nunca elimines secções inteiras.
- Mantém exatamente a mesma estrutura.
- Mantém Markdown.
- Mantém títulos e subtítulos.
- Apenas altera o necessário.

==========================
REGISTO

${currentRecord}

==========================
INSTRUÇÃO

${instruction}

==========================
OUTPUT
`;

    const result = await callLLM(prompt);

    currentRecord = result;

    history.push(result);

    res.json({
        success: true,
        result
    });

}

async function undoEdit(req, res) {

    if (history.length <= 1) {

        return res.json({

            success: true,

            result: currentRecord,

            canUndo: false

        });

    }

    history.pop();

    currentRecord = history[history.length - 1];

    res.json({

        success: true,

        result: currentRecord,

        canUndo: history.length > 1

    });

}

async function getCurrentRecord(req, res) {

    res.json({

        success: true,

        result: currentRecord,

        historyLength: history.length

    });

}


async function resetSession(req, res) {

    currentRecord = "";

    history = [];

    res.json({

        success: true

    });

}


module.exports = {
    generateRecord,
    editRecord,
    undoEdit,
    getCurrentRecord,
    resetSession
};