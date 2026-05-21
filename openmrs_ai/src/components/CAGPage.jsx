import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { uploadRSE, uploadModulab, rewriteRSE } from "../services/cagService";

export default function CAGPage() {

    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleRewrite = async () => {

        setLoading(true);
        setStatus("A gerar registo atualizado...");

        const res = await rewriteRSE();

        setResult(res.result);
        setLoading(false);
        setStatus("Concluído");
    };

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

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
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

                {/* RSE */}
                <div style={boxStyle}>
                    <h4>Registo de Saúde</h4>
                    <input
                        type="file"
                        onChange={e => uploadRSE(e.target.files[0])}
                    />
                </div>

                {/* MODULAB */}
                <div style={boxStyle}>
                    <h4>Modulab</h4>
                    <input
                        type="file"
                        onChange={e => uploadModulab(e.target.files[0])}
                    />
                </div>

                {/* ACTION */}
                <div style={boxStyle}>
                    <button
                        style={buttonStyle}
                        onClick={handleRewrite}
                        disabled={loading}
                    >
                        {loading ? "A processar..." : "Gerar RSE atualizado"}
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
                                O resultado aparecerá aqui após gerar o RSE atualizado.
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}