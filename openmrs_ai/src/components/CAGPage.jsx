import { useState } from "react";
import ReactMarkdown from "react-markdown";

import {
    uploadDocument,
    generateDocument
} from "../services/cagService";

export default function CAGPage() {

    const [files, setFiles] = useState([]);
    const [instruction, setInstruction] = useState("");
    const [result, setResult] = useState("");

    const [loadingUpload, setLoadingUpload] = useState(false);
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [status, setStatus] = useState("");

    // =====================================================
    // UPLOAD (MULTI-FICHEIROS)
    // =====================================================

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

    // =====================================================
    // GERAR RSE
    // =====================================================

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

    // =====================================================
    // UI STYLES
    // =====================================================

    const boxStyle = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: "16px"
    };

    const buttonStyle = {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        background: "#2563eb",
        color: "white",
        fontWeight: "bold"
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: "#10b981"
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            height: "100vh",
            background: "#f5f7fb",
            fontFamily: "Arial"
        }}>

            {/* LEFT PANEL */}
            <div style={{
                padding: "20px",
                borderRight: "1px solid #e5e7eb",
                background: "#ffffff"
            }}>

                <h2 style={{ marginBottom: "20px" }}>
                    CAG Clínico
                </h2>

                {/* UPLOAD */}
                <div style={boxStyle}>
                    <h4>Adicionar documentos</h4>

                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={loadingUpload}
                    />

                    <p style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "8px"
                    }}>
                        Os ficheiros são classificados automaticamente (RSE / análises)
                    </p>
                </div>

                {/* LISTA FICHEIROS */}
                <div style={boxStyle}>
                    <h4>Ficheiros carregados</h4>

                    {files.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#888" }}>
                            Nenhum ficheiro carregado
                        </p>
                    ) : (
                        <ul style={{ fontSize: "12px" }}>
                            {files.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* INSTRUÇÃO */}
                <div style={boxStyle}>
                    <h4>Instrução clínica</h4>

                    <textarea
                        rows={6}
                        style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            padding: "8px"
                        }}
                        placeholder="Ex: Adicionar ao RSE os valores de hemoglobina, leucócitos e neutrófilos..."
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                    />
                </div>

                {/* ACTION */}
                <div style={boxStyle}>

                    <button
                        style={secondaryButtonStyle}
                        onClick={handleGenerate}
                        disabled={loadingGenerate}
                    >
                        {loadingGenerate ? "A gerar..." : "Gerar RSE atualizado"}
                    </button>

                    <p style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "gray"
                    }}>
                        {status}
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{
                padding: "20px",
                overflowY: "auto"
            }}>

                <div style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    minHeight: "100%"
                }}>

                    <h3>Registo de Saúde Eletrónico Atualizado</h3>

                    <div style={{
                        marginTop: "20px",
                        fontSize: "14px",
                        lineHeight: "1.6"
                    }}>
                        {result ? (
                            <ReactMarkdown>{result}</ReactMarkdown>
                        ) : (
                            <p style={{ color: "#888" }}>
                                O resultado aparecerá aqui após geração.
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}