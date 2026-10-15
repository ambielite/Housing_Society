import { legacyApi as axiosClient } from "../../../lib/axios";

const taxApi = {
    getAll: async (societyId, params = {}) => (await axiosClient.get("/taxes", { params: { ...params, ...(societyId ? { societyId } : {}) } })).data,
    getById: async (id) => (await axiosClient.get(`/taxes/${id}`)).data,
    create: async (data) => (await axiosClient.post("/taxes", data)).data,
    update: async (id, data) => (await axiosClient.put(`/taxes/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.post(`/taxes/${id}/deactivate`)).data,
    calculate: async (data) => (await axiosClient.post("/taxes/calculate", data)).data,
    calculateGST: async (data) => (await axiosClient.post("/taxes/calculate-gst", data)).data,
    calculateTDS: async (data) => (await axiosClient.post("/taxes/calculate-tds", data)).data,
    calculateInvoice: async (data) => (await axiosClient.post("/taxes/calculate-invoice", data)).data
};
export default taxApi;
