import { useState, useContext, useEffect } from "react";
import { CAGContext } from "../contexts/CAGContext";
import { askCAG, uploadFileCAG, endCAGSession } from "../services/cagService";
import { useNavigate } from "react-router-dom";

import ReactMarkdown from "react-markdown";

export default function CAGPage() {

    const navigate = useNavigate();

    const {
        cacheHits,
        setCacheHits
    } = useContext(CAGContext);

    const [messages, setMessages] = useState([]);

    const [input, setInput] = useState("");

    const [isUploading, setIsUploading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {

        return () => {
            endCAGSession();
        };

    }, []);

    // =====================================================
    // Upload PDF
    // =====================================================

    const handleFileUpload = async (e) => {

        const file = e.target.files?.[0];

        if (!file) return;

        setIsUploading(true);

        try {

            const result =
                await uploadFileCAG(file);

            if (result.success) {

                setMessages(prev => [

                    ...prev,

                    {
                        role: "system",
                        text: `📄 PDF carregado: ${file.name}`
                    }
                ]);
            }

        } catch (error) {

            setMessages(prev => [

                ...prev,

                {
                    role: "system",
                    text: "Erro ao processar ficheiro."
                }
            ]);
        }

        setIsUploading(false);
    };

    // =====================================================
    // Enviar mensagem
    // =====================================================

    const handleSendMessage = async () => {

        if (!input.trim()) return;

        const userMsg = input;

        setMessages(prev => [

            ...prev,

            {
                role: "user",
                text: userMsg
            }
        ]);

        setInput("");

        setIsLoading(true);

        try {

            const result =
                await askCAG(userMsg);

            if (
                result.cached &&
                setCacheHits
            ) {

                setCacheHits(prev => prev + 1);
            }

            setMessages(prev => [

                ...prev,

                {
                    role: "ai",

                    text:
                        result.answer +
                        (
                            result.cached
                                ? "\n\n⚡ Resposta em cache"
                                : ""
                        )
                }
            ]);

        } catch (error) {

            setMessages(prev => [

                ...prev,

                {
                    role: "system",
                    text:
                        "Erro ao contactar o assistente."
                }
            ]);
        }

        setIsLoading(false);
    };

    // =====================================================
    // Enter
    // =====================================================

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {

            handleSendMessage();
        }
    };

    // =====================================================
    // Limpar sessão
    // =====================================================

    const handleEndSession = async () => {

        await endCAGSession();

        setMessages([
            {
                role: "system",
                text:
                    "Sessão limpa e ficheiros esquecidos."
            }
        ]);
    };

    // =====================================================
    // Render
    // =====================================================

    return (

        <div
            style={{
                display: "flex",
                height: "100vh",
                padding: "20px",
                gap: "20px",
                backgroundColor: "#f5f5f5"
            }}
        >

            {/* Sidebar */}

            <div
                style={{
                    width: "25%",
                    borderRight: "1px solid #ddd",
                    paddingRight: "20px"
                }}
            >

                <button
                    onClick={() => navigate("/")}

                    style={{
                        padding: "10px",
                        background: "#ccc",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        marginBottom: "20px",
                        width: "100%"
                    }}
                >
                    Voltar Assistente
                </button>

                <h3>Documentos</h3>

                <p
                    style={{
                        fontSize: "12px",
                        color: "gray"
                    }}
                >
                    PDFs temporários em RAM.
                </p>

                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                />

                {
                    isUploading &&
                    <p>A extrair texto...</p>
                }

                <div style={{ marginTop: "40px" }}>

                    <button
                        onClick={handleEndSession}

                        style={{
                            backgroundColor: "#ff4d4f",
                            color: "white",
                            padding: "10px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%"
                        }}
                    >
                        Terminar Sessão
                    </button>

                    <p
                        style={{
                            marginTop: "10px",
                            fontSize: "14px"
                        }}
                    >
                        Cache Hits: {cacheHits || 0}
                    </p>
                </div>
            </div>

            {/* Chat */}

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column"
                }}
            >

                <h2>
                    Assistente Clínico CAG
                </h2>

                {/* Messages */}

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "10px"
                    }}
                >

                    {
                        messages.map((m, i) => (

                            <div
                                key={i}

                                style={{
                                    display: "flex",

                                    justifyContent:
                                        m.role === "user"
                                            ? "flex-end"
                                            : "flex-start",

                                    marginBottom: "15px"
                                }}
                            >

                                <div
                                    style={{

                                        backgroundColor:

                                            m.role === "user"
                                                ? "#007bff"

                                                : m.role === "system"
                                                    ? "#ffe5e5"
                                                    : "#f1f1f1",

                                        color:
                                            m.role === "user"
                                                ? "white"
                                                : "black",

                                        padding: "12px 16px",

                                        borderRadius: "16px",

                                        maxWidth: "75%",

                                        lineHeight: "1.6",

                                        boxShadow:
                                            "0 2px 6px rgba(0,0,0,0.08)"
                                    }}
                                >

                                    <ReactMarkdown>
                                        {m.text}
                                    </ReactMarkdown>

                                </div>
                            </div>
                        ))
                    }

                    {
                        isLoading && (

                            <div
                                style={{
                                    textAlign: "left"
                                }}
                            >
                                <span
                                    style={{
                                        padding: "10px 14px",
                                        backgroundColor: "#f1f1f1",
                                        borderRadius: "15px"
                                    }}
                                >
                                    A pensar...
                                </span>
                            </div>
                        )
                    }

                </div>

                {/* Input */}

                <div
                    style={{
                        display: "flex",
                        gap: "10px"
                    }}
                >

                    <input
                        style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid #ccc"
                        }}

                        value={input}

                        onChange={e =>
                            setInput(e.target.value)
                        }

                        onKeyDown={handleKeyDown}

                        placeholder="Pergunta algo sobre os documentos..."
                    />

                    <button
                        onClick={handleSendMessage}

                        disabled={isLoading}

                        style={{
                            padding: "12px 20px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#007bff",
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        Enviar
                    </button>

                </div>
            </div>
        </div>
    );
}