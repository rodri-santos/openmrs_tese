export default function Sidebar({ mode, setMode }) {

    const items = [
        {
            id: "update",
            label: "Complementar Registo Consulta"
        },
        {
            id: "qa",
            label: "Pesquisa Informação num Documento"
        },
        {
            id: "first",
            label: "Gerar 1ª Consulta"
        },
        {
            id: "review",
            label: "Rever/Corrigir Registo"
        }
    ];

    return (

        <div
            style={{
                background: "#fff",
                borderRight: "1px solid #ddd",
                padding: 20
            }}
        >

            <h2>CDSS</h2>

            {items.map(item => (

                <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    style={{
                        width: "100%",
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        background:
                            mode === item.id
                                ? "#2563eb"
                                : "#f3f4f6",
                        color:
                            mode === item.id
                                ? "white"
                                : "black",
                        fontWeight: "bold"
                    }}
                >
                    {item.label}
                </button>

            ))}

        </div>

    );

}