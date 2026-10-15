import { legacyApi as axiosClient } from "../../../lib/axios";

const normalizeSocietyId = (societyId) => String(societyId ?? "").replace(/^:+/, "").trim();

const generalLedgerApi = {
    getBySociety: async (societyId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);

        if (!normalizedSocietyId) {
            return [];
        }

        const response = await axiosClient.get(`/general-ledgers/society/${normalizedSocietyId}`);
        return response.data;
    },

    getByPeriod: async (societyId, accountingPeriodId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);

        if (!normalizedSocietyId) {
            return [];
        }

        const response = await axiosClient.get(`/general-ledgers/period/${normalizedSocietyId}/${accountingPeriodId}`);
        return response.data;
    },

    getByAccount: async (societyId, accountId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);

        if (!normalizedSocietyId) {
            return [];
        }

        const response = await axiosClient.get(`/general-ledgers/account/${normalizedSocietyId}/${accountId}`);
        return response.data;
    }
};

export default generalLedgerApi;
