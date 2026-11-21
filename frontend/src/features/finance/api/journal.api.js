import { legacyApi as axiosClient } from "../../../lib/axios";

const journalApi = {
    getAll: async (societyId, filters = {}) => {
        const response = await axiosClient.get("/journals", {
            params: {
                ...(societyId ? { societyId } : {}),
                ...(filters.status ? { status: filters.status } : {})
            }
        });
        return response.data;
    },
    getById: async (id) => (await axiosClient.get(`/journals/${id}`)).data,
    getByPeriod: async (periodId) => (await axiosClient.get(`/journals/period/${periodId}`)).data,
    createDraft: async (data) => (await axiosClient.post("/journals/draft", data)).data,
    removeDraft: async (id) => (await axiosClient.delete(`/journals/${id}`)).data
};
export default journalApi;
