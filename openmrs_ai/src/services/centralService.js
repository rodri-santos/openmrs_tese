import axios from "axios";

const API = "http://localhost:3001/api/central";

export const generateRecord = async (notes) => {
    const res = await axios.post(`${API}/generate`, { notes });
    return res.data;
};

export const editRecord = async (instruction) => {
    const res = await axios.post(`${API}/edit`, { instruction });
    return res.data;
};

export const undoEdit = async () => {
    const res = await axios.post(`${API}/undo`);
    return res.data;
};

export const getCurrentRecord = async () => {
    const res = await axios.get(`${API}/current`);
    return res.data;
};

export const resetSession = async () => {
    const res = await axios.post(`${API}/reset`);
    return res.data;
};