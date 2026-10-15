import { legacyApi as axiosClient } from "../../../lib/axios";

const normalizeSocietyId = (societyId) => String(societyId ?? "").replace(/^:+/, "").trim();

const accountingExportApi = {
    exportJournal: async (params = {}) => {
        const societyId = normalizeSocietyId(params.societyId);

        if (!societyId) {
            throw new Error("Please select a society before exporting journal data.");
        }

        const response = await axiosClient.get("/accounting-exports/journal", {
            params: { ...params, societyId, format: "csv" },
            responseType: "blob",
        });
        return response;
    },

    exportTrialBalance: async (params = {}) => {
        const societyId = normalizeSocietyId(params.societyId);

        if (!societyId) {
            throw new Error("Please select a society before exporting trial balance data.");
        }

        const response = await axiosClient.get("/accounting-exports/trial-balance", {
            params: { ...params, societyId, format: "csv" },
            responseType: "blob",
        });
        return response;
    },

    exportGeneralLedger: async (params = {}) => {
        const societyId = normalizeSocietyId(params.societyId);

        if (!societyId) {
            throw new Error("Please select a society before exporting general ledger data.");
        }

        const response = await axiosClient.get("/accounting-exports/general-ledger", {
            params: { ...params, societyId, format: "csv" },
            responseType: "blob",
        });
        return response;
    }
};

export default accountingExportApi;
