import { legacyApi as axiosClient } from "../../../lib/axios";

const unitApi = {
    getAll: async () => (await axiosClient.get("/units")).data,
    getByFloor: async (floorId) => (await axiosClient.get(`/units/floor/${floorId}`)).data,
    create: async (data) => (await axiosClient.post("/units", data)).data,
    update: async (id, data) => (await axiosClient.put(`/units/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.patch(`/units/${id}/deactivate`)).data
};

export default unitApi;
