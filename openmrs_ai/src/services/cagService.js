export async function uploadDocument(file) {

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3001/api/cag/upload", {
        method: "POST",
        body: formData
    });

    return res.json();
}

export async function generateDocument(instruction) {

    const res = await fetch("http://localhost:3001/api/cag/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            instruction
        })
    });

    return res.json();
}

export async function endSession() {
    const response = await fetch("http://localhost:3001/api/cag/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    return await response.json();
}

export async function getSessionInfo() {

    const res = await fetch("http://localhost:3001/api/cag/session-info", {
        method: "GET"
    });

    return res.json();
}