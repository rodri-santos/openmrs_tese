import { useState } from "react";
import jsPDF from "jspdf";
import { marked } from "marked";

export default function FirstConsultation() {
    const [instruction, setInstruction] = useState("");
    const [record, setRecord] = useState("");
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleGenerate = async () => {

        if (!instruction.trim()) return;
        setLoading(true);
        try {

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
            setHistory([]);
            setRecord(data.result);
            setInstruction("");
        } catch {
            alert("Erro ao gerar registo.");
        }
        setLoading(false);
    };

    const handleApplyInstruction = async () => {
        if (!instruction.trim()) return;
        if (!record.trim()) return;
        setLoading(true);
        try {
            setHistory(prev => [...prev, record]);
            const res = await fetch(
                "http://localhost:3001/api/first-consultation/update",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({

                        record,

                        instruction

                    })
                }
            );

            const data = await res.json();
            setRecord(data.result);
            setInstruction("");

        } catch {
            alert("Erro ao aplicar instruções.");
        }
        setLoading(false);
    };

    const parseMarkdownToLines = (text) => {
        const html = marked.parse(text);
        // remove tags HTML simples para jsPDF
        const temp = document.createElement("div");
        temp.innerHTML = html;

        return Array.from(temp.childNodes).map(node => {
            return node.textContent || "";
        });
    };

    const handleDownloadPDF = () => {
        if (!record.trim()) return;
        const doc = new jsPDF();
        const lines = parseMarkdownToLines(record);
        let y = 10;
        doc.setFont("helvetica");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            if (line.startsWith("REGISTO") || line.includes("CONSULTA")) {
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
            } else if (line.trim().endsWith(":")) {
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
            } else {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
            }

            const split = doc.splitTextToSize(line, 180);

            for (const s of split) {
                doc.text(s, 10, y);
                y += 6;
            }
        }
        const version = history.length + 1;
        doc.save(`registo_v${version}.pdf`);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setRecord(previous);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(record);
        alert("Registo copiado.");
    };

    // =====================================================

    const panelStyle = {
        background: "#f8fafc",
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        border: "1px solid #e5e7eb"
    };

    const buttonStyle = {
        padding: "10px 16px",
        border: "1px solid #d1d5db",
        borderRadius: 10,
        cursor: "pointer",
        background: "#1f2937",
        color: "#ffffff",
        fontWeight: 600
    };
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(340px, 380px) 1fr",
                gap: 20,
                height: "calc(100vh - 40px)",
                padding: 20,
                boxSizing: "border-box"
            }}
        >
            {/* LEFT */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0
                }}
            >
                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, fontWeight: "bold", fontSize: 23 }}>
                        Gerar e Trabalhar Registo da 1ª Consulta
                    </h3>

                    <p style={{ color: "#6b7280", fontSize: 16.3 }}>
                        Gera um registo com notas iniciais que pode ser iterativamente
                        trabalhado com novas instruções ou com edição manual.
                    </p>
                </div>

                <div
                    style={{
                        ...panelStyle,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    <h3
                        style={{
                            marginLeft: 2,
                            marginTop: 0,
                            fontSize: 20,
                            fontWeight: "bold"
                        }}
                    >
                        Instruções
                    </h3>

                    <textarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="Ex.: descrever antecedentes familiares, sintomas, medicação, agendamentos..."
                        style={{
                            flex: 1,
                            width: "100%",
                            resize: "none",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            padding: 10,
                            fontSize: 17,
                            fontFamily: "Arial",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                <div style={panelStyle}>
                    {!record ? (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            style={{ ...buttonStyle, width: "100%" }}
                        >
                            {loading ? "A gerar..." : "Gerar Registo"}
                        </button>
                    ) : (
                        <button
                            onClick={handleApplyInstruction}
                            disabled={loading}
                            style={{ ...buttonStyle, width: "100%" }}
                        >
                            {loading ? "A aplicar..." : "Aplicar Instruções"}
                        </button>
                    )}
                </div>
            </div>

            {/* RIGHT */}
            <div
                style={{
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: 14,
                        padding: 24,
                        boxShadow: "0 4px 14px rgba(0,0,0,.08)",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0
                    }}
                >
                    <h3
                        style={{
                            marginTop: 0,
                            marginBottom: 16,
                            fontSize: 25,
                            fontWeight: "bold"
                        }}
                    >
                        Registo Clínico
                    </h3>

                    <textarea
                        value={record}
                        onChange={(e) => setRecord(e.target.value)}
                        style={{
                            flex: 1,
                            width: "100%",
                            resize: "none",
                            border: "1px solid #d1d5db",
                            borderRadius: 10,
                            padding: 15,
                            fontFamily: "monospace",
                            fontSize: 14,
                            lineHeight: 1.6,
                            boxSizing: "border-box"
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 12
                        }}
                    >
                        <button
                            onClick={handleUndo}
                            disabled={history.length === 0}
                            style={buttonStyle}
                        >
                            Undo
                        </button>

                        <button
                            onClick={handleCopy}
                            style={buttonStyle}
                        >
                            Copiar
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={!record.trim()}
                            style={buttonStyle}
                        >
                            PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
