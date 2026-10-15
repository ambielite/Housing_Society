import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Download, FileText, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import reportsApi from "../api/reports.api";

const sections = [["overview", "Overview", BarChart3], ["finance", "Finance", Wallet], ["operations", "Operations", Activity], ["security", "Security", ShieldCheck], ["approvals", "Approvals & SLA", CheckCircle2]];
const defaultReport = { overview: "executive", finance: "finance", operations: "operations", security: "staff", approvals: "approvals" };
const reports = [
    ["executive", "overview", "Executive dashboard", "executive"],
    ["finance", "finance", "Finance dashboard", "finance"], ["bankBalance", "finance", "Bank balance", "bankBalance"], ["collection", "finance", "Collections", "collection"], ["arrears", "finance", "Arrears", "arrears"], ["incomeExpense", "finance", "Income & expense", "incomeExpense"],
    ["operations", "operations", "Operations dashboard", "operations"], ["occupancy", "operations", "Occupancy", "occupancy"], ["residents", "operations", "Residents", "residents"], ["vehicles", "operations", "Vehicles", "vehicles"], ["parking", "operations", "Parking", "parking"],
    ["visitors", "security", "Visitor summary", "visitors"], ["gate", "security", "Gate summary", "gate"], ["staff", "security", "Staff summary", "staff"], ["patrols", "security", "Patrol summary", "patrols"],
    ["approvals", "approvals", "Approvals dashboard", "approvals"], ["approvalDetails", "approvals", "Approval detail", "approvalDetails"], ["approvalStatus", "approvals", "Approval status", "approvalStatus"], ["sla", "approvals", "SLA report", "sla"], ["payments", "approvals", "Payments", "payments"]
].map(([key, group, label, api]) => ({ key, group, label, api }));
const societyIdValue = (value) => String(value || "").replace(/^:+/, "").trim();
const responseRows = (value) => { const result = Array.isArray(value) ? value : value?.data ?? value?.rows ?? value?.records ?? value?.items ?? []; return Array.isArray(result) ? result : []; };
const localDate = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const titleCase = (value) => String(value || "").replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase());
const errorText = (error) => error?.response?.data?.message || error?.message || "Could not load this report.";
const moneyFields = /amount|collection|arrears|balance|movement|income|expense|credit|debit|outstanding/i;
const money = (value, currency) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
const shownValue = (value) => value == null || value === "" ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : typeof value === "object" ? JSON.stringify(value) : String(value);

function inspectReport(source, currency) {
    const metrics = []; const tables = []; const unavailable = []; const definitions = [];
    const walk = (value, path = "") => {
        if (value == null) return;
        if (Array.isArray(value)) {
            if (value.length) tables.push({ title: titleCase(path.split(".").at(-1) || "Report details"), rows: value.map((row) => row && typeof row === "object" ? row : { value: row }) });
            return;
        }
        if (typeof value !== "object") {
            const field = path.split(".").at(-1) || "Value";
            if (["fromDate", "toDate", "generatedAt", "societyId", "currency", "available"].includes(field)) return;
            if (field === "message") { unavailable.push(value); return; }
            if (field === "slaDefinition") { definitions.push(String(value)); return; }
            if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
                metrics.push({ label: titleCase(path.replaceAll(".", " · ")), value: typeof value === "number" && moneyFields.test(field) ? money(value, currency) : shownValue(value) });
            }
            return;
        }
        if (value.available === false) unavailable.push(value.message || "This report is currently unavailable.");
        Object.entries(value).forEach(([key, child]) => {
            if (["period", "society", "records", "details", "accounts"].includes(key)) {
                if (Array.isArray(child)) walk(child, path ? `${path}.${key}` : key);
                else if (key === "society") return;
                else walk(child, path ? `${path}.${key}` : key);
            } else if (key !== "available") walk(child, path ? `${path}.${key}` : key);
        });
    };
    walk(source);
    return { metrics: metrics.filter((item) => item.value !== "—"), tables, unavailable: [...new Set(unavailable)], definitions: [...new Set(definitions)] };
}

function DataTable({ title, rows }) {
    const columns = useMemo(() => {
        const first = rows.find((row) => row && typeof row === "object");
        return first ? Object.keys(first).filter((key) => first[key] == null || typeof first[key] !== "object").slice(0, 8) : [];
    }, [rows]);
    return <section className="society-list-panel reports-panel"><div className="society-list-heading"><div><h2>{title}</h2><p>Detailed records for this report.</p></div><span className="society-count">{rows.length} rows</span></div>{rows.length && columns.length ? <div className="society-table-wrap"><table className="society-table reports-table"><thead><tr>{columns.map((key) => <th key={key}>{titleCase(key)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.uuid || index}>{columns.map((key) => <td key={key}>{shownValue(row[key])}</td>)}</tr>)}</tbody></table></div> : <div className="reports-empty"><FileText size={19}/>No rows are available for this date range.</div>}</section>;
}

