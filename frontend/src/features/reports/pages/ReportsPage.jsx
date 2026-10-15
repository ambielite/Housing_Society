import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Download, FileText, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import reportsApi from "../api/reports.api";

const sections = [
    ["overview", "Overview", BarChart3], ["finance", "Finance", Wallet],
    ["operations", "Operations", Activity], ["security", "Security", ShieldCheck],
    ["approvals", "Approvals & SLA", CheckCircle2]
];
const normalizeSocietyId = (value) => String(value || "").replace(/^:+/, "").trim();
const responseRows = (value) => {
    const candidate = Array.isArray(value) ? value : value?.data ?? value?.rows ?? value?.records ?? value?.items ?? [];
    return Array.isArray(candidate) ? candidate : [];
};
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateError = (error) => error?.response?.data?.message || error?.message || "Could not load this report.";
const currency = (value, code = "INR") => value == null ? "Unavailable" : new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(Number(value) || 0);
const display = (value) => value == null || value === "" ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : typeof value === "object" ? JSON.stringify(value) : String(value);
const titleCase = (text) => String(text || "").replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase());

function Metric({ label, value, note, icon: Icon, tone = "blue" }) {
    return <article className="society-stat-card reports-metric"><span className={`society-stat-icon society-stat-icon-${tone}`}><Icon size={18}/></span><div><span className="society-stat-label">{label}</span><strong>{display(value)}</strong>{note && <small className="society-stat-note">{note}</small>}</div></article>;
}

function DataTable({ title, rows, empty = "No records for this period." }) {
    const columns = useMemo(() => {
        const first = rows.find((row) => row && typeof row === "object");
        return first ? Object.keys(first).filter((key) => typeof first[key] !== "object" || first[key] == null).slice(0, 7) : [];
    }, [rows]);
    return <section className="society-list-panel reports-panel"><div className="society-list-heading"><div><h2>{title}</h2><p>Report details returned by the selected backend report.</p></div><span className="society-count">{rows.length} rows</span></div>{rows.length && columns.length ? <div className="society-table-wrap"><table className="society-table reports-table"><thead><tr>{columns.map((key) => <th key={key}>{titleCase(key)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.uuid || index}>{columns.map((key) => <td key={key}>{display(row[key])}</td>)}</tr>)}</tbody></table></div> : <div className="reports-empty"><FileText size={20}/><span>{empty}</span></div>}</section>;
}

