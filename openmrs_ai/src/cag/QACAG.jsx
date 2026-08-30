import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { uploadQAPDF, askQA } from "../services/qaCagService";

export default function QACAGPage() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await uploadQAPDF(file);

        setMessages((prev) => [
            ...prev,
            {
                role: "system",
                text: `PDF carregado: **${file.name}**`
            }
        ]);
    };

    const handleAsk = async () => {
        if (!question.trim()) return;

        const q = question;
        setQuestion("");

        setMessages((prev) => [...prev, { role: "user", text: q }]);

        setLoading(true);

        const res = await askQA(q);

        setMessages((prev) => [
            ...prev,
            { role: "ai", text: res.answer }
        ]);

        setLoading(false);
    };

    const bubbleStyle = (role) => ({
        maxWidth: "80%",
        padding: "12px 14px",
        borderRadius: 14,
        fontSize: 14,
        lineHeight: 1.5,
        background:
            role === "user"
                ? "#2563eb"
                : role === "ai"
                    ? "#f3f4f6"
                    : "#ecfeff",
        color: role === "user" ? "white" : "#111827",
        alignSelf:
            role === "user"
                ? "flex-end"
                : "flex-start",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    });

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 40px)",
                padding: 20,
                boxSizing: "border-box"
            }}
        >
            {/* HEADER */}
            <div style={{ marginBottom: 15 }}>
                <h2
                    style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: 25
                    }}
                >
                    Pesquisa de Informação
                </h2>

                <p
                    style={{
                        marginTop: 6,
                        color: "#6b7280",
                        fontSize: 16
                    }}
                >
                    Obter informação presente no documento carregado.
                </p>
            </div>

            {/* UPLOAD */}
            <div
                style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    padding: 14,
                    borderRadius: 0,
                    marginBottom: 15
                }}
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleUpload}
                />
            </div>

            {/* CHAT */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 18,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 0,
                    minHeight: 0
                }}
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        style={bubbleStyle(m.role)}
                    >
                        <ReactMarkdown>
                            {m.text}
                        </ReactMarkdown>
                    </div>
                ))}

                {loading && (
                    <div
                        style={{
                            ...bubbleStyle("ai"),
                            opacity: 0.6
                        }}
                    >
                        A pensar...
                    </div>
                )}
            </div>

            {/* INPUT */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 15,
                    flexWrap: "wrap"
                }}
            >
                <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Que informação deseja obter do documento..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAsk();
                    }}
                    style={{
                        flex: 1,
                        minWidth: 250,
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        outline: "none",
                        fontSize: 16
                    }}
                />

                <button
                    onClick={handleAsk}
                    style={{
                        padding: "10px 18px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        background: "#1f2937",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                    }}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}