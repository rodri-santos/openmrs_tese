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
    return (data.response || "")
        .replace(/<\/?end_of_turn>/g, "")
        .replace(/enfermeiragem/gi, "enfermagem")
        .replace(/n\.?\s*º?\s*de\s*matr[ií]cula/gi, "N.º SNS")
        .replace(/\*\*/g, "")
        .replace(/^\s*\*\s+/gm, "- ")
        .trim();
}

// 1st consultation template made by a nurse from IPO Coimbra

const FIRST_CONSULTATION_TEMPLATE = `
Protótipo – Registo de Consulta de Enfermagem
Terapêutica Antineoplásica Oral – 1ª vez/acompanhamento

Identificação da Consulta: OM – antineoplásico oral

* Consulta: 1ª vez/Acompanhamento
  Idade:
  Diagnóstico: Carcinoma da mama esquerda/direita
  Terapêutica antineoplásica:

* Antecedentes Pessoais
  História Ginecológica:
  Menarca:
  Contraceção prévia:
  Gesta: ; Para:
  Amamentação:
  Menopausa:

* Antecedentes cirúrgicos:

* Antecedentes patológicos:

* Medicação habitual:

* Outras informações de saúde
  Alergias:
  Plano vacinal:
  História transfusional:

* Hábitos de vida:
  Alimentares:
  Tabágicos:
  Alcool:
  Chás/suplementos:

* Terapêutica Antineoplásica Oral
  Fármaco:
  Dose:
  Esquema:
  Medicação concomitante:

* Exame Objetivo:
  Estado geral:
  Consciente/Orientada:
  Humor:
  ECOG PS:
  Altura: m
  Peso: kg
  FC: bpmin
  TA: / mmHg
  SatO2: %
  Temperatura:
  Pele e mucosas:

* Avaliação Analítica
  Hemoglobina: g/dl
  Neutrófilos: mm3
  Leucócitos: mm3
  Plaquetas: mm3
  TGO/TGP: / U/L
  GGT: U/L

* Avaliação de Toxicidades (CTCAE)
  Náuseas/Vómitos:
  Diarreia:
  Obstipação:
  Mucosite:
  Fadiga:
  Artralgias/Mialgias:
  Alterações cutâneas:
  Neuropatia:
  Outros sintomas:

* Escalas (scores)
  MAT (medida de adesão terapêutica) - SClinico
  MUST
  Termómetro da angústia
  EORTC QLQ30
  Instrumentos adaptados do PR-CISE

* Plano
  Realiza ou não tratamento
  Intervenções de enfermagem
  Fármaco:
  Dose:

* Planificação da Consulta Seguinte
  Próxima consulta de enfermagem:
  Análises prévias:
  Consulta médica:
  Transporte:
  `;

// generate 1st consultation record and task specific prompt

async function generateFirstConsultation(req, res) {
    const { instruction } = req.body;
    if (!instruction || !instruction.trim()) {
        return res.status(400).json({
            success: false,
            result: "Sem informação clínica para gerar o registo."
        });
    }

    const prompt = `

És um sistema de apoio à documentação clínica de enfermagem.

========================================================
TAREFA
======

Gerar um registo de enfermagem referente a uma primeira
consulta no contexto de terapêutica antineoplásica oral.

O registo final deve seguir a estrutura do template fornecido.

O template representa a estrutura de documentação pretendida
pelos profissionais de saúde.

========================================================
TEMPLATE DO REGISTO
===================

${FIRST_CONSULTATION_TEMPLATE}

========================================================
INFORMAÇÃO FORNECIDA PELO ENFERMEIRO
====================================

${instruction}

========================================================
REGRAS ABSOLUTAS
================

1. Usa exclusivamente a informação fornecida pelo enfermeiro.
2. Não inventes informação clínica.
3. Não inventes valores, sintomas, diagnósticos, medicamentos,
   doses, resultados analíticos, sinais vitais ou qualquer outro
   dado clínico.
4. Não faças inferências clínicas que não estejam explicitamente
   suportadas pela informação fornecida.
5. Se determinada informação não estiver disponível, mantém
   o respetivo campo vazio.
6. Não preenchas campos com valores fictícios.
7. Mantém todas as secções existentes no template.
8. Mantém a ordem das secções.
9. Mantém os títulos e nomes dos campos do template.
10. Não cries novas secções.
11. Não elimines secções existentes.
12. Coloca cada informação fornecida pelo enfermeiro no campo
    correspondente do template.
13. Se uma informação não tiver correspondência clara com um
    campo específico, coloca-a no campo mais adequado sem
    criar uma nova secção.
14. Mantém os valores e unidades fornecidos pelo enfermeiro.
15. Não alteres o significado da informação clínica.
16. Usa linguagem profissional de documentação de enfermagem.
17. Usa exclusivamente português europeu.
18. Não utilizes português do Brasil.
19. Usa "enfermagem" e nunca "enfermeiragem".
20. Não acrescentes explicações, comentários ou justificações.
21. Não escrevas nada antes ou depois do registo.
22. A resposta deve conter APENAS o registo clínico final.

========================================================
OUTPUT
======

Registo clínico final:
`;

    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });

    } catch (err) {
        console.error(
            "First consultation generation error:",
            err
        );
        return res.status(500).json({
            success: false,
            result: "Erro ao gerar registo de primeira consulta."
        });
    }
}
// apply further clinician instructions

async function updateFirstConsultation(req, res) {
    const {
        record,
        instruction
    } = req.body;

    if (!record || !record.trim()) {
        return res.status(400).json({
            success: false,
            result: "Sem registo para atualizar."
        });
    }
    if (!instruction || !instruction.trim()) {
        return res.status(400).json({
            success: false,
            result: "Sem instrução para aplicar."
        });
    }

    const prompt = `

És um sistema de apoio à documentação clínica de enfermagem.

========================================================
TAREFA
======

Recebes:

1. Um registo clínico existente.
2. Uma nova instrução do enfermeiro.

Deves atualizar o registo existente de acordo com a instrução,
mantendo a restante informação.

========================================================
REGISTO CLÍNICO EXISTENTE
=========================

${record}

========================================================
NOVA INSTRUÇÃO
==============

${instruction}

========================================================
REGRAS ABSOLUTAS
================

1. Mantém toda a informação existente que não esteja relacionada
   com a instrução.
2. Altera apenas o que for necessário para cumprir a instrução.
3. Não inventes informação clínica.
4. Não cries valores fictícios.
5. Não inventes sintomas, diagnósticos, medicamentos, doses,
   resultados analíticos ou outros dados.
6. Usa exclusivamente informação presente no registo ou
   explicitamente fornecida na nova instrução.
7. Se a instrução pedir uma informação que não esteja disponível,
   não inventes essa informação.
8. Não elimines informação clínica importante.
9. Mantém a estrutura clínica existente.
10. Mantém os títulos e listas existentes.
11. Mantém a organização do registo.
12. Usa português europeu.
13. Não utilizes português do Brasil.
14. Usa "enfermagem" e nunca "enfermeiragem".
15. Não acrescentes explicações ou comentários.
16. Não descrevas as alterações realizadas.
17. Responde apenas com o registo clínico atualizado.

========================================================
OUTPUT
======

Novo registo clínico:`;

    try {
        const result = await callLLM(prompt);
        return res.json({
            success: true,
            result
        });

    } catch (err) {
        console.error(
            "First consultation update error:",
            err
        );
        return res.status(500).json({
            success: false,
            result: "Erro ao atualizar registo."
        });
    }
}

module.exports = {
    generateFirstConsultation,
    updateFirstConsultation
};
