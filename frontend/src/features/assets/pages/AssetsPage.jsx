import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, Archive, Bell, Boxes, CalendarClock, ClipboardList, FileText, Gauge, Package, Pencil, Plus, QrCode, RefreshCw, Search, ShieldCheck, Tag, Trash2, Truck, Wrench, X } from "lucide-react";
import { legacyApi as axiosClient } from "../../../lib/axios";
import assetsApi from "../api/assets.api";

const rows = (value) => {
    let result = Array.isArray(value) ? value : value?.data || value?.records || value?.items || [];
    if (!Array.isArray(result) && Array.isArray(result?.rows)) result = result.rows;
    return Array.isArray(result) ? result.filter((item) => item && typeof item === "object") : [];
};
const societyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const fileUrl = (path) => { if (!path) return "#"; if (/^https?:\/\//i.test(path)) return path; const base = import.meta.env.VITE_LEGACY_API_BASE_URL || (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "/api"); return `${base.replace(/\/api\/?$/, "")}${path.startsWith("/") ? path : `/${path}`}`; };
const title = (value) => String(value || "—").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value) => value ? String(value).slice(0, 10) : "—";
const money = (value) => value == null || value === "" ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
const config = {
    asset: { title: "Asset", api: "createAsset", resource: "assets", fields: [["assetCode", "Asset code"], ["assetName", "Asset name"], ["assetType", "Asset type"], ["categoryId", "Category", "category", true], ["vendorId", "Supplier", "vendor", true], ["towerId", "Tower", "tower", true], ["floorId", "Floor", "floor", true], ["unitId", "Unit", "unit", true], ["description", "Description", "textarea", true], ["purchaseDate", "Purchase date", "date", true], ["purchaseCost", "Purchase cost", "number", true], ["invoiceNumber", "Invoice number", "text", true], ["serialNumber", "Serial number", "text", true], ["modelNumber", "Model number", "text", true], ["manufacturer", "Manufacturer", "text", true], ["location", "Location", "text", true], ["commissionedDate", "Commissioned date", "date", true], ["condition", "Condition", "select", ["NEW", "GOOD", "FAIR", "DAMAGED", "CRITICAL"]], ["currentValue", "Current value", "number", true], ["depreciationValue", "Depreciation", "number", true], ["remarks", "Notes", "textarea", true]] },
    category: { title: "Asset category", api: "createCategory", fields: [["categoryCode", "Category code"], ["categoryName", "Category name"], ["description", "Description", "textarea", true], ["remarks", "Notes", "textarea", true]] },
    vendor: { title: "Vendor", api: "createVendor", fields: [["vendorCode", "Vendor code"], ["companyName", "Company name"], ["contactPerson", "Contact person", "text", true], ["phone", "Phone", "tel", true], ["email", "Email", "email", true], ["serviceType", "Service type", "text", true], ["address", "Address", "textarea", true], ["gstin", "GSTIN", "text", true], ["pan", "PAN", "text", true], ["remarks", "Notes", "textarea", true]] },
    inventory: { title: "Inventory item", api: "createInventory", fields: [["itemCode", "Item code"], ["itemName", "Item name"], ["unitOfMeasure", "Unit of measure"], ["category", "Category", "text", true], ["description", "Description", "textarea", true], ["currentStock", "Opening stock", "number"], ["minimumStockLevel", "Minimum stock", "number"], ["reorderLevel", "Reorder level", "number"], ["maximumStockLevel", "Maximum stock", "number", true], ["unitCost", "Unit cost", "number", true], ["storageLocation", "Storage location", "text", true], ["binNumber", "Bin number", "text", true], ["vendorId", "Vendor", "vendor", true], ["remarks", "Notes", "textarea", true]] },
    document: { title: "Asset document", api: "createDocument", fields: [["assetId", "Asset", "asset"], ["documentType", "Document type", "select", ["PURCHASE_INVOICE", "WARRANTY_CERTIFICATE", "AMC_DOCUMENT", "USER_MANUAL", "SERVICE_DOCUMENT", "INSURANCE_DOCUMENT", "OTHER"]], ["documentName", "Document name"], ["documentNumber", "Document number", "text", true], ["file", "Choose document", "file"], ["issueDate", "Issue date", "date", true], ["expiryDate", "Expiry date", "date", true], ["warrantyStartDate", "Warranty start", "date", true], ["warrantyEndDate", "Warranty end", "date", true], ["warrantyProvider", "Warranty provider", "text", true], ["warrantyRemarks", "Warranty notes", "textarea", true], ["remarks", "Notes", "textarea", true]] },
    maintenance: { title: "Maintenance record", api: "createMaintenance", fields: [["assetId", "Asset", "asset"], ["maintenanceType", "Maintenance type", "select", ["PREVENTIVE", "CORRECTIVE", "BREAKDOWN", "INSPECTION", "SERVICING", "REPAIR", "OTHER"]], ["serviceDate", "Service date", "date"], ["issueReported", "Issue reported", "textarea", true], ["workPerformed", "Work performed", "textarea", true], ["technicianName", "Technician", "text", true], ["technicianContact", "Technician contact", "tel", true], ["vendorId", "Vendor", "vendor", true], ["invoiceNumber", "Invoice number", "text", true], ["maintenanceCost", "Total maintenance cost", "number", true], ["partsCost", "Parts cost", "number", true], ["laborCost", "Labor cost", "number", true], ["downtimeHours", "Downtime hours", "number", true], ["nextServiceDate", "Next service date", "date", true], ["warrantyCovered", "Covered by warranty", "checkbox", true], ["warrantyClaimNumber", "Warranty claim number", "text", true], ["remarks", "Notes", "textarea", true]] },
    amc: { title: "AMC contract", api: "createAmc", fields: [["amcNumber", "Contract number"], ["assetId", "Asset", "asset"], ["vendorId", "Vendor", "vendor"], ["startDate", "Start date", "date"], ["endDate", "End date", "date"], ["renewalDate", "Renewal date", "date", true], ["contractCost", "Contract cost", "number"], ["responseTime", "Response time (hours)", "number", true], ["resolutionTime", "Resolution time (hours)", "number", true], ["sla", "SLA", "textarea", true], ["renewalRequired", "Renewal required", "checkbox", true], ["remarks", "Notes", "textarea", true]] },
    schedule: { title: "Preventive maintenance schedule", api: "createSchedule", fields: [["assetId", "Asset", "asset"], ["amcId", "AMC contract", "amc", true], ["vendorId", "Vendor", "vendor", true], ["scheduleCode", "Schedule code"], ["maintenanceTitle", "Maintenance title"], ["maintenanceDescription", "Description", "textarea", true], ["frequencyType", "Frequency", "select", ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "CUSTOM"]], ["frequencyValue", "Frequency value", "number", true], ["startDate", "Start date", "date"], ["nextDueDate", "Next due date", "date"], ["estimatedCost", "Estimated cost", "number", true], ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]], ["autoCreateWorkOrder", "Create work order automatically", "checkbox"], ["remarks", "Notes", "textarea", true]] },
    workOrder: { title: "Work order", api: "createWorkOrder", fields: [["workOrderNumber", "Work order number"], ["assetId", "Asset", "asset"], ["scheduleId", "Schedule", "schedule", true], ["amcId", "AMC contract", "amc", true], ["vendorId", "Vendor", "vendor", true], ["title", "Work title"], ["description", "Description", "textarea", true], ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]], ["scheduledDate", "Scheduled date", "date"], ["assignedTo", "Assigned to", "text", true], ["estimatedCost", "Estimated cost", "number", true], ["remarks", "Notes", "textarea", true]] },
    qr: { title: "QR tag", api: "createQr", fields: [["assetId", "Asset", "asset"], ["remarks", "Notes", "textarea", true]] },
    lifecycle: { title: "Lifecycle reminder", api: "createLifecycle", fields: [["assetId", "Asset", "asset"], ["lifecycleType", "Reminder type", "select", ["WARRANTY_EXPIRY", "AMC_EXPIRY", "MAINTENANCE_DUE", "LOW_STOCK", "RETIREMENT", "DISPOSAL"]], ["title", "Title"], ["description", "Description", "textarea", true], ["dueDate", "Due date", "date", true], ["reminderDate", "Reminder date", "date", true], ["reminderDaysBefore", "Remind before (days)", "number", true], ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]], ["notificationType", "Notification method", "select", ["SYSTEM", "EMAIL", "SMS", "PUSH"]], ["remarks", "Notes", "textarea", true]] }
};
const updateFor = { asset: assetsApi.updateAsset, category: assetsApi.updateCategory, vendor: assetsApi.updateVendor, inventory: assetsApi.updateInventory, document: assetsApi.updateDocument, maintenance: assetsApi.updateMaintenance, schedule: assetsApi.updateSchedule };
const sections = [
    ["overview", "Overview", Gauge], ["assets", "Asset register", Package], ["inventory", "Inventory", Boxes], ["maintenance", "Maintenance", Wrench],
    ["contracts", "AMCs & vendors", ShieldCheck], ["schedules", "Schedules & work orders", CalendarClock], ["documents", "Documents & QR", QrCode], ["reminders", "Lifecycle & reminders", Bell], ["categories", "Categories", Tag]
];
const schema = {
    assets: { key: "assets", title: "Asset register", fields: [["assetCode", "Asset code"], ["assetName", "Asset"], ["categoryId", "Category"], ["location", "Location"], ["purchaseDate", "Purchased"], ["purchaseCost", "Purchase cost"], ["condition", "Condition"], ["status", "Status"]] },
    inventory: { key: "inventory", title: "Inventory", fields: [["itemCode", "Code"], ["itemName", "Inventory item"], ["category", "Category"], ["currentStock", "In stock"], ["minimumStockLevel", "Minimum"], ["unitOfMeasure", "Unit"], ["storageLocation", "Location"]] },
    transactions: { key: "transactions", title: "Stock transactions", fields: [["transactionNumber", "Reference"], ["transactionType", "Type"], ["inventoryId", "Item"], ["quantity", "Quantity"], ["previousStock", "Previous stock"], ["newStock", "New stock"], ["transactionDate", "Date"]] },
    maintenance: { key: "maintenance", title: "Maintenance history", fields: [["assetId", "Asset"], ["maintenanceType", "Type"], ["serviceDate", "Service date"], ["maintenanceCost", "Cost"], ["maintenanceStatus", "Status"], ["nextServiceDate", "Next service"]] },
    amcs: { key: "amcs", title: "AMC contracts", fields: [["amcNumber", "Contract"], ["assetId", "Asset"], ["vendorId", "Vendor"], ["startDate", "Start date"], ["endDate", "Expires"], ["contractCost", "Annual cost"], ["status", "Status"]] },
    vendors: { key: "vendors", title: "Vendors", fields: [["vendorCode", "Code"], ["companyName", "Company"], ["serviceType", "Services"], ["contactPerson", "Contact"], ["phone", "Phone"], ["status", "Status"]] },
    schedules: { key: "schedules", title: "Preventive schedules", fields: [["scheduleCode", "Code"], ["maintenanceTitle", "Maintenance"], ["assetId", "Asset"], ["frequencyType", "Frequency"], ["nextDueDate", "Next due"], ["priority", "Priority"], ["status", "Status"]] },
    workOrders: { key: "workOrders", title: "Work orders", fields: [["workOrderNumber", "Work order"], ["title", "Task"], ["assetId", "Asset"], ["scheduledDate", "Scheduled"], ["assignedTo", "Assigned to"], ["priority", "Priority"], ["status", "Status"]] },
    documents: { key: "documents", title: "Documents & warranty", fields: [["documentName", "Document"], ["documentType", "Type"], ["assetId", "Asset"], ["warrantyProvider", "Warranty provider"], ["warrantyEndDate", "Warranty ends"], ["expiryDate", "Expires"], ["status", "Status"]] },
    qrTags: { key: "qrTags", title: "QR tags", fields: [["qrCode", "QR code"], ["assetId", "Asset"], ["generatedAt", "Created"], ["status", "Status"]] },
    lifecycle: { key: "lifecycle", title: "Lifecycle reminders", fields: [["title", "Reminder"], ["lifecycleType", "Type"], ["assetId", "Asset"], ["reminderDate", "Reminder date"], ["dueDate", "Due date"], ["priority", "Priority"], ["status", "Status"]] },
    categories: { key: "categories", title: "Asset categories", fields: [["categoryCode", "Code"], ["categoryName", "Category"], ["description", "Description"], ["status", "Status"]] }
};
schema.contracts = schema.amcs;
const refs = { assets: "assets", categories: "categories", vendors: "vendors", inventory: "inventory", amcs: "amcs", schedules: "schedules", workOrders: "workOrders", maintenance: "maintenance", documents: "documents", qrTags: "qrTags", lifecycle: "lifecycle" };

