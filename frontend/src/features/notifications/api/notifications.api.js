import axiosClient from "../../../lib/legacyAxios";

const societyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const params = (extra = {}) => ({ params: { ...(societyId() ? { societyId: societyId() } : {}), ...extra } });
const unwrap = async (request) => (await request).data;

const notificationsApi = {
    getNotifications: (filters = {}) => unwrap(axiosClient.get("/notifications", params(filters))),
    getUserNotifications: (userId, filters = {}) => unwrap(axiosClient.get(`/notifications/user/${societyId()}/${userId}`, params(filters))),
    getUnreadNotifications: (userId) => unwrap(axiosClient.get(`/notifications/user/${societyId()}/${userId}/unread`)),
    createNotification: (data) => unwrap(axiosClient.post("/notifications", data)),
    updateNotification: (id, data) => unwrap(axiosClient.put(`/notifications/${id}`, data)),
    markRead: (id) => unwrap(axiosClient.post(`/notifications/${id}/read`)),
    markUnread: (id) => unwrap(axiosClient.post(`/notifications/${id}/unread`)),
    sendNotification: (id) => unwrap(axiosClient.post(`/notifications/${id}/send`)),
    markDelivered: (id) => unwrap(axiosClient.post(`/notifications/${id}/delivered`)),
    markFailed: (id, errorMessage) => unwrap(axiosClient.post(`/notifications/${id}/failed`, { errorMessage })),
    cancelNotification: (id) => unwrap(axiosClient.post(`/notifications/${id}/cancel`)),
    deleteNotification: (id) => unwrap(axiosClient.delete(`/notifications/${id}`)),

    getTemplates: () => unwrap(axiosClient.get("/notification-templates")),
    createTemplate: (data) => unwrap(axiosClient.post("/notification-templates", data)),
    updateTemplate: (id, data) => unwrap(axiosClient.put(`/notification-templates/${id}`, data)),
    activateTemplate: (id) => unwrap(axiosClient.post(`/notification-templates/${id}/activate`)),
    deactivateTemplate: (id) => unwrap(axiosClient.post(`/notification-templates/${id}/deactivate`)),
    deleteTemplate: (id) => unwrap(axiosClient.delete(`/notification-templates/${id}`)),

    getPreferences: (userId) => unwrap(axiosClient.get("/notification-preferences", params(userId ? { userId } : {}))),
    getUserPreferences: (userId) => unwrap(axiosClient.get(`/notification-preferences/user/${societyId()}/${userId}`)),
    createPreference: (data) => unwrap(axiosClient.post("/notification-preferences", data)),
    updatePreference: (id, data) => unwrap(axiosClient.put(`/notification-preferences/${id}`, data)),
    enablePreference: (id) => unwrap(axiosClient.post(`/notification-preferences/${id}/enable`)),
    disablePreference: (id) => unwrap(axiosClient.post(`/notification-preferences/${id}/disable`)),
    deletePreference: (id) => unwrap(axiosClient.delete(`/notification-preferences/${id}`)),

    getBroadcasts: () => unwrap(axiosClient.get("/broadcasts", params())),
    createBroadcast: (data) => unwrap(axiosClient.post("/broadcasts", data)),
    updateBroadcast: (id, data) => unwrap(axiosClient.put(`/broadcasts/${id}`, data)),
    scheduleBroadcast: (id, scheduledAt) => unwrap(axiosClient.post(`/broadcasts/${id}/schedule`, { scheduledAt })),
    startBroadcast: (id) => unwrap(axiosClient.post(`/broadcasts/${id}/start`)),
    markBroadcastSent: (id, recipientCount) => unwrap(axiosClient.post(`/broadcasts/${id}/sent`, { recipientCount })),
    cancelBroadcast: (id) => unwrap(axiosClient.post(`/broadcasts/${id}/cancel`)),
    deleteBroadcast: (id) => unwrap(axiosClient.delete(`/broadcasts/${id}`))
};

export default notificationsApi;
