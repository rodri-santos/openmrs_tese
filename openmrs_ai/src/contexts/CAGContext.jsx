// src/contexts/CAGContext.jsx

import { createContext, useState } from "react";

export const CAGContext = createContext();

export function CAGProvider({ children }) {
    const [documents, setDocuments] = useState([]);
    const [cacheHits, setCacheHits] = useState(0);

    return (
        <CAGContext.Provider value={{
            documents,
            setDocuments,
            cacheHits,
            setCacheHits
        }}>
            {children}
        </CAGContext.Provider>
    );
}