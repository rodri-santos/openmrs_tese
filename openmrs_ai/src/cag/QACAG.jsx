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
                maxWidth: 900,
                margin: "0 auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                height: "100vh"
            }}
        >
            {/* HEADER */}
            <div style={{ marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontWeight: "bold", fontSize: 25 }}>Question/Answer</h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 16 }}>
                    Perguntar sobre o conteúdo do documento carregado
                </p>
            </div>

            {/* UPLOAD CARD */}
            <div
                style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 15
                }}
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleUpload}
                />
            </div>

            {/* CHAT AREA */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 10,
                    background: "#fafafa",
                    borderRadius: 12
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

            {/* INPUT BAR */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 10,
                    padding: 10,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12
                }}
            >
                <input
                    value={question}
                    onChange={(e) =>
                        setQuestion(e.target.value)
                    }
                    placeholder="Pergunte algo sobre o documento..."
                    style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        outline: "none"
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAsk();
                    }}
                />

                <button
                    onClick={handleAsk}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "#1f2937",
                        color: "white",
                        cursor: "pointer"
                    }}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}