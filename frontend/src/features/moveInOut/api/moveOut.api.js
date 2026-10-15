import axiosClient from "../../../lib/axios";

const moveOutApi = {
    getAll: async () => {
        const response = await axiosClient.get("/move-outs");
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/move-outs/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/move-outs", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/move-outs/${id}`, data);
        return response.data;
    },

    startChecklist: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/start-checklist`);
        return response.data;
    },

    completeChecklist: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/complete-checklist`);
        return response.data;
    },

    updateOutstandingDues: async (id, data) => {
        const response = await axiosClient.post(`/move-outs/${id}/outstanding-dues`, data);
        return response.data;
    },

    submitFinancialClearance: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/financial-clearance`);
        return response.data;
    },

    approve: async (id, approvedBy) => {
        const response = await axiosClient.post(`/move-outs/${id}/approve`, { approvedBy });
        return response.data;
    },

    reject: async (id, remarks) => {
        const response = await axiosClient.post(`/move-outs/${id}/reject`, { remarks });
        return response.data;
    },

    issueMoveOutPass: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/issue-move-out-pass`);
        return response.data;
    },

    revokeAccess: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/revoke-access`);
        return response.data;
    },

    complete: async (id) => {
        const response = await axiosClient.post(`/move-outs/${id}/complete`);
        return response.data;
    },

    cancel: async (id, reason) => {
        const response = await axiosClient.post(`/move-outs/${id}/cancel`, { reason });
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/move-outs/${id}`);
        return response.data;
    }
};

export default moveOutApi;
