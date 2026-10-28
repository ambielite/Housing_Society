import { legacyApi as axiosClient } from "../../../lib/axios";

const toFormData = (payload) => {
    const { logoFile, removeLogo, ...fields } = payload;
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, key === "taxConfiguration" ? JSON.stringify(value) : value);
        }
    });
    if (logoFile) formData.append("logo", logoFile);
    if (removeLogo) formData.append("removeLogo", "true");
    return formData;
};

const requestBody = (payload) => {
    if (payload.logoFile || payload.removeLogo) return toFormData(payload);
    const fields = { ...payload };
    delete fields.logoFile;
    delete fields.removeLogo;
    return fields;
};
const multipartConfig = (payload) => payload.logoFile || payload.removeLogo
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : undefined;

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
            requestBody(data),
            multipartConfig(data)
        );

        window.dispatchEvent(new Event("housing:societies-updated"));

        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(
            `/societies/${id}`,
            requestBody(data),
            multipartConfig(data)
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
