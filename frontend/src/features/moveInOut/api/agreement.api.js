import { legacyApi as axiosClient } from "../../../lib/axios";

const agreementApi = {
    getAll: async () => {
        const response = await axiosClient.get("/agreements");
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/agreements/${id}`);
        return response.data;
    },

    getByReference: async (reference) => {
        const response = await axiosClient.get(`/agreements/reference/${reference}`);
        return response.data;
    },

    getByUnit: async (unitId) => {
        const response = await axiosClient.get(`/agreements/unit/${unitId}`);
        return response.data;
    },

    getByTenant: async (tenantId) => {
        const response = await axiosClient.get(`/agreements/tenant/${tenantId}`);
        return response.data;
    },

    getByOwner: async (ownerId) => {
        const response = await axiosClient.get(`/agreements/owner/${ownerId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/agreements", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/agreements/${id}`, data);
        return response.data;
    },

    submit: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/submit`);
        return response.data;
    },

    verify: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/verify`);
        return response.data;
    },

    approve: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/approve`);
        return response.data;
    },

    reject: async (id, remarks) => {
        const response = await axiosClient.post(`/agreements/${id}/reject`, { remarks });
        return response.data;
    },

    activate: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/activate`);
        return response.data;
    },

    markExpiringSoon: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/expiring-soon`);
        return response.data;
    },

    markExpired: async (id) => {
        const response = await axiosClient.post(`/agreements/${id}/expired`);
        return response.data;
    },

    terminate: async (id, remarks) => {
        const response = await axiosClient.post(`/agreements/${id}/terminate`, { remarks });
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/agreements/${id}`);
        return response.data;
    }
};

export default agreementApi;
