import axiosClient from "../../../lib/axios";

const reportRequest = async (path, params) => {
    const response = await axiosClient.get(path, { params });
    return response.data?.data ?? response.data;
};

const listFrom = (result) => {
    const payload = result?.data?.data ?? result?.data ?? result;
    return Array.isArray(payload) ? payload : payload?.rows ?? payload?.records ?? payload?.items ?? [];
};

const getResidentSummaryFromResidentModule = async (params) => {
    const [residentResult, ownerResult] = await Promise.allSettled([
        axiosClient.get("/residents", { params: { societyId: params.societyId } }),
        axiosClient.get("/owner-units", { params: { societyId: params.societyId } })
    ]);
    if (residentResult.status === "rejected") throw residentResult.reason;
    const residents = listFrom(residentResult.value);
    const ownerRelations = ownerResult.status === "fulfilled" ? listFrom(ownerResult.value).filter((relation) => relation.status === "ACTIVE") : [];
    const roleBreakdown = {};
    const statusBreakdown = {};
    residents.forEach(({ role, status }) => {
        if (role) roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
        if (status) statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    return {
        available: true,
        totalResidents: residents.filter((resident) => resident.status !== "ARCHIVED").length,
        totalResidentRecords: residents.length,
        activeResidents: statusBreakdown.ACTIVE || 0,
        pendingResidents: statusBreakdown.PENDING || 0,
        suspendedResidents: statusBreakdown.SUSPENDED || 0,
        archivedResidents: statusBreakdown.ARCHIVED || 0,
        owners: (roleBreakdown.PRIMARY_OWNER || 0) + (roleBreakdown.CO_OWNER || 0),
        tenants: roleBreakdown.TENANT || 0,
        familyMembers: roleBreakdown.FAMILY_MEMBER || 0,
        propertyManagers: roleBreakdown.PROPERTY_MANAGER || 0,
        ownersWithActiveUnits: new Set(ownerRelations.map((relation) => relation.ownerId)).size,
        activeOwnerUnitRelations: ownerRelations.length,
        roleBreakdown,
        statusBreakdown
    };
};

const residentsReport = async (params) => {
    const report = await reportRequest("/reports/operations/residents", params);
    if (report?.available !== false) return report;
    return getResidentSummaryFromResidentModule(params);
};

const operationsReport = async (params) => {
    const report = await reportRequest("/reports/operations", params);
    if (report?.residents?.available !== false) return report;
    return { ...report, residents: await getResidentSummaryFromResidentModule(params) };
};

const executiveReport = async (params) => {
    const report = await reportRequest("/reports/dashboard", params);
    if (report?.residents?.totalResidents != null) return report;
    return { ...report, residents: await getResidentSummaryFromResidentModule(params) };
};

const reportsApi = {
    societies: () => axiosClient.get("/societies").then((response) => response.data),
    executive: executiveReport,
    finance: (params) => reportRequest("/reports/finance", params),
    bankBalance: (params) => reportRequest("/reports/finance/bank-balance", params),
    collection: (params) => reportRequest("/reports/finance/collection", params),
    arrears: (params) => reportRequest("/reports/finance/arrears", params),
    incomeExpense: (params) => reportRequest("/reports/finance/income-expense", params),
    operations: operationsReport,
    occupancy: (params) => reportRequest("/reports/operations/occupancy", params),
    residents: residentsReport,
    vehicles: (params) => reportRequest("/reports/operations/vehicles", params),
    parking: (params) => reportRequest("/reports/operations/parking", params),
    visitors: (params) => reportRequest("/reports/security/visitor-summary", params),
    gate: (params) => reportRequest("/reports/security/gate-summary", params),
    staff: (params) => reportRequest("/reports/security/staff-summary", params),
    patrols: (params) => reportRequest("/reports/security/patrol-summary", params),
    approvals: (params) => reportRequest("/reports/approvals", params),
    approvalDetails: (params) => reportRequest("/reports/approvals/approvals", params),
    approvalStatus: (params) => reportRequest("/reports/approvals/approval-status", params),
    sla: (params) => reportRequest("/reports/approvals/sla", params),
    payments: (params) => reportRequest("/reports/approvals/payments", params)
};

export default reportsApi;
