import axiosClient from "../../../lib/axios";

const agreementNotificationApi = {
    getAll: async () => {
        const response = await axiosClient.get("/agreement-notifications");
        return response.data;
    },

    getPending: async () => {
        const response = await axiosClient.get("/agreement-notifications/pending");
        return response.data;
    },

    getByAgreement: async (agreementId) => {
        const response = await axiosClient.get(`/agreement-notifications/agreement/${agreementId}`);
        return response.data;
    },

    getByReminder: async (reminderId) => {
        const response = await axiosClient.get(`/agreement-notifications/reminder/${reminderId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/agreement-notifications/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/agreement-notifications", data);
        return response.data;
    },

    process: async (id) => {
        const response = await axiosClient.post(`/agreement-notifications/${id}/process`);
        return response.data;
    },

    markRead: async (id) => {
        const response = await axiosClient.post(`/agreement-notifications/${id}/read`);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/agreement-notifications/${id}`);
        return response.data;
    },

    runScheduler: async () => {
        const response = await axiosClient.post("/agreement-notifications/scheduler/run");
        return response.data;
    }
};

export default agreementNotificationApi;
