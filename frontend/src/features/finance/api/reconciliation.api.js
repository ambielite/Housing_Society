import { legacyApi as axiosClient } from "../../../lib/axios";

const reconciliationApi = {
    getAll: async () => {
        const response = await axiosClient.get("/reconciliations");
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/reconciliations/${id}`);
        return response.data;
    },

    importTransaction: async (data) => {
        const response = await axiosClient.post("/reconciliations/import", data);
        return response.data;
    },

    autoMatch: async (id) => {
        const response = await axiosClient.post(`/reconciliations/${id}/auto-match`);
        return response.data;
    },

    reconcile: async (id, data) => {
        const response = await axiosClient.post(`/reconciliations/${id}/reconcile`, data);
        return response.data;
    }
};

export default reconciliationApi;
