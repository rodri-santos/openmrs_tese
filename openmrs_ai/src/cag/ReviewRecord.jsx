import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { formatFallback } from "../utils/clinicalFormat";

export default function ReviewRecord() {
    const [record, setRecord] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReview = async () => {
        if (!record.trim()) return;

        setLoading(true);
        setResult("");

        try {
            const res = await fetch(
                "http://localhost:3001/api/review/generate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ record })
                }
            );

            const data = await res.json();
            setResult(formatFallback(data.result));
        } catch (err) {
            console.error(err);
            setResult("Erro ao rever registo clínico.");
        }

        setLoading(false);
    };

    const panelStyle = {
        background: "#f8fafc",
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        border: "1px solid #e5e7eb"
    };

    const buttonStyle = {
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        background: "#2563eb",
        color: "white",
        fontWeight: 600,
        width: "100%"
    };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "380px 1fr",
                height: "100%",
                gap: 0
            }}
        >
            {/* LEFT PANEL */}
            <div style={{ padding: 20, marginLeft: 45 }}>

                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0 }}>
                        Rever Registo Clínico
                    </h3>

                    <p style={{ fontSize: 12, color: "#6b7280" }}>
                        Corrige linguagem, estrutura e coerência do registo clínico.
                    </p>
                </div>

                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0 }}>
                        Registo original
                    </h3>

                    <textarea
                        rows={16}
                        value={record}
                        onChange={(e) => setRecord(e.target.value)}
                        placeholder="Cole aqui o registo clínico..."
                        style={{
                            width: "100%",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            padding: 10,
                            outline: "none",
                            resize: "none",
                            fontSize: 14,
                            lineHeight: 1.5
                        }}
                    />
                </div>

                <div style={panelStyle}>
                    <button
                        onClick={handleReview}
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            background: loading ? "#93c5fd" : "#2563eb"
                        }}
                    >
                        {loading ? "A rever..." : "Rever Registo"}
                    </button>
                </div>

            </div>

            {/* RIGHT PANEL */}
            <div
                style={{
                    padding: 20,
                    overflowY: "auto"
                }}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: 14,
                        padding: 24,
                        minHeight: "100%",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>
                        Resultado revisto
                    </h3>

                    {loading && (
                        <p style={{ color: "#6b7280" }}>
                            A analisar registo clínico...
                        </p>
                    )}

                    {!loading && !result && (
                        <p style={{ color: "#9ca3af" }}>
                            O resultado aparecerá aqui após revisão.
                        </p>
                    )}

                    <div
                        style={{
                            marginTop: 10,
                            fontSize: 14,
                            lineHeight: 1.6
                        }}
                    >
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}