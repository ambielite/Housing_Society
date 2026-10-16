import { legacyApi } from "../../../lib/axios";

const occupancyApi = {
    getByResident: async (residentId, config) => {
        const response = await legacyApi.get(`/occupancies/resident/${residentId}`, config);
        return response.data;
    },
    create: async (data, config) => {
        const response = await legacyApi.post("/occupancies", data, config);
        return response.data;
    }
};

export default occupancyApi;