export default function ReportsWorkspace() {
    const { section } = useParams(); const navigate = useNavigate();
    const active = sections.some(([key]) => key === section) ? section || "overview" : "overview";
    const [selectedReport, setSelectedReport] = useState(defaultReport[active]);
    const [societies, setSocieties] = useState([]); const [societyId, setSocietyId] = useState(societyIdValue(localStorage.getItem("selectedSocietyId")));
    const today = new Date(); const [fromDate, setFromDate] = useState(localDate(new Date(today.getFullYear(), today.getMonth(), 1))); const [toDate, setToDate] = useState(localDate(today));
    const [reportData, setReportData] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const serialRef = useRef(0);
    const definition = reports.find((item) => item.key === selectedReport) || reports[0];

    useEffect(() => { reportsApi.societies().then((result) => setSocieties(responseRows(result))).catch(() => setSocieties([])); }, []);
    useEffect(() => { setSelectedReport(defaultReport[active]); }, [active]);

    const load = useCallback(async () => {
        const serial = ++serialRef.current;
        if (!societyId) { setLoading(false); setError("Select a society to load its reports."); return; }
        if (fromDate && toDate && fromDate > toDate) { setLoading(false); setError("Start date must be before or equal to end date."); return; }
        setLoading(true); setError(""); setReportData(null);
        try {
            const result = await reportsApi[definition.api]({ societyId, fromDate: fromDate || undefined, toDate: toDate || undefined });
            if (serial === serialRef.current) setReportData(result);
        } catch (error) {
            if (serial === serialRef.current) setError(errorText(error));
        } finally {
            if (serial === serialRef.current) setLoading(false);
        }
    }, [societyId, fromDate, toDate, definition.api]);

    useEffect(() => { load(); }, [load]);
    const currency = reportData?.society?.currency || societies.find((item) => String(item.id ?? item.uuid) === societyId)?.currency || "INR";
    const setSociety = (value) => { setSocietyId(value); localStorage.setItem("selectedSocietyId", value); };

    const exportCsv = () => {
        if (!reportData) return;
        const inspected = inspectReport(reportData, currency); const rows = [...inspected.metrics.map(({ label, value }) => ({ section: "Summary", label, value })), ...inspected.tables.flatMap((table) => table.rows.map((row) => ({ section: table.title, ...row })))];
        if (!rows.length) return;
        const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
        const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => `"${String(row[column] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a");
        link.href = url; link.download = `${selectedReport}-report-${toDate}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const setGroup = (group) => { setSelectedReport(defaultReport[group]); navigate(group === "overview" ? "/reports" : `/reports/${group}`); };
    const inspected = reportData ? inspectReport(reportData, currency) : { metrics: [], tables: [], unavailable: [], definitions: [] };
    const reportChoices = reports.filter((item) => item.group === active);
    const unavailable = inspected.unavailable.length > 0 && inspected.metrics.length === 0;

    return <main className="society-dashboard reports-page">
        <header className="society-heading"><div><div className="society-eyebrow">SOCIETY OPERATIONS <ChevronRight size={12}/> REPORTS</div><h1>Reports & insights</h1><p>Explore financial, operational, security and approval performance for your society.</p></div><button className="society-add-button" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading ? "Refreshing…" : "Refresh report"}</button></header>
        <nav className="reports-tabs" aria-label="Report categories">{sections.map(([key, label, Icon]) => <button type="button" key={key} className={active === key ? "active" : ""} onClick={() => setGroup(key)}><Icon size={16}/>{label}</button>)}</nav>
        {reportChoices.length > 1 && <nav className="reports-subtabs" aria-label={`${active} reports`}>{reportChoices.map((item) => <button key={item.key} type="button" className={selectedReport === item.key ? "active" : ""} onClick={() => setSelectedReport(item.key)}>{item.label}</button>)}</nav>}
        <div className="reports-filters"><label>Society<select value={societyId} onChange={(event) => setSociety(event.target.value)}><option value="">Select society</option>{societies.map((society) => <option key={society.id ?? society.uuid} value={society.id ?? society.uuid}>{society.name || society.societyName || "Society"}</option>)}</select></label><label>From<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)}/></label><label>To<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)}/></label><button type="button" className="reports-export" onClick={exportCsv} disabled={!reportData}><Download size={15}/>Export CSV</button></div>
        {error && <div className="society-error" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
        <section className="reports-report-heading"><div><span>{titleCase(active)} report</span><h2>{definition.label}</h2><p>{societyId ? `Filtered for ${societies.find((item) => String(item.id ?? item.uuid) === societyId)?.name || "selected society"} · ${fromDate || "Any start date"} to ${toDate || "Any end date"}` : "Choose a society and reporting period."}</p></div><span className={`reports-live-state${loading ? " loading" : reportData ? " ready" : ""}`}>{loading ? "Loading" : reportData ? "Updated" : "Awaiting filters"}</span></section>
        {loading && <div className="reports-loading"><RefreshCw size={18}/>Loading {definition.label.toLowerCase()}…</div>}
        {!loading && reportData && <>
            {unavailable && <div className="reports-unavailable"><CircleAlert size={18}/><div><strong>This report is unavailable</strong>{inspected.unavailable.map((message, index) => <p key={index}>{message}</p>)}</div></div>}
            {inspected.definitions.map((definitionText) => <div className="reports-definition" key={definitionText}><strong>SLA definition</strong><p>{definitionText}</p></div>)}
            {!!inspected.metrics.length && <div className="society-stats reports-stats">{inspected.metrics.map((item, index) => <Metric key={`${item.label}-${index}`} label={item.label} value={item.value} icon={index % 3 === 0 ? Activity : index % 3 === 1 ? BarChart3 : CalendarDays} tone={index % 3 === 1 ? "green" : index % 3 === 2 ? "violet" : "blue"}/>)}</div>}
            {!unavailable && !inspected.metrics.length && !inspected.tables.length && <div className="reports-empty reports-empty-card"><FileText size={20}/>The backend returned no report data for this selection.</div>}
            {inspected.tables.map((table, index) => <DataTable key={`${table.title}-${index}`} title={table.title} rows={table.rows}/>)}
        </>}
    </main>;
}

function Metric({ label, value, icon: Icon, tone = "blue" }) {
    return <article className="society-stat-card reports-metric"><span className={`society-stat-icon society-stat-icon-${tone}`}><Icon size={18}/></span><div><span className="society-stat-label">{label}</span><strong>{shownValue(value)}</strong></div></article>;
}
