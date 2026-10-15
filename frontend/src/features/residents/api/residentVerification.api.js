import axiosClient from "../../../lib/axios";

const residentVerificationApi = {
    getAll: async (params = {}) => {
        const response = await axiosClient.get("/resident-verifications", { params });
        return response.data;
    },

    getPendingQueue: async (societyId) => {
        const response = await axiosClient.get("/resident-verifications/pending", {
            params: { societyId }
        });
        return response.data;
    },

    getByResident: async (residentId) => {
        const response = await axiosClient.get(`/resident-verifications/resident/${residentId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/resident-verifications", data);
        return response.data;
    },

    approve: async (id, payload = {}) => {
        const response = await axiosClient.patch(`/resident-verifications/${id}/approve`, payload);
        return response.data;
    },

    reject: async (id, payload = {}) => {
        const response = await axiosClient.patch(`/resident-verifications/${id}/reject`, payload);
        return response.data;
    },

    requestInformation: async (id, payload = {}) => {
        const response = await axiosClient.patch(`/resident-verifications/${id}/request-information`, payload);
        return response.data;
    },

    updateStatus: async (residentId, status, remarks) => {
        const response = await axiosClient.patch(`/resident-verifications/resident/${residentId}/status`, {
            status,
            remarks
        });
        return response.data;
    }
};

export default residentVerificationApi;
