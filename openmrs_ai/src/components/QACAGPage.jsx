import { useState } from "react";

import ReactMarkdown from "react-markdown";

import {
    uploadQAPDF,
    askQA
} from "../services/qaCagService";

export default function QACAGPage() {

    const [question, setQuestion] =
        useState("");

    const [messages, setMessages] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const handleUpload = async (e) => {

        const file =
            e.target.files?.[0];

        if (!file) return;

        await uploadQAPDF(file);

        setMessages(prev => [
            ...prev,
            {
                role: "system",
                text: `PDF carregado: ${file.name}`
            }
        ]);
    };

    const handleAsk = async () => {

        if (!question.trim()) return;

        const q = question;

        setQuestion("");

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                text: q
            }
        ]);

        setLoading(true);

        const res =
            await askQA(q);

        setMessages(prev => [
            ...prev,
            {
                role: "ai",
                text: res.answer
            }
        ]);

        setLoading(false);
    };

    return (

        <div
            style={{
                padding: 20,
                maxWidth: 1000,
                margin: "0 auto"
            }}
        >

            <h2>QA-CAG</h2>

            <input
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
            />

            <div
                style={{
                    marginTop: 30,
                    marginBottom: 20
                }}
            >

                {
                    messages.map((m, i) => (

                        <div
                            key={i}

                            style={{
                                marginBottom: 20
                            }}
                        >

                            <b>{m.role}</b>

                            <div
                                style={{
                                    background: "#f5f5f5",
                                    padding: 12,
                                    borderRadius: 8
                                }}
                            >

                                <ReactMarkdown>
                                    {m.text}
                                </ReactMarkdown>

                            </div>
                        </div>
                    ))
                }

                {
                    loading &&
                    <p>A pensar...</p>
                }

            </div>

            <div
                style={{
                    display: "flex",
                    gap: 10
                }}
            >

                <input
                    value={question}

                    onChange={e =>
                        setQuestion(e.target.value)
                    }

                    style={{
                        flex: 1,
                        padding: 12
                    }}

                    placeholder="Pergunta algo..."
                />

                <button onClick={handleAsk}>
                    Enviar
                </button>

            </div>
        </div>
    );
}