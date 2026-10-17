import { legacyApi as axiosClient } from "../../../lib/axios";

const nonMemberApi = {
    getAll: async (params = {}) => {
        const response = await axiosClient.get("/non-members", { params });
        return response.data;
    },

    getBySociety: async (societyId) => {
        const response = await axiosClient.get(`/non-members/society/${societyId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/non-members/${id}`);
        return response.data;
    },

    search: async (societyId, query) => {
        const response = await axiosClient.get(`/non-members/society/${societyId}/search`, {
            params: { q: query }
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/non-members", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.patch(`/non-members/${id}`, data);
        return response.data;
    },

    updateStatus: async (id, status, remarks) => {
        const response = await axiosClient.patch(`/non-members/${id}/status`, {
            status,
            remarks
        });
        return response.data;
    },

    approve: async (id, remarks) => {
        const response = await axiosClient.patch(`/non-members/${id}/approve`, { remarks });
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/non-members/${id}`);
        return response.data;
    }
};

export default nonMemberApi;
