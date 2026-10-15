import { useState } from "react";
import SocietyContext from "./society.context";

const normalizeSocietyId = (value) => String(value ?? "").replace(/^:+/, "").trim();

const readStoredSociety = () => {
    try {
        const storedSociety = localStorage.getItem("selectedSociety");
        const parsedSociety = storedSociety ? JSON.parse(storedSociety) : null;
        const societyId = normalizeSocietyId(parsedSociety?.id ?? parsedSociety?.societyId);

        if (!parsedSociety || !societyId) {
            localStorage.removeItem("selectedSociety");
            localStorage.removeItem("selectedSocietyId");
            return null;
        }

        const nextSociety = { ...parsedSociety, id: societyId };
        localStorage.setItem("selectedSociety", JSON.stringify(nextSociety));
        localStorage.setItem("selectedSocietyId", societyId);

        return nextSociety;
    } catch {
        localStorage.removeItem("selectedSociety");
        localStorage.removeItem("selectedSocietyId");
        return null;
    }
};

export const SocietyProvider = ({ children }) => {
    const [selectedSociety, setSelectedSociety] = useState(readStoredSociety);

    const selectSociety = (society) => {
        const safeSociety = society && (society.id || society.societyId) ? { ...society, id: normalizeSocietyId(society.id ?? society.societyId) } : null;

        if (!safeSociety || !safeSociety.id) {
            setSelectedSociety(null);
            localStorage.removeItem("selectedSociety");
            localStorage.removeItem("selectedSocietyId");
            return;
        }

        setSelectedSociety(safeSociety);
        localStorage.setItem("selectedSociety", JSON.stringify(safeSociety));
        localStorage.setItem("selectedSocietyId", safeSociety.id);
    };

    const clearSociety = () => {
        setSelectedSociety(null);
        localStorage.removeItem("selectedSociety");
        localStorage.removeItem("selectedSocietyId");
    };

    return (
        <SocietyContext.Provider value={{ selectedSociety, selectSociety, clearSociety }}>
            {children}
        </SocietyContext.Provider>
    );
};
