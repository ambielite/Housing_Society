import { legacyApi as axiosClient } from "../../../lib/axios";

const accountingPeriodApi = {
    getAll: async () => {
        const response = await axiosClient.get("/accounting-periods");
        return response.data;
    },

    getBySociety: async (societyId) => {
        const response = await axiosClient.get(`/accounting-periods/society/${societyId}`);
        return response.data;
    },

    getOpen: async (societyId) => {
        const response = await axiosClient.get(`/accounting-periods/society/${societyId}/open`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/accounting-periods", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/accounting-periods/${id}`, data);
        return response.data;
    },

    close: async (id) => {
        const response = await axiosClient.post(`/accounting-periods/${id}/close`);
        return response.data;
    },

    lock: async (id) => {
        const response = await axiosClient.post(`/accounting-periods/${id}/lock`);
        return response.data;
    },

    remove: async (id) => {
        const response = await axiosClient.delete(`/accounting-periods/${id}`);
        return response.data;
    }
};

export default accountingPeriodApi;


