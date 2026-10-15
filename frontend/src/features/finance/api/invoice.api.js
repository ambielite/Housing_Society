import axiosClient from "../../../lib/axios";

const invoiceApi = {
    getAll: async (params = {}) => (await axiosClient.get("/invoices", { params })).data,
    getById: async (id) => (await axiosClient.get(`/invoices/${id}`)).data,
    create: async (data) => (await axiosClient.post("/invoices", data)).data,
    issue: async (id) => (await axiosClient.post(`/invoices/${id}/issue`)).data,
    cancel: async (id) => (await axiosClient.post(`/invoices/${id}/cancel`)).data,
    generateDocument: async (id) => (await axiosClient.post(`/invoices/${id}/document`)).data,
    downloadDocument: async (id) => axiosClient.get(`/invoices/${id}/document`, { responseType: "blob" })
};
export default invoiceApi;