export default function AssetsPage() {
    const { section } = useParams();
    const navigate = useNavigate();
    const [active, setActive] = useState(section || "overview");
    const [data, setData] = useState({});
    const [lookup, setLookup] = useState({ towers: [], floors: [], units: [] });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [form, setForm] = useState("");
    const [edit, setEdit] = useState(null);
    const [transactionType, setTransactionType] = useState("stock-in");
    const [scan, setScan] = useState("");

    const load = async () => {
        setLoading(true); setError("");
        const requests = {
            assets: assetsApi.getAssets, categories: assetsApi.getCategories, documents: assetsApi.getDocuments, maintenance: assetsApi.getMaintenance,
            inventory: assetsApi.getInventory, transactions: assetsApi.getTransactions, amcs: assetsApi.getAmcs, vendors: assetsApi.getVendors,
            schedules: assetsApi.getSchedules, workOrders: assetsApi.getWorkOrders, qrTags: assetsApi.getQrTags, lifecycle: assetsApi.getLifecycles
        };
        const names = Object.keys(requests);
        const results = await Promise.allSettled(names.map((name) => requests[name]()));
        const next = {}; const failed = [];
        results.forEach((result, index) => { const name = names[index]; next[name] = result.status === "fulfilled" ? rows(result.value) : []; if (result.status === "rejected") failed.push(`${name}: ${result.reason?.response?.data?.message || result.reason?.message || "request failed"}`); });
        const societyAssetIds = new Set((next.assets || []).map((item) => String(item.id)));
        const societyInventoryIds = new Set((next.inventory || []).map((item) => String(item.id)));
        ["documents", "maintenance", "qrTags"].forEach((key) => { next[key] = (next[key] || []).filter((item) => societyAssetIds.has(String(item.assetId))); });
        next.transactions = (next.transactions || []).filter((item) => societyInventoryIds.has(String(item.inventoryId)) || societyInventoryIds.has(String(item.sourceInventoryId)) || societyInventoryIds.has(String(item.destinationInventoryId)));
        setData(next);
        if (failed.length) setError(`Some Assets data could not load: ${failed.join(", ")}. Check the API and refresh.`);
        try {
            const [towerResponse, floorResponse, unitResponse] = await Promise.all([axiosClient.get("/towers"), axiosClient.get("/floors"), axiosClient.get("/units")]);
            setLookup({ towers: rows(towerResponse.data), floors: rows(floorResponse.data), units: rows(unitResponse.data) });
        } catch { setLookup({ towers: [], floors: [], units: [] }); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { if (section && section !== active) setActive(section); }, [section]);
    useEffect(() => { const nextSection = active === "overview" ? "overview" : active; if (section !== nextSection) navigate(`/assets/${nextSection}`, { replace: true }); }, [active]);

    const recordSection = active === "reminders" ? "lifecycle" : active;
    const records = schema[recordSection] ? data[schema[recordSection].key] || [] : [];
    const filtered = useMemo(() => { const needle = search.trim().toLowerCase(); return records.filter((item) => !needle || Object.values(item).map((value) => typeof value === "object" ? JSON.stringify(value) : String(value ?? "")).join(" ").toLowerCase().includes(needle)); }, [records, search]);
    const assets = data.assets || []; const vendors = data.vendors || []; const inventory = data.inventory || [];
    const assetName = (id) => { const asset = assets.find((item) => String(item.id) === String(id)); return asset ? `${asset.assetCode} · ${asset.assetName}` : "—"; };
    const vendorName = (id) => vendors.find((item) => String(item.id) === String(id))?.companyName || "—";
    const itemName = (id) => inventory.find((item) => String(item.id) === String(id))?.itemName || "—";
    const categoryName = (id) => (data.categories || []).find((item) => String(item.id) === String(id))?.categoryName || "—";

    const act = async (fn, ...args) => { try { setBusy(true); setError(""); await fn(...args); await load(); } catch (err) { setError(err.response?.data?.message || err.message || "Action could not be completed."); } finally { setBusy(false); } };
    const submit = async (event) => {
        event.preventDefault(); const formData = new FormData(event.currentTarget); const cfg = config[form];
        let payload = form === "document" ? formData : Object.fromEntries(formData.entries());
        if (form === "transaction" && transactionType === "transfer" && (!formData.get("sourceInventoryId") || !formData.get("destinationInventoryId"))) { setError("Choose both a source and a destination inventory item for a transfer."); return; }
        const numeric = ["purchaseCost", "currentValue", "depreciationValue", "currentStock", "minimumStockLevel", "reorderLevel", "maximumStockLevel", "unitCost", "maintenanceCost", "partsCost", "laborCost", "downtimeHours", "contractCost", "responseTime", "resolutionTime", "frequencyValue", "estimatedCost", "actualCost", "reminderDaysBefore", "quantity", "newStock", "disposalValue"];
        if (form !== "document") {
            Object.keys(payload).forEach((key) => { if (payload[key] === "") payload[key] = null; else if (numeric.includes(key)) payload[key] = Number(payload[key]); else if (["warrantyCovered", "renewalRequired", "autoCreateWorkOrder"].includes(key)) payload[key] = payload[key] === "true"; });
            payload.societyId = societyId();
        } else if (!formData.get("file")?.size) { setError("Choose a document file to upload."); return; }
        try {
            setBusy(true); setError("");
            if (form === "transaction") await assetsApi.createTransaction(transactionType, payload);
            else if (form === "renewAmc") await assetsApi.amcAction(edit.id, "renew", payload);
            else if (form === "assignWorkOrder") await assetsApi.workOrderAction(edit.id, "assign", { assignedTo: payload.assignedTo });
            else if (form === "completeWorkOrder") await assetsApi.workOrderAction(edit.id, "complete", payload);
            else if (form === "lifecycleReminder") await assetsApi.lifecycleReminder(edit.kind, payload);
            else if (edit?.id && updateFor[form]) await updateFor[form](edit.id, payload);
            else await assetsApi[cfg.api](payload);
            setForm(""); setEdit(null); await load();
        } catch (err) { setError(err.response?.data?.message || err.message || `Could not save ${cfg?.title || "record"}.`); }
        finally { setBusy(false); }
    };
    const openForm = (key, record = null) => { setEdit(record); setForm(key); };

    const valuesFor = (section, item) => {
        const get = (key) => item[key] && typeof item[key] === "object" ? item[key].name || item[key].title || item[key].id : item[key];
        if (section === "assets") return [item.assetCode, item.assetName, categoryName(item.categoryId), item.location || "Common area", date(item.purchaseDate), money(item.purchaseCost), title(item.condition), title(item.status)];
        if (section === "inventory") return [item.itemCode, item.itemName, item.category || "—", `${item.currentStock ?? 0}`, `${item.minimumStockLevel ?? 0}`, item.unitOfMeasure, item.storageLocation || "—"];
        if (section === "transactions") return [item.transactionNumber, title(item.transactionType), itemName(item.inventoryId), item.quantity, item.previousStock, item.newStock, date(item.transactionDate)];
        if (section === "maintenance") return [assetName(item.assetId), title(item.maintenanceType), date(item.serviceDate), money(item.maintenanceCost), title(item.maintenanceStatus), date(item.nextServiceDate)];
        if (section === "amcs" || section === "contracts") return [item.amcNumber, assetName(item.assetId), vendorName(item.vendorId), date(item.startDate), date(item.endDate), money(item.contractCost), title(item.status)];
        if (section === "vendors") return [item.vendorCode, item.companyName, item.serviceType || "—", item.contactPerson || "—", item.phone || "—", title(item.status)];
        if (section === "schedules") return [item.scheduleCode, item.maintenanceTitle, assetName(item.assetId), title(item.frequencyType), date(item.nextDueDate), title(item.priority), title(item.status)];
        if (section === "workOrders") return [item.workOrderNumber, item.title, assetName(item.assetId), date(item.scheduledDate), item.assignedTo || "Unassigned", title(item.priority), title(item.status)];
        if (section === "documents") return [item.documentName, title(item.documentType), assetName(item.assetId), item.warrantyProvider || "—", date(item.warrantyEndDate), date(item.expiryDate), title(item.status)];
        if (section === "qrTags") return [item.qrCode, assetName(item.assetId), date(item.generatedAt), title(item.status)];
        if (section === "lifecycle") return [item.title, title(item.lifecycleType), assetName(item.assetId), date(item.reminderDate), date(item.dueDate), title(item.priority), title(item.status)];
        if (section === "categories") return [item.categoryCode, item.categoryName, item.description || "—", title(item.status)];
        return schema[section].fields.map(([key]) => get(key));
    };

    const actionFor = (item) => {
        const buttons = [];
        const add = (label, fn, ...args) => buttons.push(<button key={label} type="button" className="assets-row-action" disabled={busy} onClick={() => act(fn, ...args)}>{label}</button>);
        const remove = (fn, noun) => buttons.push(<button key="delete" type="button" className="society-icon-action society-delete-action" title={`Delete ${noun}`} aria-label={`Delete ${noun}`} disabled={busy} onClick={() => window.confirm(`Delete this ${noun}?`) && act(fn, item.id)}><Trash2 size={15}/></button>);
        const edit = (key, record = item) => buttons.push(<button key="edit" type="button" className="society-icon-action" title="Edit record" aria-label="Edit record" disabled={busy} onClick={() => openForm(key, record)}><Pencil size={15}/></button>);
        if (active === "assets") {
            edit("asset");
            if (item.status === "PURCHASED") add("Activate", assetsApi.assetAction, item.id, "activate");
            if (item.status === "ACTIVE" || item.status === "DAMAGED") add("Maintenance", assetsApi.assetAction, item.id, "maintenance");
            if (!['RETIRED', 'DISPOSED'].includes(item.status)) { add("Retire", assetsApi.assetAction, item.id, "retire", { retirementDate: new Date().toISOString().slice(0,10) }); add("Dispose", assetsApi.assetAction, item.id, "dispose", { disposalDate: new Date().toISOString().slice(0,10), disposalMethod: "Disposed" }); }
            remove(assetsApi.deleteAsset, "asset");
        } else if (active === "inventory") {
            edit("inventory");
            buttons.push(<button key="stock" className="assets-row-action" onClick={() => openForm("transaction")}>Stock movement</button>);
            add(item.status === "ACTIVE" ? "Deactivate" : "Activate", assetsApi.inventoryAction, item.id, item.status === "ACTIVE" ? "deactivate" : "activate"); remove(assetsApi.deleteInventory, "inventory item");
        } else if (active === "transactions") remove(assetsApi.deleteTransaction, "stock transaction");
        else if (active === "maintenance") {
            edit("maintenance");
            if (item.maintenanceStatus === "SCHEDULED") add("Start", assetsApi.maintenanceAction, item.id, "start");
            if (item.maintenanceStatus === "IN_PROGRESS") add("Complete", assetsApi.maintenanceAction, item.id, "complete", { completionDate: new Date().toISOString().slice(0,10), workPerformed: item.workPerformed || "Maintenance completed" });
            if (["SCHEDULED", "IN_PROGRESS"].includes(item.maintenanceStatus)) add("Cancel", assetsApi.maintenanceAction, item.id, "cancel");
            remove(assetsApi.deleteMaintenance, "maintenance record");
        } else if (active === "amcs" || active === "contracts") {
            if (["DRAFT", "EXPIRING_SOON", "RENEWAL_INITIATED"].includes(item.status)) add("Renew", (id) => { openForm("renewAmc", item); }, item.id);
            if (item.status === "ACTIVE") add("Renewal process", assetsApi.amcAction, item.id, "initiate-renewal");
            if (!['EXPIRED', 'TERMINATED', 'RENEWED'].includes(item.status)) { add("Mark expired", assetsApi.amcAction, item.id, "expire"); add("Terminate", assetsApi.amcAction, item.id, "terminate"); }
            remove(assetsApi.deleteAmc, "AMC");
        } else if (active === "vendors") {
            edit("vendor");
            add(item.status === "ACTIVE" ? "Deactivate" : "Activate", assetsApi.vendorAction, item.id, item.status === "ACTIVE" ? "deactivate" : "activate");
            if (item.status !== "BLACKLISTED") add("Blacklist", assetsApi.vendorAction, item.id, "blacklist"); remove(assetsApi.deleteVendor, "vendor");
        } else if (active === "schedules") {
            edit("schedule");
            const action = item.status === "ACTIVE" ? "pause" : "activate";
            add(item.status === "ACTIVE" ? "Pause" : "Activate", assetsApi.scheduleAction, item.id, action);
            if (item.status === "ACTIVE") add("Complete", assetsApi.scheduleAction, item.id, "complete");
            add("Update next due", (id) => window.prompt("Enter next due date (YYYY-MM-DD)") && act(assetsApi.scheduleAction, id, "update-next-due", { nextDueDate: window.prompt("Enter next due date (YYYY-MM-DD)") }));
            if (item.status !== "CANCELLED") add("Cancel", assetsApi.scheduleAction, item.id, "cancel"); remove(assetsApi.deleteSchedule, "schedule");
        } else if (active === "workOrders") {
            if (item.status === "OPEN") add("Assign", (id) => openForm("assignWorkOrder", item), item.id);
            if (["OPEN", "ASSIGNED"].includes(item.status)) add("Start", assetsApi.workOrderAction, item.id, "start");
            if (item.status === "IN_PROGRESS") { add("On hold", assetsApi.workOrderAction, item.id, "hold"); add("Complete", (id) => openForm("completeWorkOrder", item), item.id); }
            if (!['COMPLETED', 'CANCELLED'].includes(item.status)) add("Cancel", assetsApi.workOrderAction, item.id, "cancel"); remove(assetsApi.deleteWorkOrder, "work order");
        } else if (active === "documents") { buttons.push(<a key="open" className="society-workflow-action" href={fileUrl(item.filePath)} target="_blank" rel="noreferrer">Open</a>); add(item.status === "ACTIVE" ? "Deactivate" : "Activate", assetsApi.documentAction, item.id, item.status === "ACTIVE" ? "deactivate" : "activate"); remove(assetsApi.deleteDocument, "document"); }
        else if (active === "qrTags") { if (item.qrImagePath) buttons.push(<a key="print" className="society-workflow-action" href={fileUrl(item.qrImagePath)} target="_blank" rel="noreferrer">Print / download</a>); add("Regenerate", assetsApi.qrAction, item.id, "regenerate"); add(item.status === "ACTIVE" ? "Deactivate" : "Activate", assetsApi.qrAction, item.id, item.status === "ACTIVE" ? "deactivate" : "activate"); remove(assetsApi.deleteQr, "QR tag"); }
        else if (active === "lifecycle" || active === "reminders") { if (item.status === "PENDING") add("Send reminder", assetsApi.lifecycleAction, item.id, "send"); if (item.status === "SENT") add("Acknowledge", assetsApi.lifecycleAction, item.id, "acknowledge"); if (!["COMPLETED", "CANCELLED", "EXPIRED"].includes(item.status)) { add("Complete", assetsApi.lifecycleAction, item.id, "complete"); add("Cancel", assetsApi.lifecycleAction, item.id, "cancel"); } if (!["SENT", "ACKNOWLEDGED", "COMPLETED"].includes(item.status)) remove((id) => axiosClient.delete(`/asset-lifecycle/${id}`), "reminder"); }
        else if (active === "categories") { edit("category"); add(item.status === "ACTIVE" ? "Deactivate" : "Activate", assetsApi.categoryAction, item.id, item.status === "ACTIVE" ? "deactivate" : "activate"); remove(assetsApi.deleteCategory, "category"); }
        return <div className="society-row-actions">{buttons}</div>;
    };

    const choiceList = (kind) => {
        if (kind === "select") return [];
        const sources = { asset: assets.map((item) => ({ id: item.id, label: `${item.assetCode} · ${item.assetName}` })), category: (data.categories || []).map((item) => ({ id: item.id, label: item.categoryName })), vendor: vendors.map((item) => ({ id: item.id, label: `${item.companyName}${item.vendorCode ? ` · ${item.vendorCode}` : ""}` })), inventory: inventory.map((item) => ({ id: item.id, label: `${item.itemCode} · ${item.itemName}` })), amc: (data.amcs || []).map((item) => ({ id: item.id, label: `${item.amcNumber} · ${assetName(item.assetId)}` })), schedule: (data.schedules || []).map((item) => ({ id: item.id, label: `${item.scheduleCode} · ${item.maintenanceTitle}` })), tower: lookup.towers.map((item) => ({ id: item.id, label: item.name })), floor: lookup.floors.map((item) => ({ id: item.id, label: item.name || `Floor ${item.floorNumber}` })), unit: lookup.units.map((item) => ({ id: item.id, label: item.unitNumber || item.name })) };
        return sources[kind] || [];
    };
    const sectionAdd = { assets: "asset", inventory: "inventory", maintenance: "maintenance", contracts: "amc", schedules: "schedule", documents: "document", categories: "category" }[active];

    return <section className="society-dashboard assets-page">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot"/> PROPERTY OPERATIONS</div><h1>Assets & maintenance</h1><p>Track asset ownership, inventory, service contracts, and maintenance from purchase to retirement.</p></div><button className="society-add-button" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
        <nav className="security-tabs assets-tabs" aria-label="Assets sections">{sections.map(([id, label, Icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => { setActive(id); setSearch(""); }}><Icon size={16}/>{label}</button>)}</nav>
        {active === "overview" ? <>
            <div className="society-stats assets-stats">{[["Registered assets", assets.length, Package], ["Low stock items", (data.inventory || []).filter((item) => Number(item.currentStock) <= Number(item.minimumStockLevel)).length, Boxes], ["AMCs expiring soon", (data.amcs || []).filter((item) => item.status === "EXPIRING_SOON").length, ShieldCheck], ["Open work orders", (data.workOrders || []).filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status)).length, Wrench]].map(([label, count, Icon]) => <article className="society-stat-card" key={label}><span className="society-stat-icon society-stat-icon-blue"><Icon size={19}/></span><div><span className="society-stat-label">{label}</span><strong>{loading ? "—" : count}</strong></div></article>)}</div>
            <div className="society-lifecycle-grid">{[["Assets", "assets", Package], ["Inventory", "inventory", Boxes], ["Maintenance", "maintenance", Wrench], ["AMCs & vendors", "contracts", ShieldCheck], ["Schedules & work orders", "schedules", CalendarClock], ["Documents & QR", "documents", QrCode], ["Lifecycle reminders", "reminders", Bell], ["Categories", "categories", Tag]].map(([label, section, Icon]) => <button className="assets-quick-card" key={section} onClick={() => setActive(section)}><Icon size={19}/><span>{label}</span><strong>{section === "contracts" ? (data.amcs || []).length : section === "documents" ? (data.documents || []).length + (data.qrTags || []).length : section === "schedules" ? (data.schedules || []).length + (data.workOrders || []).length : section === "reminders" ? (data.lifecycle || []).length : (data[section] || []).length}</strong></button>)}</div>
            <section className="society-list-panel"><div className="society-list-heading"><div><h2>Needs attention</h2><p>Stock alerts, upcoming contract expiries, and due maintenance.</p></div><span className="society-count">{(data.lifecycle || []).filter((item) => item.status === "PENDING").length} reminders</span></div><div className="assets-alert-list">{(data.inventory || []).filter((item) => Number(item.currentStock) <= Number(item.minimumStockLevel)).slice(0,5).map((item) => <div key={item.id}><span className="assets-alert-icon"><Boxes size={16}/></span><strong>{item.itemName}</strong><small>{item.currentStock} {item.unitOfMeasure} available · minimum {item.minimumStockLevel}</small><button onClick={() => { setActive("inventory"); setTransactionType("stock-in"); }}>Review stock</button></div>)}{(data.amcs || []).filter((item) => item.status === "EXPIRING_SOON").slice(0,4).map((item) => <div key={item.id}><span className="assets-alert-icon"><CalendarClock size={16}/></span><strong>{item.amcNumber}</strong><small>{assetName(item.assetId)} · expires {date(item.endDate)}</small><button onClick={() => setActive("contracts")}>Review contract</button></div>)}{!(data.inventory || []).some((item) => Number(item.currentStock) <= Number(item.minimumStockLevel)) && !(data.amcs || []).some((item) => item.status === "EXPIRING_SOON") && <p className="assets-clear">No low stock or near-expiry AMC alerts.</p>}</div></section>
        </> : <section className="society-list-panel"><div className="society-list-heading"><div><h2>{active === "contracts" ? "AMCs & vendors" : active === "schedules" ? "Schedules & work orders" : active === "documents" ? "Documents & QR tags" : active === "reminders" ? "Lifecycle & reminders" : schema[active]?.title}</h2><p>{active === "inventory" ? "Current balances, low stock, and the complete stock movement ledger." : active === "maintenance" ? "Service history, labor and parts cost, downtime, and warranty claims." : "Manage records, due dates, status changes, and lifecycle history."}</p></div><span className="society-count">{loading ? "Loading" : `${records.length} records`}</span></div>
            <div className="society-toolbar"><label className="society-search"><Search size={17}/><input aria-label="Search assets records" placeholder="Search records" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
                {sectionAdd && <button className="society-add-button" onClick={() => openForm(sectionAdd)}><Plus size={16}/> Add {config[sectionAdd]?.title.toLowerCase()}</button>}
                {active === "transactions" && <><button className="society-workflow-action" onClick={() => setActive("inventory")}>Back to inventory</button><button className="society-add-button" onClick={() => openForm("transaction")}><Plus size={16}/> Record movement</button></>}
                {active === "vendors" && <><button className="society-add-button" onClick={() => openForm("vendor")}><Plus size={16}/> Add vendor</button><button className="society-workflow-action" onClick={() => setActive("contracts")}>Back to AMCs</button></>}
                {active === "workOrders" && <><button className="society-add-button" onClick={() => openForm("workOrder")}><Plus size={16}/> Create work order</button><button className="society-workflow-action" onClick={() => setActive("schedules")}>Back to schedules</button></>}
                {active === "qrTags" && <><button className="society-add-button" onClick={() => openForm("qr")}><Plus size={16}/> Generate QR tag</button><button className="society-workflow-action" onClick={() => setActive("documents")}>Back to documents</button></>}
                {active === "inventory" && <><button className="society-workflow-action" onClick={() => { setTransactionType("stock-in"); openForm("transaction"); }}>Stock in</button><button className="society-workflow-action" onClick={() => { setTransactionType("stock-out"); openForm("transaction"); }}>Stock out</button><button className="society-workflow-action" onClick={() => { setTransactionType("return"); openForm("transaction"); }}>Return</button><button className="society-workflow-action" onClick={() => { setTransactionType("transfer"); openForm("transaction"); }}>Transfer</button><button className="society-workflow-action" onClick={() => { setTransactionType("adjustment"); openForm("transaction"); }}>Adjust</button><button className="society-workflow-action" onClick={async () => { try { const result = await assetsApi.getLowStock(); window.alert(`${rows(result).length} items are at or below minimum stock.`); } catch (err) { setError(err.response?.data?.message || "Could not load low-stock alerts."); } }}>Low stock alerts</button></>}
                {active === "maintenance" && <button className="society-workflow-action" onClick={() => setActive("schedules")}>Preventive schedules</button>}
                {active === "contracts" && <><button className="society-add-button" onClick={() => openForm("vendor")}><Plus size={16}/> Add vendor</button><button className="society-workflow-action" onClick={() => act(assetsApi.updateExpiredAmcs)}>Update expired</button></>}
                {active === "schedules" && <button className="society-add-button" onClick={() => openForm("workOrder")}><Plus size={16}/> Create work order</button>}
                {active === "documents" && <><button className="society-add-button" onClick={() => openForm("qr")}><QrCode size={16}/> Generate QR tag</button><button className="society-workflow-action" onClick={() => openForm("document")}>Upload document</button><button className="society-workflow-action" onClick={() => act(assetsApi.updateExpiredDocuments)}>Update expired documents</button></>}
                {active === "reminders" && <><button className="society-add-button" onClick={() => openForm("lifecycle")}><Plus size={16}/> Create reminder</button><button className="society-workflow-action" onClick={() => act(assetsApi.processReminders)}>Process due reminders</button><button className="society-workflow-action" onClick={() => act(assetsApi.markExpiredReminders)}>Mark expired</button></>}
                {/* {active === "categories" && <button className="society-add-button" onClick={() => openForm("category")}><Plus size={16}/> Add Asset category</button>} */}
                {active === "documents" && <form className="assets-scan" onSubmit={async (event) => { event.preventDefault(); try { const result = await assetsApi.scanQr(scan); setError(""); window.alert(`QR scan matched ${result?.data?.asset?.assetName || result?.data?.assetName || "an asset"}.`); } catch (err) { setError(err.response?.data?.message || "QR code could not be found."); } }}><input aria-label="Scan QR value" placeholder="Scan or enter QR value" value={scan} onChange={(event) => setScan(event.target.value)}/><button className="society-workflow-action" disabled={!scan}>Scan</button></form>}
            </div>
            {active === "inventory" && <div className="assets-view-toggle"><button type="button" className="active" onClick={() => {}}>Inventory items</button><button type="button" onClick={() => setActive("transactions")}>Stock transaction history ({(data.transactions || []).length})</button></div>}
            {active === "contracts" && <div className="assets-view-toggle"><button type="button" className="active" onClick={() => {}}>AMC contracts</button><button type="button" onClick={() => setActive("vendors")}>Vendors ({vendors.length})</button></div>}
            {active === "schedules" && <div className="assets-view-toggle"><button type="button" className="active" onClick={() => {}}>Maintenance schedules</button><button type="button" onClick={() => setActive("workOrders")}>Work orders ({(data.workOrders || []).length})</button></div>}
            {active === "documents" && <div className="assets-view-toggle"><button type="button" className="active" onClick={() => {}}>Documents</button><button type="button" onClick={() => setActive("qrTags")}>QR tags ({(data.qrTags || []).length})</button></div>}
            {active === "reminders" && <div className="assets-reminder-actions">{[["warranty", "Warranty reminder"], ["amc", "AMC reminder"], ["maintenance", "Maintenance reminder"], ["low-stock", "Low-stock reminder"]].map(([kind, label]) => <button key={kind} className="society-workflow-action" onClick={() => { setEdit({ kind }); setForm("lifecycleReminder"); }}>{label}</button>)}</div>}
            {active === "qrTags" && <div className="assets-qr-helper"></div>}
            {loading ? <div className="society-loading">Loading assets records...</div> : filtered.length === 0 ? <div className="society-empty"><h3>No records found</h3><p>Add a record or adjust the search filter.</p>{sectionAdd && <button className="society-add-button" onClick={() => openForm(sectionAdd)}><Plus size={16}/> Add first record</button>}</div> : <div className="society-table-wrap"><table className="society-table"><thead><tr>{(schema[recordSection]?.fields || []).map(([key, label]) => <th key={key}>{label}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}>{valuesFor(recordSection, item).map((value, index) => <td key={index}>{value}</td>)}<td>{actionFor(item)}</td></tr>)}</tbody></table></div>}
        </section>}

        {form && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) { setForm(""); setEdit(null); } }}><section className="society-form-modal"><header className="security-modal-header"><div><h2>{form === "transaction" ? `Record ${transactionType.replace("-", " ")}` : form === "renewAmc" ? "Renew AMC contract" : form === "assignWorkOrder" ? "Assign work order" : form === "completeWorkOrder" ? "Complete work order" : form === "lifecycleReminder" ? `${title(edit?.kind || "")} reminder` : edit?.id ? `Edit ${config[form]?.title.toLowerCase()}` : config[form]?.title}</h2><p>Enter the record details below.</p></div><button type="button" aria-label="Close" onClick={() => { setForm(""); setEdit(null); }}><X size={18}/></button></header><form onSubmit={submit}><div className="security-form-grid">
            {(form === "transaction" ? [["inventoryId", "Inventory item", "inventory"], ["quantity", "Quantity", "number"], ["reason", "Reason", "textarea", true], ["referenceNumber", "Reference number", "text", true], ["referenceType", "Reference type", "text", true], ["transactionDate", "Transaction date", "date", true], ["performedBy", "Performed by", "text", true], ["remarks", "Notes", "textarea", true], ...(transactionType === "transfer" ? [["destinationInventoryId", "Destination item", "inventory"], ["sourceInventoryId", "Source item", "inventory", true]] : []), ...(transactionType === "adjustment" ? [["newStock", "New stock balance", "number"]] : [])] : form === "renewAmc" ? [["amcNumber", "Renewal contract number"], ["vendorId", "Vendor", "vendor"], ["startDate", "Renewal start", "date"], ["endDate", "Renewal end", "date"], ["contractCost", "Contract cost", "number"], ["remarks", "Notes", "textarea", true]] : form === "assignWorkOrder" ? [["assignedTo", "Assign to"]] : form === "completeWorkOrder" ? [["actualCost", "Actual cost", "number", true], ["completionNotes", "Completion notes", "textarea", true]] : form === "lifecycleReminder" ? [["assetId", "Asset", "asset"], ["title", "Title"], ["description", "Description", "textarea", true], ["dueDate", "Due date", "date", true], ["reminderDate", "Reminder date", "date", true], ["reminderDaysBefore", "Remind before (days)", "number", true], ["priority", "Priority", "select", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]], ["notificationType", "Notification method", "select", ["SYSTEM", "EMAIL", "SMS", "PUSH"]]] : config[form]?.fields || []).map(([name, label, type = "text", options, optional]) => {
                const isOptional = optional ?? (typeof options === "boolean" ? options : false);
                const original = edit?.id ? edit[name] : undefined;
                const defaultValue = original instanceof Date ? original.toISOString().slice(0,10) : type === "date" && original ? String(original).slice(0,10) : original ?? (name === "renewalRequired" || name === "autoCreateWorkOrder" ? "true" : name === "priority" ? "MEDIUM" : name === "condition" ? "GOOD" : name === "transactionDate" ? new Date().toISOString().slice(0,16) : undefined);
                const source = type === "select" ? options.map((value) => ({ id: value, label: title(value) })) : choiceList(type);
                if (form === "transaction" && transactionType === "transfer" && name === "inventoryId") return null;
                return <label className="form-group" key={name}>{label}{type === "textarea" ? <textarea name={name} rows="3" defaultValue={defaultValue} required={!isOptional}/> : type === "checkbox" ? <select name={name} defaultValue={defaultValue ?? "false"}><option value="true">Yes</option><option value="false">No</option></select> : ["asset", "category", "vendor", "inventory", "amc", "schedule", "tower", "floor", "unit", "select"].includes(type) ? <select name={name} defaultValue={defaultValue ?? ""} required={!isOptional}><option value="">{isOptional ? "None selected" : `Select ${label.toLowerCase()}`}</option>{source.map((option) => <option key={option.id} value={option.id}>{option.label || option.id}</option>)}</select> : <input name={name} type={type} defaultValue={defaultValue} required={!isOptional} step={type === "number" ? "any" : undefined}/>}</label>;
            })}
            {form === "document" && <p className="assets-file-note">PDF, image, or office document · maximum 10 MB.</p>}
        </div><footer className="security-modal-footer"><button type="button" onClick={() => { setForm(""); setEdit(null); }}>Cancel</button><button type="submit" className="society-add-button" disabled={busy}>{busy ? "Saving..." : "Save record"}</button></footer></form></section></div>}
    </section>;
}
