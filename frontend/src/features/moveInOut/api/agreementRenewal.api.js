import axiosClient from "../../../lib/legacyAxios";

const agreementRenewalApi = {
    getAll: async () => {
        const response = await axiosClient.get("/agreement-renewals");
        return response.data;
    },

    getPending: async () => {
        const response = await axiosClient.get("/agreement-renewals/pending");
        return response.data;
    },

    getByAgreement: async (agreementId) => {
        const response = await axiosClient.get(`/agreement-renewals/agreement/${agreementId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/agreement-renewals/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/agreement-renewals", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/agreement-renewals/${id}`, data);
        return response.data;
    },

    submit: async (id) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/submit`);
        return response.data;
    },

    review: async (id) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/review`);
        return response.data;
    },

    requestInformation: async (id, remarks) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/request-information`, { remarks });
        return response.data;
    },

    approve: async (id, remarks, approvedBy) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/approve`, { remarks, approvedBy });
        return response.data;
    },

    reject: async (id, remarks) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/reject`, { remarks });
        return response.data;
    },

    complete: async (id) => {
        const response = await axiosClient.post(`/agreement-renewals/${id}/complete`);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/agreement-renewals/${id}`);
        return response.data;
    }
};

export default agreementRenewalApi;
