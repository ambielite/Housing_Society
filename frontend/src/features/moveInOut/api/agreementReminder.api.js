import axiosClient from "../../../lib/legacyAxios";

const agreementReminderApi = {
    getAll: async () => (await axiosClient.get("/agreement-reminders")).data,
    getPending: async () => (await axiosClient.get("/agreement-reminders/pending")).data,
    getById: async (id) => (await axiosClient.get(`/agreement-reminders/${id}`)).data,
    getByAgreement: async (agreementId) => (await axiosClient.get(`/agreement-reminders/agreement/${agreementId}`)).data,
    getConfigsBySociety: async (societyId) => (await axiosClient.get(`/agreement-reminders/config/society/${societyId}`)).data,
    getConfig: async (id) => (await axiosClient.get(`/agreement-reminders/config/${id}`)).data,
    createConfig: async (data) => (await axiosClient.post("/agreement-reminders/config", data)).data,
    updateConfig: async (id, data) => (await axiosClient.put(`/agreement-reminders/config/${id}`, data)).data,
    deleteConfig: async (id) => (await axiosClient.delete(`/agreement-reminders/config/${id}`)).data,
    generateAll: async () => (await axiosClient.post("/agreement-reminders/generate")).data,
    generateForAgreement: async (agreementId) => (await axiosClient.post(`/agreement-reminders/agreement/${agreementId}/generate`)).data,
    process: async (id) => (await axiosClient.post(`/agreement-reminders/${id}/process`)).data,
    delete: async (id) => (await axiosClient.delete(`/agreement-reminders/${id}`)).data
};

export default agreementReminderApi;
