import { legacyApi as axiosClient, societyStorage } from "../../../lib/axios";
import { listVendors } from "../../vendors/api/vendors.api";

const societyParams = () => {
    const societyId = String(societyStorage.get() || "").replace(/^:+/, "").trim();
    return societyId ? { params: { societyId } } : {};
};
const request = async (promise) => (await promise).data;

const assetsApi = {
    getAssets: () => request(axiosClient.get("/assets", societyParams())),
    createAsset: (data) => request(axiosClient.post("/assets", data)),
    updateAsset: (id, data) => request(axiosClient.put(`/assets/${id}`, data)),
    assetAction: (id, action, data = {}) => request(axiosClient.post(`/assets/${id}/${action}`, data)),
    deleteAsset: (id) => request(axiosClient.delete(`/assets/${id}`)),
    getCategories: () => request(axiosClient.get("/asset-categories", societyParams())),
    createCategory: (data) => request(axiosClient.post("/asset-categories", data)),
    updateCategory: (id, data) => request(axiosClient.put(`/asset-categories/${id}`, data)),
    categoryAction: (id, action) => request(axiosClient.post(`/asset-categories/${id}/${action}`)),
    deleteCategory: (id) => request(axiosClient.delete(`/asset-categories/${id}`)),
    getDocuments: () => request(axiosClient.get("/asset-documents", societyParams())),
    createDocument: (data) => request(axiosClient.post("/asset-documents", data, { headers: { "Content-Type": "multipart/form-data" } })),
    updateDocument: (id, data) => request(axiosClient.put(`/asset-documents/${id}`, data)),
    documentAction: (id, action) => request(axiosClient.post(`/asset-documents/${id}/${action}`)),
    updateExpiredDocuments: () => request(axiosClient.post("/asset-documents/update-expired")),
    deleteDocument: (id) => request(axiosClient.delete(`/asset-documents/${id}`)),
    getMaintenance: () => request(axiosClient.get("/asset-maintenance", societyParams())),
    createMaintenance: (data) => request(axiosClient.post("/asset-maintenance", data)),
    updateMaintenance: (id, data) => request(axiosClient.put(`/asset-maintenance/${id}`, data)),
    maintenanceAction: (id, action, data = {}) => request(axiosClient.post(`/asset-maintenance/${id}/${action}`, data)),
    deleteMaintenance: (id) => request(axiosClient.delete(`/asset-maintenance/${id}`)),
    getInventory: () => request(axiosClient.get("/inventory", societyParams())),
    getLowStock: () => request(axiosClient.get("/inventory/low-stock", societyParams())),
    createInventory: (data) => request(axiosClient.post("/inventory", data)),
    updateInventory: (id, data) => request(axiosClient.put(`/inventory/${id}`, data)),
    inventoryAction: (id, action) => request(axiosClient.post(`/inventory/${id}/${action}`)),
    deleteInventory: (id) => request(axiosClient.delete(`/inventory/${id}`)),
    getTransactions: () => request(axiosClient.get("/stock-transactions", societyParams())),
    createTransaction: (kind, data) => request(axiosClient.post(`/stock-transactions/${kind}`, data)),
    deleteTransaction: (id) => request(axiosClient.delete(`/stock-transactions/${id}`)),
    getAmcs: () => request(axiosClient.get("/amcs", societyParams())),
    createAmc: (data) => request(axiosClient.post("/amcs", data)),
    amcAction: (id, action, data = {}) => request(axiosClient.post(`/amcs/${id}/${action}`, data)),
    updateExpiredAmcs: () => request(axiosClient.post("/amcs/update-expired")),
    deleteAmc: (id) => request(axiosClient.delete(`/amcs/${id}`)),
    getVendors: async () => {
        const result = await listVendors({ ...societyParams().params, limit: 100 });
        const vendors = Array.isArray(result) ? result : result?.vendors || [];
        return { vendors: vendors.map((vendor) => ({
            ...vendor,
            legalName: vendor.legal_name || vendor.legalName,
            companyName: vendor.legal_name || vendor.legalName || vendor.trade_name || vendor.tradeName,
            tradeName: vendor.trade_name || vendor.tradeName,
            contactEmail: vendor.contact_email || vendor.contactEmail,
            phone: vendor.phone,
        })) };
    },
    getSchedules: () => request(axiosClient.get("/maintenance-schedules", societyParams())),
    createSchedule: (data) => request(axiosClient.post("/maintenance-schedules", data)),
    updateSchedule: (id, data) => request(axiosClient.put(`/maintenance-schedules/${id}`, data)),
    scheduleAction: (id, action, data = {}) => request(axiosClient.post(`/maintenance-schedules/${id}/${action}`, data)),
    deleteSchedule: (id) => request(axiosClient.delete(`/maintenance-schedules/${id}`)),
    getWorkOrders: () => request(axiosClient.get("/work-orders", societyParams())),
    createWorkOrder: (data) => request(axiosClient.post("/work-orders", data)),
    workOrderAction: (id, action, data = {}) => request(axiosClient.post(`/work-orders/${id}/${action}`, data)),
    deleteWorkOrder: (id) => request(axiosClient.delete(`/work-orders/${id}`)),
    getQrTags: () => request(axiosClient.get("/asset-qr", societyParams())),
    createQr: (data) => request(axiosClient.post("/asset-qr", data)),
    scanQr: (qrValue) => request(axiosClient.post("/asset-qr/scan", { qrValue })),
    qrAction: (id, action) => request(axiosClient.post(`/asset-qr/${id}/${action}`)),
    deleteQr: (id) => request(axiosClient.delete(`/asset-qr/${id}`)),
    getLifecycles: () => request(axiosClient.get("/asset-lifecycle", societyParams())),
    createLifecycle: (data) => request(axiosClient.post("/asset-lifecycle", data)),
    lifecycleAction: (id, action) => request(axiosClient.post(`/asset-lifecycle/${id}/${action}`)),
    lifecycleReminder: (kind, data) => request(axiosClient.post(`/asset-lifecycle/${kind}-reminder`, data)),
    processReminders: () => request(axiosClient.post("/asset-lifecycle/process-due-reminders", {}, societyParams())),
    markExpiredReminders: () => request(axiosClient.post("/asset-lifecycle/mark-expired", {}, societyParams()))
};

export default assetsApi;
