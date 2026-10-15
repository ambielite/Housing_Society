import axiosClient from "../../../lib/legacyAxios";

const ledgerAccountApi = {
    getAll: async (societyId) => {
        const response = await axiosClient.get("/ledger-accounts", { params: societyId ? { societyId } : {} });
        return response.data;
    }
};
export default ledgerAccountApi;
