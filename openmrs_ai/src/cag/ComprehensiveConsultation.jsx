//after nurse feedback, not yet ready for deployment
import { useState } from "react";
import jsPDF from "jspdf";
import { marked } from "marked";

export default function ComprehensiveConsultation() {
    const [consultationType, setConsultationType] = useState("first");
    const [instruction, setInstruction] = useState("");
    const [previousRecord, setPreviousRecord] = useState("");
    const [newRecord, setNewRecord] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetch("http://localhost:3001/api/cag/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (data.success) {
                    setUploadedFiles((prev) => [...prev, { name: file.name, type: data.type }]);
                }
            } catch (err) {
                console.error("Erro no upload:", err);
            }
        }
    };

    const handleGenerate = async () => {
        if (!instruction.trim()) return;
        setLoading(true);
        try {
            const endpoint = consultationType === "first"
                ? "http://localhost:3001/api/first-consultation/generate"
                : "http://localhost:3001/api/comprehensive/generate";
            const body = {
                instruction,
                record: previousRecord
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setHistory((prev) => [...prev, newRecord]);
                setNewRecord(data.result);
            }
        } catch (err) {
            alert("Erro ao gerar registo.");
            console.error(err);
        }
        setLoading(false);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setNewRecord(last);
    };

    const handleCopy = async () => {
        if (!newRecord.trim()) return;
        try {
            await navigator.clipboard.writeText(newRecord);
            alert("Registo copiado com sucesso.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleReview = async () => {
        if (!newRecord.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/api/review/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ record: newRecord }),
            });
            const data = await res.json();
            if (data.success) {
                setHistory((prev) => [...prev, newRecord]);
                setNewRecord(data.result);
            }
        } catch (err) {
            alert("Erro ao rever registo.");
            console.error(err);
        }
        setLoading(false);
    };

    const parseMarkdownToLines = (text) => {
        const html = marked.parse(text);
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return Array.from(temp.childNodes).map((node) => node.textContent || "");
    };

    const handleDownloadPDF = () => {
        if (!newRecord.trim()) return;
        const doc = new jsPDF();
        const lines = parseMarkdownToLines(newRecord);
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
        doc.save(`registo_clinico_v${version}.pdf`);
    };

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
        <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 380px) 1fr", gap: 20, height: "calc(100vh - 40px)", padding: 20, boxSizing: "border-box" }}>
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, fontWeight: "bold", fontSize: 23, marginBottom: 16 }}>Consulta</h3>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>Upload de PDFs</label>
                        <input type="file" accept=".pdf" multiple onChange={handleUpload} style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>Ficheiros carregados</label>
                        <div style={{ border: "1px solid #d1d5db", borderRadius: "10px", minHeight: "80px", maxHeight: "140px", overflowY: "auto", padding: "10px", background: "#ffffff" }}>
                            {uploadedFiles.length === 0 ? (
                                <span style={{ color: "#888", fontSize: 14 }}>Nenhum ficheiro carregado.</span>
                            ) : (
                                uploadedFiles.map((file, index) => (
                                    <div key={index} style={{ padding: "4px 0", borderBottom: "1px solid #eee", fontSize: "14px" }}>
                                        📄 {file.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ ...panelStyle, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>Tipo de Consulta</label>
                        <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: 15 }}>
                            <option value="first">Primeira consulta</option>
                            <option value="followup">Consulta subsequente</option>
                        </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <label style={{ fontWeight: "600", marginBottom: "8px" }}>Instruções</label>
                        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Escreva as instruções para gerar ou atualizar o registo..." style={{ flex: 1, width: "100%", resize: "none", borderRadius: 10, border: "1px solid #d1d5db", padding: 12, fontSize: 15, boxSizing: "border-box" }} />
                    </div>
                </div>

                <div style={{ ...panelStyle, marginBottom: 0 }}>
                    <button onClick={handleGenerate} disabled={loading} style={{ ...buttonStyle, width: "100%", background: "#2563eb", border: "none", fontSize: 16 }}>
                        {loading ? "A processar..." : consultationType === "first" ? "Gerar Registo" : "Atualizar Registo"}
                    </button>
                </div>
            </div>

            <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 4px 14px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: "bold" }}>Registo da Consulta Anterior</h3>
                    <textarea
                        value={previousRecord}
                        onChange={(e) => setPreviousRecord(e.target.value)}
                        placeholder={
                            consultationType === "first"
                                ? "Cole aqui o registo clínico fornecido pelo médico..."
                                : "Cole aqui o registo da consulta anterior..."
                        }
                        style={{
                            flex: 1,
                            width: "100%",
                            resize: "none",
                            border: "1px solid #d1d5db",
                            borderRadius: 10,
                            padding: 15,
                            fontFamily: "inherit",
                            fontSize: 14,
                            lineHeight: 1.5,
                            boxSizing: "border-box",
                            background: "#ffffff"
                        }}
                    />
                </div>
                <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 4px 14px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", flex: 1.5, minHeight: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: "bold" }}>Novo Registo Clínico</h3>
                    <textarea value={newRecord} onChange={(e) => setNewRecord(e.target.value)} placeholder="O novo registo clínico aparecerá aqui..." style={{ flex: 1, width: "100%", resize: "none", border: "1px solid #d1d5db", borderRadius: 10, padding: 15, fontFamily: "monospace", fontSize: 14, lineHeight: 1.6, boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button onClick={handleUndo} disabled={history.length === 0} style={{ ...buttonStyle, background: "#ffffff", color: "#374151" }}>Undo</button>
                        <button onClick={handleCopy} disabled={!newRecord.trim()} style={{ ...buttonStyle, background: "#ffffff", color: "#374151" }}>Copiar</button>
                        <button onClick={handleReview} disabled={!newRecord.trim() || loading} style={{ ...buttonStyle, background: "#f59e0b", color: "#fff", border: "none" }}>{loading ? "..." : "Rever"}</button>
                        <button onClick={handleDownloadPDF} disabled={!newRecord.trim()} style={{ ...buttonStyle, background: "#10b981", color: "#fff", border: "none" }}>PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );
}