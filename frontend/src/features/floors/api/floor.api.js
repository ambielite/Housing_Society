import { legacyApi as axiosClient } from "../../../lib/axios";

const floorApi = {
    getAll: async (config) => (await axiosClient.get("/floors", config)).data,
    getByTower: async (towerId, config) => (await axiosClient.get(`/floors/tower/${towerId}`, config)).data,
    create: async (data) => (await axiosClient.post("/floors", data)).data,
    update: async (id, data) => (await axiosClient.put(`/floors/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.patch(`/floors/${id}/deactivate`)).data
};

export default floorApi;
