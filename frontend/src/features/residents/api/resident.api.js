import { legacyApi as axiosClient } from "../../../lib/axios";

const toRequestBody = (data) => {
    if (!data.profilePicture) return data;
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key !== "profilePicture" && value !== undefined && value !== null) body.append(key, value);
    });
    body.append("profilePicture", data.profilePicture);
    return body;
};

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

    create: async (data, config) => {
        const body = toRequestBody(data);
        const response = await axiosClient.post(
            "/residents",
            body,
            body instanceof FormData ? { ...config, headers: { ...config?.headers, "Content-Type": "multipart/form-data" } } : config
        );

        return response.data;
    },

    update: async (id, data) => {
        const body = toRequestBody(data);
        const response = await axiosClient.put(
            `/residents/${id}`,
            body,
            body instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
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
