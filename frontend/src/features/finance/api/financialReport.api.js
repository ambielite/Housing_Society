import axiosClient from "../../../lib/legacyAxios";

const normalizeSocietyId = (societyId) => String(societyId ?? "").replace(/^:+/, "").trim();

const financialReportApi = {
    getIncomeExpense: async (societyId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);
        const response = await axiosClient.get(normalizedSocietyId ? `/financial-reports/income-expense/${normalizedSocietyId}` : "/financial-reports");
        return response.data;
    },

    getBalanceSheet: async (societyId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);
        const response = await axiosClient.get(normalizedSocietyId ? `/financial-reports/balance-sheet/${normalizedSocietyId}` : "/financial-reports");
        return response.data;
    },

    getTrialBalanceSummary: async (societyId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);
        const response = await axiosClient.get(normalizedSocietyId ? `/financial-reports/trial-balance/${normalizedSocietyId}` : "/financial-reports");
        return response.data;
    },

    getAccountReport: async (societyId, accountId) => {
        const normalizedSocietyId = normalizeSocietyId(societyId);
        const response = await axiosClient.get(normalizedSocietyId ? `/financial-reports/account/${normalizedSocietyId}/${accountId}` : "/financial-reports");
        return response.data;
    }
};

export default financialReportApi;
