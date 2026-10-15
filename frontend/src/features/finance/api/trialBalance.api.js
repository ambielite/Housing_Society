import { legacyApi as axiosClient } from "../../../lib/axios";

const trialBalanceApi = {
    getBySociety: async (societyId) => {
        const response = await axiosClient.get(`/trial-balances/society/${societyId}`);
        return response.data;
    }
};

export default trialBalanceApi;
