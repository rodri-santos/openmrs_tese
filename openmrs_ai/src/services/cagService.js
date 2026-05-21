export async function uploadRSE(file) {

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3001/api/cag/upload-rse", {
        method: "POST",
        body: formData
    });

    return res.json();
}

export async function uploadModulab(file) {

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3001/api/cag/upload-modulab", {
        method: "POST",
        body: formData
    });

    return res.json();
}

export async function rewriteRSE() {
    return fetch("http://localhost:3001/api/cag/rewrite", {
        method: "POST"
    }).then(r => r.json());
}

export async function endCAGSession() {
    return fetch("http://localhost:3001/api/cag/end-session", {
        method: "POST"
    });
}