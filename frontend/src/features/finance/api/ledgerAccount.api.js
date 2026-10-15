import axiosClient from "../../../lib/axios";

const ledgerAccountApi = {
    getAll: async (societyId) => {
        const response = await axiosClient.get("/ledger-accounts", { params: societyId ? { societyId } : {} });
        return response.data;
    }
};
export default ledgerAccountApi;
