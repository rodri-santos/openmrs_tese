import { useState } from "react";
import Sidebar from "../cag/Sidebar";
import UpdateRSE from "../cag/UpdateRSE";
import QACAG from "../cag/QACAG";
import FirstConsultation from "../cag/FirstConsultation";
import ReviewRecord from "../cag/ReviewRecord";
import ComprehensiveConsultation from "../cag/ComprehensiveConsultation";

export default function CAGPage() {
    const [mode, setMode] = useState("first");

    const renderMode = () => {
        switch (mode) {
            case "update":
                return <UpdateRSE />;
            case "qa":
                return <QACAG />;
            case "first":
                return <FirstConsultation />;
            case "review":
                return <ReviewRecord />;
            case "comprehensive":
                return <ComprehensiveConsultation />;
            default:
                return <UpdateRSE />;
        }
    };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 280px) 1fr",
                height: "100vh",
                background: "#f5f7fb",
                overflow: "hidden"
            }}
        >
            <Sidebar
                mode={mode}
                setMode={setMode}
            />

            <div
                style={{
                    overflow: "auto",
                    minWidth: 0,
                    minHeight: 0
                }}
            >
                {renderMode()}
            </div>
        </div>
    );
}