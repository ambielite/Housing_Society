import axiosClient from "../../../lib/legacyAxios";

const societyParams = () => {
    const societyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
    return societyId ? { params: { societyId } } : {};
};

const securityApi = {
    updateResource: async (resource, id, data) => (await axiosClient.put(`/${resource}/${id}`, data)).data,
    deleteResource: async (resource, id) => (await axiosClient.delete(`/${resource}/${id}`)).data,
    updateAttendance: async (id, data) => (await axiosClient.put(`/staff-attendance/${id}`, data)).data,
    createAttendance: async (data) => (await axiosClient.post("/staff-attendance", data)).data,
    updateDocument: async (id, data) => (await axiosClient.put(`/staff-documents/${id}`, data)).data,
    deleteDocument: async (id) => (await axiosClient.delete(`/staff-documents/${id}`)).data,
    getStaff: async () => (await axiosClient.get("/staff", societyParams())).data,
    createStaff: async (data) => (await axiosClient.post("/staff", data)).data,
    deleteStaff: async (id) => (await axiosClient.delete(`/staff/${id}`)).data,
    updateStaff: async (id, data) => (await axiosClient.put(`/staff/${id}`, data)).data,
    activateStaff: async (id) => (await axiosClient.post(`/staff/${id}/activate`)).data,
    deactivateStaff: async (id) => (await axiosClient.post(`/staff/${id}/deactivate`)).data,
    getAssignments: async () => {
        const staff = (await axiosClient.get("/staff", societyParams())).data;
        const records = Array.isArray(staff?.data) ? staff.data : [];
        const responses = await Promise.all(records.map((person) => axiosClient.get(`/staff-unit-assignments/staff/${person.id}`)));
        return { data: responses.flatMap((response) => Array.isArray(response.data?.data) ? response.data.data : []) };
    },
    createAssignment: async (data) => (await axiosClient.post("/staff-unit-assignments", data)).data,
    deleteAssignment: async (id) => (await axiosClient.delete(`/staff-unit-assignments/${id}`)).data,
    assignmentAction: async (id, action) => (await axiosClient.post(`/staff-unit-assignments/${id}/${action}`)).data,
    getDocuments: async () => {
        const staff = (await axiosClient.get("/staff", societyParams())).data;
        const records = Array.isArray(staff?.data) ? staff.data : [];
        const responses = await Promise.all(records.map((person) => axiosClient.get(`/staff-documents/staff/${person.id}`)));
        return { data: responses.flatMap((response) => Array.isArray(response.data?.data) ? response.data.data : []) };
    },
    createDocument: async (data) => (await axiosClient.post("/staff-documents", data)).data,
    uploadDocument: async (data) => (await axiosClient.post("/staff-documents", data, { headers: { "Content-Type": "multipart/form-data" } })).data,
    verifyDocument: async (id) => (await axiosClient.post(`/staff-documents/${id}/verify`)).data,
    rejectDocument: async (id, data) => (await axiosClient.post(`/staff-documents/${id}/reject`, data)).data,
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
    rosterAction: async (id, action) => (await axiosClient.post(`/rosters/${id}/${action}`)).data,
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
