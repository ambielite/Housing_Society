import { legacyApi as axiosClient } from "../../../lib/axios";

const societyApi = {

    getAll: async () => {
        const response = await axiosClient.get("/societies");
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(
            `/societies/${id}`
        );

        return response.data;
    },

    create: async (data) => {
        const response = await axiosClient.post(
            "/societies",
            data
        );

        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(
            `/societies/${id}`,
            data
        );

        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(
            `/societies/${id}`
        );

        return response.data;
    }
};

export default societyApi;