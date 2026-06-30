async function callLLM(prompt, temperature = 0.1) {

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

async function reviewRecord(req, res) {

    const { record } = req.body;

    const prompt = `
És um sistema de revisão documental clínica.

TAREFA:
Revê e melhora a qualidade de escrita e estrutura do seguinte registo clínico.

CORRIGIR:
- erros ortográficos
- erros gramaticais
- inconsistências
- duplicações
- linguagem pouco clínica

REGRAS CRÍTICAS:
- Nunca inventes informação
- Nunca acrescentes informação clínica
- Não removes informação clínica relevante
- Mantém sempre o significado original

FORMATAÇÃO OBRIGATÓRIA:
- Responde em Markdown estruturado
- Cada nova ideia clínica deve estar numa nova linha iniciada por "-"
- Não usar parágrafos longos
- Organizar informação de forma hierárquica quando apropriado
- Subníveis devem ser indentados com 2-4 espaços + "-"

RESPONDE APENAS EM JSON:

{
  "sections": [
    {
      "title": "",
      "items": [
        {
          "label": "",
          "value": "",
          "children": []
        }
      ]
    }
  ]
}

REGISTO ORIGINAL:

${record}

RESPOSTA:
`;

    const result = await callLLM(prompt);

    res.json({

        success: true,

        result

    });

}

module.exports = {

    reviewRecord

};