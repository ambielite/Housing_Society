import { legacyApi as axiosClient } from "../../../lib/axios";

const ownerUnitApi = {
    getAll: async (params = {}) => {
        const response = await axiosClient.get("/owner-units", { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosClient.get(`/owner-units/${id}`);
        return response.data;
    },

    getOwnerUnits: async (ownerId) => {
        const response = await axiosClient.get(`/owner-units/owner/${ownerId}/units`);
        return response.data;
    },

    getUnitOwners: async (unitId) => {
        const response = await axiosClient.get(`/owner-units/unit/${unitId}/owners`);
        return response.data;
    },

    create: async (data, config) => {
        const response = await axiosClient.post("/owner-units", data, config);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosClient.put(`/owner-units/${id}`, data);
        return response.data;
    },

    deactivate: async (id) => {
        const response = await axiosClient.patch(`/owner-units/${id}/deactivate`);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosClient.delete(`/owner-units/${id}`);
        return response.data;
    }
};

export default ownerUnitApi;
