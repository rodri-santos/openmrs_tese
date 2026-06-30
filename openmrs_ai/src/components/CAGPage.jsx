import { useState } from "react";

import Sidebar from "../cag/Sidebar";
import UpdateRSE from "../cag/UpdateRSE";
import QACAG from "../cag/QACAG";
import FirstConsultation from "../cag/FirstConsultation";
import ReviewRecord from "../cag/ReviewRecord";

export default function CAGPage() {

    const [mode, setMode] = useState("update");

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

            default:
                return <UpdateRSE />;
        }
    };

    return (

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                height: "100vh",
                background: "#f5f7fb"
            }}
        >

            <Sidebar
                mode={mode}
                setMode={setMode}
            />

            <div
                style={{
                    overflowY: "auto"
                }}
            >
                {renderMode()}
            </div>

        </div>

    );

}