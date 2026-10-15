import axiosClient from "../../../lib/axios";

const accountApi = {
    getAll: async (societyId) => {
        const url = societyId ? `/accounts?societyId=${societyId}` : "/accounts";
        const response = await axiosClient.get(url);
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/accounts/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post("/accounts", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/accounts/${id}`, data);
        return response.data;
    },

    remove: async (id) => {
        const response = await axiosClient.delete(`/accounts/${id}`);
        return response.data;
    },

    getByType: async (societyId, accountType) => {
        const response = await axiosClient.get(`/accounts/type/${societyId}/${accountType}`);
        return response.data;
    }
};

export default accountApi;
