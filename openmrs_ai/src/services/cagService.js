// src/services/cagService.js
const API_BASE = "http://localhost:3001"; // Apontar para o teu Node.js!

export async function askCAG(question) {
    const res = await fetch(`${API_BASE}/api/cag/query`, {
        method: "POST",
        body: JSON.stringify({ question }),
        headers: { "Content-Type": "application/json" }
    });
    return res.json();
}

export async function uploadFileCAG(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/cag/upload`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        throw new Error("Erro no servidor"); // Força o erro para o catch se a resposta não for OK (ex: 404 ou 500)
    }

    return res.json();
}

export async function endCAGSession() {
    const res = await fetch(`${API_BASE}/api/cag/end-session`, {
        method: "POST"
    });
    return res.json();
}