import axiosClient from "../../../lib/axios";

const residentApi = {

    getAll: async (params = {}) => {
        const response = await axiosClient.get(
            "/residents",
            {
                params
            }
        );

        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(
            `/residents/${id}`
        );

        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post(
            "/residents",
            data
        );

        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(
            `/residents/${id}`,
            data
        );

        return response.data;
    },

    updateStatus: async (id, societyId, status) => {
        const response = await axiosClient.patch(
            `/residents/${id}/status`,
            {
                societyId,
                status
            }
        );

        return response.data;
    },

    delete: async (id, societyId) => {
        const response = await axiosClient.delete(
            `/residents/${id}`,
            {
                params: { societyId }
            }
        );

        return response.data;
    }

};

export default residentApi;
