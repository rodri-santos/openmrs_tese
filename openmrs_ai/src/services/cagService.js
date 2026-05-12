// src/services/cagService.js
const API_BASE = "http://localhost:3001";

export async function warmupCAG() {

    const res = await fetch(
        `${API_BASE}/api/cag/warmup`,
        {
            method: "POST"
        }
    );

    return res.json();
}
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
        throw new Error("Erro no servidor");
    }

    return res.json();
}

export async function endCAGSession() {
    const res = await fetch(`${API_BASE}/api/cag/end-session`, {
        method: "POST"
    });
    return res.json();
}