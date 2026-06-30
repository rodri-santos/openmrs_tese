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

        const res = await fetch(
            "http://localhost:3001/api/review/generate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    record
                })
            }
        );

        const data = await res.json();

        setResult(formatFallback(data.result));

        setLoading(false);

    };

    return (

        <div style={{ padding: 25 }}>

            <h2>Rever Registo Clínico</h2>

            <textarea
                rows={14}
                value={record}
                onChange={(e) => setRecord(e.target.value)}
                placeholder="Cole aqui o registo clínico..."
                style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8
                }}
            />

            <button
                onClick={handleReview}
                style={{
                    marginTop: 20,
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer"
                }}
            >

                {loading ? "A rever..." : "Rever Registo"}

            </button>

            <div
                style={{
                    marginTop: 30,
                    background: "white",
                    padding: 20,
                    borderRadius: 12
                }}
            >

                <ReactMarkdown>{result}</ReactMarkdown>

            </div>

        </div>

    );

}