export default function ReportsPage() {
    const { section } = useParams();
    const navigate = useNavigate();
    const active = sections.some(([key]) => key === section) ? section || "overview" : "overview";
    const [societies, setSocieties] = useState([]);
    const [societyId, setSocietyId] = useState(normalizeSocietyId(localStorage.getItem("selectedSocietyId")));
    const now = new Date();
    const [fromDate, setFromDate] = useState(localDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [toDate, setToDate] = useState(localDate(now));
    const [data, setData] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const requestSerial = useRef(0);

    useEffect(() => {
        reportsApi.societies().then((result) => setSocieties(responseRows(result))).catch(() => setSocieties([]));
    }, []);

    const load = useCallback(async () => {
        const serial = ++requestSerial.current;
        if (!societyId) { setLoading(false); setErrors({ main: "Select a society to load its reports." }); return; }
        if (fromDate && toDate && fromDate > toDate) { setLoading(false); setErrors({ main: "Start date must be before or equal to end date." }); return; }
        setLoading(true); setErrors({});
        const params = { societyId, fromDate: fromDate || undefined, toDate: toDate || undefined };
        const requests = active === "overview" ? [
            ["executive", () => reportsApi.executive(params)], ["finance", () => reportsApi.finance(params)],
            ["operations", () => reportsApi.operations(params)], ["approvals", () => reportsApi.approvals(params)]
        ] : active === "finance" ? [["finance", () => reportsApi.finance(params)]]
            : active === "operations" ? [["operations", () => reportsApi.operations(params)]]
                : active === "security" ? [["visitors", () => reportsApi.visitors(params)], ["gate", () => reportsApi.gate(params)], ["staff", () => reportsApi.staff(params)], ["patrols", () => reportsApi.patrols(params)]]
                    : [["approvals", () => reportsApi.approvals(params)]];
        const results = await Promise.allSettled(requests.map(([, request]) => request()));
        if (serial !== requestSerial.current) return;
        const next = {}; const nextErrors = {};
        results.forEach((result, index) => {
            const [key] = requests[index];
            if (result.status === "fulfilled") next[key] = result.value;
            else nextErrors[key] = dateError(result.reason);
        });
        setData((current) => ({ ...current, ...next })); setErrors(nextErrors); setLoading(false);
    }, [active, societyId, fromDate, toDate]);

    useEffect(() => { load(); }, [load]);
    const selectedSociety = societies.find((society) => String(society.id ?? society.uuid) === societyId);
    const currencyCode = data.executive?.society?.currency || selectedSociety?.currency || "INR";
    const setSociety = (value) => { setSocietyId(value); localStorage.setItem("selectedSocietyId", value); };

    const exportReport = () => {
        const report = active === "overview"
            ? { executive: data.executive, finance: data.finance, operations: data.operations, approvals: data.approvals }
            : active === "security"
                ? { visitors: data.visitors, gate: data.gate, staff: data.staff, patrols: data.patrols }
                : data[active] || {};
        const rows = [];
        const flatten = (object, prefix = "") => Object.entries(object || {}).forEach(([key, value]) => {
            const label = prefix ? `${prefix}.${key}` : key;
            if (Array.isArray(value)) value.forEach((row, index) => rows.push({ section: label, row: index + 1, ...row }));
            else if (value && typeof value === "object") flatten(value, label);
            else rows.push({ section: label, value: value ?? "" });
        });
        flatten(report);
        if (!rows.length) return;
        const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
        const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a"); link.href = url; link.download = `society-${active}-report-${toDate}.csv`; link.click(); URL.revokeObjectURL(url);
    };

    const finance = data.finance || {};
    const operations = data.operations || {};
    const approvals = data.approvals || {};
    const approvalDetails = approvals.sla?.details || [];
    const patrolRows = data.patrols?.records || [];
    const attendanceRows = data.staff?.records || [];
    const reportError = Object.entries(errors).map(([key, message]) => `${titleCase(key)}: ${message}`).join(" · ");

    return <main className="society-dashboard reports-page">
        <header className="society-heading"><div><div className="society-eyebrow">SOCIETY OPERATIONS <ChevronRight size={12}/> REPORTS</div><h1>Reports & insights</h1><p>Explore financial, operational, security and approval performance for your society.</p></div><button className="society-add-button" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading ? "Refreshing…" : "Refresh reports"}</button></header>
        <nav className="reports-tabs" aria-label="Report categories">{sections.map(([key, label, Icon]) => <button type="button" key={key} className={active === key ? "active" : ""} onClick={() => navigate(key === "overview" ? "/reports" : `/reports/${key}`)}><Icon size={16}/>{label}</button>)}</nav>
        <div className="reports-filters"><label>Society<select value={societyId} onChange={(event) => setSociety(event.target.value)}><option value="">Select society</option>{societies.map((society) => <option key={society.id ?? society.uuid} value={society.id ?? society.uuid}>{society.name || society.societyName || "Society"}</option>)}</select></label><label>From<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)}/></label><label>To<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)}/></label><button type="button" className="reports-export" onClick={exportReport} disabled={active === "security" ? !(data.staff || data.patrols) : !data[active === "overview" ? "executive" : active]}><Download size={15}/>Export CSV</button></div>
        {errors.main && <div className="society-error" role="alert">{errors.main}</div>}
        {reportError && <div className="reports-partial-error" role="status"><CircleAlert size={16}/><span>Some reports could not load: {reportError}</span><button type="button" onClick={load}>Retry</button></div>}

        {active === "overview" && <>
            <div className="society-stats reports-stats">
                <Metric label="Occupancy" value={operations.occupancy ? `${operations.occupancy.occupancyPercentage ?? 0}%` : "—"} note={`${operations.occupancy?.occupiedUnits ?? "—"} occupied units`} icon={Activity}/>
                <Metric label="Collections" value={currency(finance.collection?.totalCollection, currencyCode)} note={`${finance.collection?.paymentCount ?? "—"} payments`} icon={Wallet} tone="green"/>
                <Metric label="Outstanding arrears" value={currency(finance.arrears?.totalArrears, currencyCode)} note={`${finance.arrears?.accountCount ?? "—"} accounts`} icon={BarChart3} tone="violet"/>
                <Metric label="Pending approvals" value={approvals.approvals?.status?.pending ?? "—"} note="In selected period" icon={CheckCircle2}/>
            </div>
            <div className="reports-grid">
                <SummaryPanel title="Financial snapshot" note="Finance reports for the selected dates" items={[["Income", currency(finance.incomeExpense?.totalIncome, currencyCode)], ["Expenses", currency(finance.incomeExpense?.totalExpense, currencyCode)], ["Net movement", currency(finance.incomeExpense?.netMovement, currencyCode)], ["Bank movement", currency(finance.bankBalance?.bankMovement, currencyCode)]]}/>
                <SummaryPanel title="Operations snapshot" note="Occupancy and service availability" items={[["Total units", operations.occupancy?.totalUnits ?? "—"], ["Vacant units", operations.occupancy?.vacantUnits ?? "—"], ["Total assets", data.executive?.assets?.totalAssets ?? "—"], ["Upcoming meetings", data.executive?.community?.upcomingMeetings ?? "—"]]}/>
                <SummaryPanel title="Approval health" note="Workflow volume and handling time" items={[["Total approvals", approvals.approvals?.totalApprovals ?? "—"], ["Approved", approvals.approvals?.status?.approved ?? "—"], ["Average completion", approvals.sla?.averageCompletedProcessingHours == null ? "—" : `${approvals.sla.averageCompletedProcessingHours} hrs`], ["Payment records", approvals.payments?.totalPayments ?? "—"]]}/>
                <SummaryPanel title="System notifications" note="Executive dashboard activity" items={[["Pending", data.executive?.system?.pendingNotifications ?? "—"], ["Failed", data.executive?.system?.failedNotifications ?? "—"], ["Generated", data.executive?.generatedAt ? new Date(data.executive.generatedAt).toLocaleString() : "—"]]}/>
            </div>
        </>}

        {active === "finance" && <>
            <div className="society-stats reports-stats"><Metric label="Total collections" value={currency(finance.collection?.totalCollection, currencyCode)} note={`${finance.collection?.paymentCount ?? 0} successful / verified`} icon={Wallet}/><Metric label="Arrears" value={currency(finance.arrears?.totalArrears, currencyCode)} note={`${finance.arrears?.accountCount ?? 0} resident ledgers`} icon={CircleAlert} tone="violet"/><Metric label="Income" value={currency(finance.incomeExpense?.totalIncome, currencyCode)} note="Posted journal credits" icon={BarChart3} tone="green"/><Metric label="Expense" value={currency(finance.incomeExpense?.totalExpense, currencyCode)} note="Posted journal debits" icon={CalendarDays}/></div>
            <div className="reports-grid"><SummaryPanel title="Bank reconciliation" note={`${finance.bankBalance?.transactionCount ?? 0} reconciled transactions`} items={[["Credits", currency(finance.bankBalance?.totalCredit, currencyCode)], ["Debits", currency(finance.bankBalance?.totalDebit, currencyCode)], ["Net movement", currency(finance.bankBalance?.bankMovement, currencyCode)]]}/><SummaryPanel title="Income & expense" note={finance.incomeExpense?.classification === "POSTED_JOURNAL_CREDIT_DEBIT" ? "Based on posted journal debit and credit totals" : "Selected period"} items={[["Income", currency(finance.incomeExpense?.totalIncome, currencyCode)], ["Expense", currency(finance.incomeExpense?.totalExpense, currencyCode)], ["Net", currency(finance.incomeExpense?.netMovement, currencyCode)], ["Journals", finance.incomeExpense?.journalCount ?? 0]]}/></div>
            <DataTable title="Payment method collection" rows={Object.entries(finance.collection?.byPaymentMethod || {}).map(([paymentMethod, amount]) => ({ paymentMethod: titleCase(paymentMethod), amount: currency(amount, currencyCode) }))}/><DataTable title="Outstanding resident ledgers" rows={(finance.arrears?.accounts || []).map((item) => ({ ...item, outstanding: currency(item.outstanding, currencyCode) }))}/>
        </>}

        {active === "operations" && <>
            <div className="society-stats reports-stats"><Metric label="Total units" value={operations.occupancy?.totalUnits ?? "—"} note="Registered properties" icon={Activity}/><Metric label="Occupied" value={operations.occupancy?.occupiedUnits ?? "—"} note={`${operations.occupancy?.occupancyPercentage ?? 0}% occupancy`} icon={CheckCircle2} tone="green"/><Metric label="Vacant" value={operations.occupancy?.vacantUnits ?? "—"} note={`${operations.occupancy?.vacancyPercentage ?? 0}% vacancy`} icon={CircleAlert} tone="violet"/><Metric label="Move in / out" value={`${operations.occupancy?.underMoveInUnits ?? 0} / ${operations.occupancy?.underMoveOutUnits ?? 0}`} note="Active transitions" icon={CalendarDays}/></div>
            <DataTable title="Occupancy by property type" rows={Object.entries(operations.occupancy?.byPropertyType || {}).map(([propertyType, totals]) => ({ propertyType: titleCase(propertyType), ...totals }))}/>
            <div className="reports-grid"><UnavailablePanel report={operations.residents}/><UnavailablePanel report={operations.vehicles}/><UnavailablePanel report={operations.parking}/></div>
        </>}

        {active === "security" && <>
            <div className="society-stats reports-stats"><Metric label="Staff" value={data.staff?.staff?.total ?? "—"} note={`${data.staff?.staff?.active ?? 0} active`} icon={ShieldCheck}/><Metric label="On leave" value={data.staff?.staff?.onLeave ?? "—"} note={`${data.staff?.staff?.inactive ?? 0} inactive`} icon={CalendarDays} tone="violet"/><Metric label="Patrols" value={data.patrols?.patrols?.total ?? "—"} note={`${data.patrols?.patrols?.completed ?? 0} completed`} icon={Activity} tone="green"/><Metric label="Missed checkpoints" value={data.patrols?.checkpoints?.missed ?? "—"} note={`${data.patrols?.checkpoints?.total ?? 0} checkpoints`} icon={CircleAlert}/></div>
            <div className="reports-grid"><SummaryPanel title="Patrol status" note="Patrol runs in the selected period" items={Object.entries(data.patrols?.patrols || {}).map(([key, value]) => [titleCase(key), value])}/><SummaryPanel title="Checkpoint coverage" note="Checkpoint completion summary" items={[["Total", data.patrols?.checkpoints?.total ?? "—"], ["Completed", data.patrols?.checkpoints?.completed ?? "—"], ["Missed", data.patrols?.checkpoints?.missed ?? "—"]]}/><SummaryPanel title="Staff attendance" note="Attendance record counts" items={Object.entries(data.staff?.attendance?.statusSummary || {}).map(([key, value]) => [titleCase(key), value])}/></div>
            <DataTable title="Patrol activity" rows={patrolRows}/><DataTable title="Staff attendance records" rows={attendanceRows}/>
            <UnavailablePanel report={data.visitors} title="Visitor summary"/><UnavailablePanel report={data.gate} title="Gate summary"/>
        </>}

        {active === "approvals" && <>
            <div className="society-stats reports-stats"><Metric label="Total approvals" value={approvals.approvals?.totalApprovals ?? "—"} note="Created in the selected period" icon={CheckCircle2}/><Metric label="Pending" value={approvals.approvals?.status?.pending ?? "—"} note={`${approvals.approvals?.status?.approved ?? 0} approved`} icon={Activity} tone="violet"/><Metric label="Avg. completed time" value={approvals.sla?.averageCompletedProcessingHours == null ? "—" : `${approvals.sla.averageCompletedProcessingHours} hrs`} note="From created to action" icon={CalendarDays} tone="green"/><Metric label="Pending age" value={approvals.sla?.averagePendingAgeHours == null ? "—" : `${approvals.sla.averagePendingAgeHours} hrs`} note="Average current age" icon={CircleAlert}/></div>
            <div className="reports-grid"><SummaryPanel title="Approval types" note="Volume by lifecycle activity" items={Object.entries(approvals.approvals?.approvalType || {}).map(([key, value]) => [titleCase(key), value])}/><SummaryPanel title="Payment status" note={`${currency(approvals.payments?.totalCollection, currencyCode)} collected`} items={Object.entries(approvals.payments?.status || {}).map(([key, value]) => [titleCase(key), value])}/><SummaryPanel title="Payments by method" note="Successful and verified transactions" items={(approvals.payments?.paymentMethodBreakdown || []).map((item) => [titleCase(item.paymentMethod), `${item.count} · ${currency(item.amount, currencyCode)}`])}/></div>
            <DataTable title="Approval processing detail" rows={approvalDetails}/><DataTable title="Approval status breakdown" rows={(approvals.approvalStatus || []).map((item) => ({ ...item, status: titleCase(item.status) }))}/>
        </>}
    </main>;
}

function SummaryPanel({ title, note, items }) {
    return <section className="society-list-panel reports-summary"><div className="society-list-heading"><div><h2>{title}</h2><p>{note}</p></div></div><div className="reports-summary-list">{items.filter(([, value]) => value !== undefined).map(([label, value]) => <div key={label}><span>{label}</span><strong>{display(value)}</strong></div>)}{!items.length && <span className="reports-muted">No summary data returned.</span>}</div></section>;
}

function UnavailablePanel({ report, title = "Additional report" }) {
    return report?.available === false || report?.message ? <section className="society-list-panel reports-unavailable-panel"><div className="society-list-heading"><div><h2>{title}</h2><p>{report.message || "This report is currently unavailable."}</p></div><CircleAlert size={18}/></div></section> : null;
}
