import axiosClient from "../../../lib/legacyAxios";

const paymentApi = {
    getAll: async (societyId) => {
        const response = await axiosClient.get("/payments", { params: societyId ? { societyId } : {} });
        return response.data;
    },
    getById: async (id) => (await axiosClient.get(`/payments/${id}`)).data,
    create: async (data) => (await axiosClient.post("/payments/offline", data)).data,
    initiate: async (data) => (await axiosClient.post("/payments/initiate", data)).data,
    verify: async (id, data = {}) => (await axiosClient.post(`/payments/${id}/verify`, data)).data,
    cancel: async (id) => (await axiosClient.post(`/payments/${id}/cancel`)).data
};
export default paymentApi;
