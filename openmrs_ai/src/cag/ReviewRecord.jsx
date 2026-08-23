import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ReviewRecord() {

    const [record, setRecord] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReview = async () => {

        if (!record.trim()) return;

        setLoading(true);

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

            setResult(data.result || "");

        } catch (err) {

            console.error(err);

            setResult("Erro ao gerar revisão.");

        } finally {

            setLoading(false);

        }

    };

    const panelStyle = {
        background: "#f8fafc",
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        border: "1px solid #e5e7eb"
    };

    const buttonStyle = {
        width: "100%",
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        background: "white",
        cursor: "pointer",
        fontWeight: 600
    };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                gap: 20,
                padding: 20,
                height: "calc(100vh - 40px)",
                boxSizing: "border-box"
            }}
        >

            {/* ESQUERDA */}

            <div
                style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 20,
                    boxShadow: "0 4px 14px rgba(0,0,0,.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 15,
                        gap: 10,
                        flexWrap: "wrap"
                    }}
                >

                    <h3
                        style={{
                            margin: 0,
                            fontSize: 25,
                            fontWeight: "bold"
                        }}
                    >
                        Registo Clínico Original
                    </h3>

                    <button
                        onClick={handleReview}
                        disabled={loading}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            background: "#1f2937",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 600,
                            whiteSpace: "nowrap"
                        }}
                    >
                        {loading ? "A rever..." : "Rever Registo"}
                    </button>

                </div>

                <textarea
                    value={record}
                    onChange={(e) => setRecord(e.target.value)}
                    placeholder="Cole um registo clínico para rever a qualidade da escrita, corrigir erros ortográficos, gramaticais e melhorar a estrutura do documento."
                    style={{
                        flex: 1,
                        resize: "none",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: 15,
                        fontFamily: "Arial",
                        fontSize: 16,
                        lineHeight: 1.6,
                        minHeight: 0
                    }}
                />

            </div>

            {/* DIREITA */}

            <div
                style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 20,
                    boxShadow: "0 4px 14px rgba(0,0,0,.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 15,
                        gap: 10,
                        flexWrap: "wrap"
                    }}
                >

                    <h3
                        style={{
                            margin: 0,
                            fontSize: 25,
                            fontWeight: "bold"
                        }}
                    >
                        Registo Clínico Revisto
                    </h3>

                    <button
                        onClick={async () => {
                            if (!result) return;
                            await navigator.clipboard.writeText(result);
                            alert("Registo copiado.");
                        }}
                        disabled={!result}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            background: "#1f2937",
                            color: "#ffffff",
                            cursor: result ? "pointer" : "default",
                            fontWeight: 600,
                            whiteSpace: "nowrap"
                        }}
                    >
                        Copiar
                    </button>

                </div>

                <div
                    style={{
                        flex: 1,
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: 15,
                        paddingLeft: 25,
                        overflowY: "auto",
                        lineHeight: 1.6,
                        fontSize: 14,
                        minHeight: 0
                    }}
                >
                    {result ? (
                        <ReactMarkdown>{result}</ReactMarkdown>
                    ) : (
                        <p
                            style={{
                                color: "#9ca3af",
                                fontFamily: "Arial",
                                fontSize: 16,
                                fontWeight: "bold"
                            }}
                        >
                            O resultado da revisão aparecerá aqui.
                        </p>
                    )}
                </div>

            </div>

        </div>
    );
}