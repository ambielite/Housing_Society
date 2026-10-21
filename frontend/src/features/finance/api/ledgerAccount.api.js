import { legacyApi as axiosClient } from "../../../lib/axios";

const ledgerAccountApi = {
    getAll: async (societyId) => {
        const response = await axiosClient.get("/ledger-accounts", { params: societyId ? { societyId } : {} });
        return response.data;
    },
    create: async (data) => {
        const response = await axiosClient.post("/ledger-accounts", data);
        return response.data;
    },
};
export default ledgerAccountApi;
