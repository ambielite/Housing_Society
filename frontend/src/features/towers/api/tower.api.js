import { legacyApi as axiosClient } from "../../../lib/axios";

const towerApi = {
    getAll: async (config) => (await axiosClient.get("/towers", config)).data,
    getBySociety: async (societyId, config) => (await axiosClient.get(`/towers/society/${societyId}`, config)).data,
    create: async (data) => (await axiosClient.post("/towers", data)).data,
    update: async (id, data) => (await axiosClient.put(`/towers/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.patch(`/towers/${id}/deactivate`)).data
};

export default towerApi;
