export async function uploadQAPDF(file) {

    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch(
        "http://localhost:3001/api/qa/upload",
        {
            method: "POST",
            body: formData
        }
    );

    return res.json();
}

export async function askQA(question) {

    const res = await fetch(
        "http://localhost:3001/api/qa/ask",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question
            })
        }
    );

    return res.json();
}

export async function endQASession() {

    await fetch(
        "http://localhost:3001/api/qa/end-session",
        {
            method: "POST"
        }
    );
}