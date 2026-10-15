import axiosClient from "../../../lib/legacyAxios";

const journalApi = {
    getAll: async (societyId) => {
        const response = await axiosClient.get("/journals", { params: societyId ? { societyId } : {} });
        return response.data;
    },
    getById: async (id) => (await axiosClient.get(`/journals/${id}`)).data,
    getByPeriod: async (periodId) => (await axiosClient.get(`/journals/period/${periodId}`)).data,
    createDraft: async (data) => (await axiosClient.post("/journals/draft", data)).data,
    removeDraft: async (id) => (await axiosClient.delete(`/journals/${id}`)).data
};
export default journalApi;
