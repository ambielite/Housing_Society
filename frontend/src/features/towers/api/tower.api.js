import { legacyApi as axiosClient } from "../../../lib/axios";

const towerApi = {
    getAll: async () => (await axiosClient.get("/towers")).data,
    getBySociety: async (societyId) => (await axiosClient.get(`/towers/society/${societyId}`)).data,
    create: async (data) => (await axiosClient.post("/towers", data)).data,
    update: async (id, data) => (await axiosClient.put(`/towers/${id}`, data)).data,
    deactivate: async (id) => (await axiosClient.patch(`/towers/${id}/deactivate`)).data
};

export default towerApi;
