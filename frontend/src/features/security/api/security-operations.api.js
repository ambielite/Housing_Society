import apiClient, { legacyApi as axiosClient } from "../../../lib/axios";

const societyParams = () => {
    const societyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
    return societyId ? { params: { societyId } } : {};
};

const securityApi = {
    getUsers: async () => {
        const users = [];
        let page = 1;
        let totalPages = 1;
        do {
            const response = await apiClient.get("/users", {
                params: { ...(societyParams().params || {}), page, limit: 100 },
            });
            const result = response.data?.data || {};
            users.push(...(Array.isArray(result.users) ? result.users : []));
            totalPages = result.pagination?.totalPages || 1;
            page += 1;
        } while (page <= totalPages);
        return users;
    },
    updateResource: async (resource, id, data) => (await axiosClient.put(`/${resource}/${id}`, data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined)).data,
    deleteResource: async (resource, id) => (await axiosClient.delete(`/${resource}/${id}`)).data,
    updateAttendance: async (id, data) => (await axiosClient.put(`/staff-attendance/${id}`, data)).data,
    createAttendance: async (data) => (await axiosClient.post("/staff-attendance", data)).data,
    getStaff: async () => (await axiosClient.get("/staff", societyParams())).data,
    getStaffById: async (id) => (await axiosClient.get(`/staff/${id}`)).data?.data,
    getGuardLoginHistory: async (id) => (await apiClient.get(`/users/guards/${id}/login-history`)).data?.data || [],
    createStaff: async (data) => (await axiosClient.post("/staff", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined)).data,
    deleteStaff: async (id) => (await axiosClient.delete(`/staff/${id}`)).data,
    updateStaff: async (id, data) => {
        const payload = data instanceof FormData
            ? data
            : data?.profilePicture
                ? Object.entries(data).reduce((formData, [key, value]) => {
                    if (value !== undefined && value !== null) formData.append(key, value);
                    return formData;
                }, new FormData())
                : data;
        return (await axiosClient.put(
            `/staff/${id}`,
            payload,
            payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
        )).data;
    },
    activateStaff: async (id) => (await axiosClient.post(`/staff/${id}/activate`)).data,
    deactivateStaff: async (id) => (await axiosClient.post(`/staff/${id}/deactivate`)).data,
    getAttendance: async () => {
        const staff = (await axiosClient.get("/staff", societyParams())).data;
        const records = Array.isArray(staff?.data) ? staff.data : [];
        const responses = await Promise.all(records.map((person) => axiosClient.get(`/staff-attendance/staff/${person.id}`)));
        return { data: responses.flatMap((response) => Array.isArray(response.data?.data) ? response.data.data : []) };
    },
    checkIn: async (data) => (await axiosClient.post("/staff-attendance/check-in", data)).data,
    checkOut: async (data) => (await axiosClient.post("/staff-attendance/check-out", data)).data,
    markAbsent: async (data) => (await axiosClient.post("/staff-attendance/mark-absent", data)).data,
    markLeave: async (data) => (await axiosClient.post("/staff-attendance/mark-leave", data)).data,
    getShifts: async () => (await axiosClient.get("/shifts", societyParams())).data,
    createShift: async (data) => (await axiosClient.post("/shifts", data)).data,
    activateShift: async (id) => (await axiosClient.post(`/shifts/${id}/activate`)).data,
    deactivateShift: async (id) => (await axiosClient.post(`/shifts/${id}/deactivate`)).data,
    deleteShift: async (id) => (await axiosClient.delete(`/shifts/${id}`)).data,
    getRosters: async () => (await axiosClient.get("/rosters", societyParams())).data,
    createRoster: async (data) => (await axiosClient.post("/rosters", data)).data,
    rosterAction: async (id, action, data = {}) => (await axiosClient.post(`/rosters/${id}/${action}`, data)).data,
    getTasks: async () => (await axiosClient.get("/staff-tasks", societyParams())).data,
    createTask: async (data) => (await axiosClient.post("/staff-tasks", data)).data,
    taskAction: async (id, action, data = {}) => (await axiosClient.post(`/staff-tasks/${id}/${action}`, data)).data,
    getCheckpoints: async () => (await axiosClient.get("/checkpoints", societyParams())).data,
    createCheckpoint: async (data) => (await axiosClient.post("/checkpoints", data)).data,
    deleteCheckpoint: async (id) => (await axiosClient.delete(`/checkpoints/${id}`)).data,
    getPatrols: async () => (await axiosClient.get("/patrols", societyParams())).data,
    createPatrol: async (data) => (await axiosClient.post("/patrols", data)).data,
    patrolAction: async (id, action) => (await axiosClient.post(`/patrols/${id}/${action}`)).data,
    getPatrolCheckpoints: async (id) => (await axiosClient.get(`/patrols/${id}/checkpoints`)).data,
    addPatrolCheckpoint: async (id, data) => (await axiosClient.post(`/patrols/${id}/checkpoints`, data)).data,
    verifyCheckpoint: async (id, checkpointId, data) => (await axiosClient.post(`/patrols/${id}/checkpoints/${checkpointId}/verify`, data)).data,
    missCheckpoint: async (id, checkpointId, data) => (await axiosClient.post(`/patrols/${id}/checkpoints/${checkpointId}/missed`, data)).data,
    getIncidents: async () => (await axiosClient.get("/incidents", societyParams())).data,
    createIncident: async (data) => (await axiosClient.post("/incidents", data)).data,
    incidentAction: async (id, action, data = {}) => (await axiosClient.post(`/incidents/${id}/${action}`, data)).data,
    getEmergencies: async () => (await axiosClient.get("/emergencies", societyParams())).data,
    createEmergency: async (data) => (await axiosClient.post("/emergencies", data)).data,
    emergencyAction: async (id, action, data = {}) => (await axiosClient.post(`/emergencies/${id}/${action}`, data)).data,
    getAudits: async () => (await axiosClient.get("/security-audits", societyParams())).data
};

export default securityApi;
