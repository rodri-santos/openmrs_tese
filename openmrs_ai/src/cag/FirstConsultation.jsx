import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FirstConsultation() {
    const [instruction, setInstruction] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!instruction.trim()) return;

        setLoading(true);
        setResult("");

        try {
            const res = await fetch(
                "http://localhost:3001/api/first-consultation/generate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ instruction })
                }
            );

            const data = await res.json();
            setResult(data.result);
        } catch (err) {
            setResult("Erro ao gerar registo clínico.");
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
                        1ª Consulta
                    </h3>

                    <p style={{ fontSize: 12, color: "#6b7280" }}>
                        Introduz informação clínica para gerar registo estruturado.
                    </p>
                </div>

                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0 }}>Notas clínicas</h3>

                    <textarea
                        rows={20}
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="Ex: Doente refere dor torácica há 2 dias..."
                        style={{
                            width: "100%",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            padding: 10,
                            outline: "none",
                            resize: "none",
                            fontSize: 14
                        }}
                    />
                </div>

                <div style={panelStyle}>
                    <button
                        style={buttonStyle}
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? "A gerar..." : "Gerar Registo"}
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
                        Registo Clínico
                    </h3>

                    <div
                        style={{
                            marginTop: 20,
                            fontSize: 14,
                            lineHeight: 1.6
                        }}
                    >
                        {loading && (
                            <p style={{ color: "#6b7280" }}>
                                A gerar registo clínico...
                            </p>
                        )}

                        {!loading && !result && (
                            <p style={{ color: "#9ca3af" }}>
                                O resultado aparecerá aqui após geração.
                            </p>
                        )}

                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}