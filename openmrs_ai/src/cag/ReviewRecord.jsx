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

    return (
        <div style={{ padding: 25, maxWidth: 1000, margin: "0 auto" }}>

            <h2>Rever Registo Clínico</h2>

            <textarea
                rows={14}
                value={record}
                onChange={(e) => setRecord(e.target.value)}
                placeholder="Cole aqui o registo clínico..."
                style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    marginTop: 10
                }}
            />

            <button
                onClick={handleReview}
                style={{
                    marginTop: 20,
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600
                }}
            >
                {loading ? "A rever..." : "Rever Registo"}
            </button>

            <div
                style={{
                    marginTop: 30,
                    background: "white",
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    minHeight: 200
                }}
            >

                {result ? (
                    <ReactMarkdown>{result}</ReactMarkdown>
                ) : (
                    <p style={{ color: "#9ca3af" }}>
                        O resultado aparecerá aqui após revisão.
                    </p>
                )}

            </div>

        </div>
    );
}