import { useState } from "react";
import ReactMarkdown from "react-markdown";

import {
    uploadDocument,
    generateDocument
} from "../services/cagService";

export default function UpdateRSE() {

    const [files, setFiles] = useState([]);
    const [instruction, setInstruction] = useState("");
    const [result, setResult] = useState("");

    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [status, setStatus] = useState("");

    // ==============================
    // UPLOAD
    // ==============================
    const handleFileUpload = async (e) => {

        const selectedFiles = Array.from(e.target.files);
        if (!selectedFiles.length) return;

        setLoadingUpload(true);
        setStatus("A processar ficheiros...");

        const uploadedNames = [];

        for (const file of selectedFiles) {
            await uploadDocument(file);
            uploadedNames.push(file.name);
        }

        setFiles(prev => [...prev, ...uploadedNames]);

        setLoadingUpload(false);
        setStatus("Ficheiros carregados");
    };

    // ==============================
    // GERAR
    // ==============================
    const handleGenerate = async () => {

        if (!instruction.trim()) {
            setStatus("Escreve uma instrução primeiro");
            return;
        }

        setLoadingGenerate(true);
        setStatus("A gerar RSE atualizado...");

        try {
            const res = await generateDocument(instruction);
            setResult(res.result);
            setStatus("Concluído");
        } catch (err) {
            console.error(err);
            setStatus("Erro ao gerar documento");
        }

        setLoadingGenerate(false);
    };

    // ==============================
    // STYLES
    // ==============================
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

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: "#1f2937"
    };

    // ==============================
    // UI
    // ==============================
    return (

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "380px 1fr",
                height: "100%",
                gap: 0
            }}
        >

            {/* LEFT TOOL PANEL */}
            <div style={{ padding: 20, marginLeft: 45 }}>

                <div style={panelStyle}>
                    <h3 style={{ marginTop: 0, fontWeight: "bold", fontSize: 25 }}>Documentos</h3>

                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={loadingUpload}
                    />

                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                        Os ficheiros são classificados automaticamente (RSE / análises)
                    </p>

                    {files.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            {files.map((f, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: 12,
                                        background: "#e0f2fe",
                                        padding: "4px 8px",
                                        borderRadius: 8,
                                        marginBottom: 6
                                    }}
                                >
                                    📎 {f}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={panelStyle}>
                    <h3 style={{ marginLeft: 2, marginTop: 0, fontWeight: "bold", fontSize: 20 }}>Instrução Clínica</h3>

                    <textarea
                        rows={6}
                        style={{
                            width: "100%",
                            borderRadius: 10,
                            height: "40vh",
                            border: "1px solid #d1d5db",
                            padding: 10,
                            outline: "none",
                            resize: "none",
                            fontSize: 17
                        }}
                        placeholder="Ex: Atualizar hemoglobina, leucócitos e neutrófilos..."
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                    />
                </div>

                <div style={panelStyle}>
                    <button
                        style={secondaryButtonStyle}
                        onClick={handleGenerate}
                        disabled={loadingGenerate}
                    >
                        {loadingGenerate ? "A gerar..." : "Atualizar Registo"}
                    </button>

                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
                        {status}
                    </p>
                </div>

            </div>

            {/* RIGHT OUTPUT */}
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

                    <h3 style={{ marginTop: 0, fontWeight: "bold", fontSize: 25 }}>
                        Registo de Consulta Atualizado
                    </h3>

                    <div
                        style={{
                            marginTop: 20,
                            fontSize: 14,
                            lineHeight: 1.6
                        }}
                    >
                        {result ? (
                            <ReactMarkdown>{result}</ReactMarkdown>
                        ) : (
                            <p style={{ color: "#9ca3af", fontSize: 17 }}>
                                O resultado aparecerá aqui após geração.
                            </p>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
}