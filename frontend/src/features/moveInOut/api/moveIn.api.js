import { legacyApi as axiosClient } from "../../../lib/axios";

const moveInApi = {
    getAll: async () => {
        const response = await axiosClient.get("/move-ins");
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/move-ins/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/move-ins", data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/move-ins/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    submitDocuments: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/submit-documents`);
        return response.data;
    },

    requestInformation: async (id, informationRequest) => {
        const response = await axiosClient.post(`/move-ins/${id}/request-information`, { informationRequest });
        return response.data;
    },

    verify: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/verify`);
        return response.data;
    },

    approve: async (id, approvedBy) => {
        const response = await axiosClient.post(`/move-ins/${id}/approve`, { approvedBy });
        return response.data;
    },

    reject: async (id, remarks) => {
        const response = await axiosClient.post(`/move-ins/${id}/reject`, { remarks });
        return response.data;
    },

    issueGatePass: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/issue-gate-pass`);
        return response.data;
    },

    markLedgerCreated: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/ledger-created`);
        return response.data;
    },

    activateAccess: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/activate-access`);
        return response.data;
    },

    complete: async (id) => {
        const response = await axiosClient.post(`/move-ins/${id}/complete`);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/move-ins/${id}`);
        return response.data;
    }
};

export default moveInApi;
