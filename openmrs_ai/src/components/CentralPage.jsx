import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import {
    generateRecord,
    editRecord,
    undoEdit,
    getCurrentRecord,
    resetSession
} from "../services/centralService";

export default function CentralPage() {

    const [notes, setNotes] = useState("");
    const [instruction, setInstruction] = useState("");
    const [record, setRecord] = useState("");
    const [loading, setLoading] = useState(false);

    // =========================
    // LOAD CURRENT
    // =========================
    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await getCurrentRecord();
        setRecord(res.result || "");
    };

    // =========================
    // CREATE
    // =========================
    const handleGenerate = async () => {
        if (!notes.trim()) return;

        setLoading(true);

        const res = await generateRecord(notes);

        setRecord(res.result);

        setLoading(false);
    };

    // =========================
    // EDIT
    // =========================
    const handleEdit = async () => {
        if (!instruction.trim()) return;

        setLoading(true);

        const res = await editRecord(instruction);

        setRecord(res.result);

        setInstruction("");

        setLoading(false);
    };

    // =========================
    // UNDO
    // =========================
    const handleUndo = async () => {
        const res = await undoEdit();
        setRecord(res.result);
    };

    // =========================
    // RESET
    // =========================
    const handleReset = async () => {
        await resetSession();
        setRecord("");
    };

    return (
        <div style={{ display: "flex", gap: 20, padding: 20 }}>

            {/* LEFT */}
            <div style={{ width: 400 }}>

                <h3>Notas clínicas</h3>

                <textarea
                    rows={10}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: "100%", padding: 10 }}
                />

                <button onClick={handleGenerate} disabled={loading}>
                    Gerar Registo
                </button>

                <hr />

                <h3>Editar registo</h3>

                <textarea
                    rows={6}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    style={{ width: "100%", padding: 10 }}
                />

                <button onClick={handleEdit} disabled={loading}>
                    Aplicar edição
                </button>

                <div style={{ marginTop: 20, display: "flex", gap: 10 }}>

                    <button onClick={handleUndo}>
                        Undo
                    </button>

                    <button onClick={handleReset}>
                        Reset
                    </button>

                </div>

            </div>

            {/* RIGHT */}
            <div style={{ flex: 1 }}>

                <h3>Registo atual</h3>

                <div style={{
                    background: "white",
                    padding: 20,
                    borderRadius: 10,
                    minHeight: 500
                }}>

                    <ReactMarkdown>
                        {record || "Sem registo"}
                    </ReactMarkdown>

                </div>

            </div>

        </div>
    );
}