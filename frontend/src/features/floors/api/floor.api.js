import { legacyApi as axiosClient } from "../../../lib/axios";

const floorApi = {
    getAll: async () => (await axiosClient.get("/floors")).data,
    getByTower: async (towerId) => (await axiosClient.get(`/floors/tower/${towerId}`)).data,
    create: async (data) => (await axiosClient.post("/floors", data)).data,
    update: async (id, data) => (await axiosClient.put(`/floors/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.patch(`/floors/${id}/deactivate`)).data
};

export default floorApi;
