import { useState, useContext, useEffect } from "react";
// Repara que agora só tem UM "../" porque está direto na pasta components
import { CAGContext } from "../contexts/CAGContext";
import { askCAG, uploadFileCAG, endCAGSession } from "../services/cagService";
import { useNavigate } from "react-router-dom";

export default function CAGPage() {
    const navigate = useNavigate();
    const { cacheHits, setCacheHits } = useContext(CAGContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            endCAGSession();
        };
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await uploadFileCAG(file);
            if (result.success) {
                setMessages(prev => [...prev, { role: "system", text: "📄 PDF carregado! Podes fazer perguntas sobre ele." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "system", text: "❌ Erro ao processar ficheiro." }]);
        }
        setIsUploading(false);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            const result = await askCAG(userMsg);
            if (result.cached && setCacheHits) setCacheHits(prev => prev + 1);

            setMessages(prev => [...prev, { role: "ai", text: result.answer + (result.cached ? " ⚡ (Cache)" : "") }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "system", text: "❌ Erro ao contactar o assistente." }]);
        }
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleEndSession = async () => {
        await endCAGSession();
        setMessages([{ role: "system", text: "🧹 Sessão limpa e ficheiros esquecidos." }]);
    };

    return (
        <div style={{ display: "flex", height: "100vh", padding: "20px", gap: "20px" }}>

            {/* Sidebar / Upload */}
            <div style={{ width: "25%", borderRight: "1px solid #ccc", paddingRight: "20px" }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px', width: '100%' }}
                >
                    Voltar Assistente
                </button>

                <h3>Documentos (Temporários)</h3>
                <p style={{ fontSize: "12px", color: "gray" }}>
                    Os PDFs não são guardados. Serão apagados no fim da sessão.
                </p>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                />
                {isUploading && <p>A extrair texto do PDF...</p>}

                <div style={{ marginTop: "40px" }}>
                    <button
                        onClick={handleEndSession}
                        style={{ backgroundColor: "#ff4d4f", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", width: '100%' }}
                    >
                        Terminar Sessão e Limpar Dados
                    </button>
                    <p style={{ marginTop: "10px", fontSize: "14px" }}>Cache Hits: {cacheHits || 0}</p>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <h3>Assistente Clínico CAG</h3>

                <div style={{ flex: 1, overflowY: "auto", border: "1px solid #eee", padding: "10px", marginBottom: "10px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            textAlign: m.role === "user" ? "right" : "left",
                            margin: "10px 0"
                        }}>
                            <span style={{
                                backgroundColor: m.role === "user" ? "#007bff" : m.role === "system" ? "#f8d7da" : "#e2e3e5",
                                color: m.role === "user" ? "white" : "black",
                                padding: "8px 12px",
                                borderRadius: "15px",
                                display: "inline-block",
                                maxWidth: "70%"
                            }}>
                                {m.text}
                            </span>
                        </div>
                    ))}
                    {isLoading && <div style={{ textAlign: "left" }}><span style={{ padding: "8px", backgroundColor: "#e2e3e5", borderRadius: "15px" }}>A pensar...</span></div>}
                </div>

                {/* Input Area */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <input
                        style={{ flex: 1, padding: "10px" }}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunta algo sobre o documento..."
                    />
                    <button onClick={handleSendMessage} disabled={isLoading} style={{ padding: "10px 20px" }}>
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}