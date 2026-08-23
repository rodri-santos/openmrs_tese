import ipoLogo from "../assets/ipo.png";
import digitalPersonLogo from "../assets/digital_person.png";
import deiLogo from "../assets/dei_logo.png";
import ucLogo from "../assets/uc.png";

export default function Sidebar({ mode, setMode }) {

    const items = [
        {
            id: "first",
            label: "Gerar 1ª Consulta",
            description:
                "Gera um registo estruturado para a primeira consulta de enfermagem com base na informação dada."
        },
        {
            id: "comprehensive",
            label: "Consulta Completa",
            description:
                "Gera um novo registo de uma consulta subsequente utilizando a primeira consulta, análises clínicas e instruções do enfermeiro."
        },
        {
            id: "update",
            label: "Complementar Registo",
            description:
                "Atualiza um Registo Clínico com a informação pretendida, proveniente de análises clínicas."
        },
        {
            id: "review",
            label: "Rever Registo",
            description:
                "Revê o texto do registo clínico, corrigindo erros ortográficos, gramaticais e de escrita."
        },
        {
            id: "qa",
            label: "Pesquisa em Documento",
            description:
                "Permite colocar questões sobre um documento clínico utilizando Cache-Augmented Generation."
        }
    ];

    return (
        <div
            style={{
                width: "18vw",
                minWidth: 240,
                maxWidth: 280,
                background: "#1f2937",
                color: "white",
                display: "flex",
                flexDirection: "column",
                padding: 20,
                flexShrink: 0,
                position: "relative",
                zIndex: 9999,
                overflowY: "auto",
                boxSizing: "border-box"
            }}
        >
            <h2
                style={{
                    marginBottom: 30,
                    textAlign: "center",
                    letterSpacing: 1
                }}
            >
                CDSS
            </h2>

            {items.map(item => {

                const active = mode === item.id;

                return (
                    <div
                        key={item.id}
                        style={{
                            marginBottom: 14,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: active ? "#2563eb" : "#374151",
                            transition: "all .25s"
                        }}
                    >
                        <button
                            onClick={() => setMode(item.id)}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                border: "none",
                                background: "transparent",
                                color: "white",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: 15,
                                fontWeight: 600
                            }}
                        >
                            {item.label}
                        </button>

                        {active && (
                            <div
                                style={{
                                    padding: "0 16px 16px",
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    color: "#dbeafe",
                                    borderTop: "1px solid rgba(255,255,255,.15)"
                                }}
                            >
                                {item.description}
                            </div>
                        )}
                    </div>
                );

            })}

            <div
                style={{
                    marginTop: "auto",
                    textAlign: "center"
                }}
            >
                <div
                    style={{
                        fontSize: 14,
                        color: "#9ca3af",
                        marginBottom: 18
                    }}
                >
                    Sistema de Apoio à<br />
                    Decisão Clínica
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12
                    }}
                >
                    <img
                        src={digitalPersonLogo}
                        alt="Digital Person"
                        style={{
                            maxWidth: 170,
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />

                    <img
                        src={ipoLogo}
                        alt="IPO Coimbra"
                        style={{
                            maxWidth: 105,
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />

                    <img
                        src={deiLogo}
                        alt="DEI"
                        style={{
                            maxWidth: 135,
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />

                    <img
                        src={ucLogo}
                        alt="Universidade de Coimbra"
                        style={{
                            maxWidth: 90,
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />

                </div>
            </div>
        </div>
    );
}