import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FirstConsultation() {

    const [instruction, setInstruction] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {

        if (!instruction.trim()) return;

        setLoading(true);

        const res = await fetch(
            "http://localhost:3001/api/first-consultation/generate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    instruction
                })
            }
        );

        const data = await res.json();

        setResult(data.result);

        setLoading(false);

    };

    return (

        <div style={{ padding: 25 }}>

            <h2>Gerar Registo da 1ª Consulta</h2>

            <textarea
                rows={10}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Introduza a informação da consulta..."
                style={{
                    width: "100%",
                    padding: 10,
                    marginTop: 20,
                    borderRadius: 8
                }}
            />

            <button
                onClick={handleGenerate}
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

                {loading ? "A gerar..." : "Gerar Registo"}

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