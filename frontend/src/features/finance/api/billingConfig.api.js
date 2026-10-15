import { legacyApi as axiosClient } from "../../../lib/axios";

const billingConfigApi = {
    getAll: async (params = {}) => (await axiosClient.get("/billing-configs", { params })).data,
    getById: async (id) => (await axiosClient.get(`/billing-configs/${id}`)).data,
    create: async (data) => (await axiosClient.post("/billing-configs", data)).data,
    update: async (id, data) => (await axiosClient.put(`/billing-configs/${id}`, data)).data,
    remove: async (id) => (await axiosClient.delete(`/billing-configs/${id}`)).data
};

export default billingConfigApi;
