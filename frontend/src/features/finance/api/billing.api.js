import { legacyApi as axiosClient } from "../../../lib/axios";

const billingApi = {
    getAll: async (params = {}) => (await axiosClient.get("/billings", { params })).data,
    getById: async (id) => (await axiosClient.get(`/billings/${id}`)).data,
    getByUnit: async (societyId, unitId) => (await axiosClient.get(`/billings/unit/${societyId}/${unitId}`)).data,
    calculate: async (data) => (await axiosClient.post("/billings/calculate", data)).data,
    create: async (data) => (await axiosClient.post("/billings", data)).data,
    updateOverdue: async () => (await axiosClient.post("/billings/update-overdue")).data,
    issue: async (id) => (await axiosClient.post(`/billings/${id}/issue`)).data,
    cancel: async (id) => (await axiosClient.post(`/billings/${id}/cancel`)).data,
    remove: async (id) => (await axiosClient.delete(`/billings/${id}`)).data
};

export default billingApi;
