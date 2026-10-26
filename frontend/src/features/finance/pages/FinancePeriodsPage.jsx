import { useEffect, useState } from "react";
import { CalendarDays, LockKeyhole, Plus } from "lucide-react";
import accountingPeriodApi from "../api/accountingPeriod.api";

const rowsFrom = (response) => {
    if (Array.isArray(response)) return response;
    const rows = response?.data?.data ?? response?.data ?? response?.records;
    return Array.isArray(rows) ? rows : [];
};
const initial = { name: "", startDate: "", endDate: "" };

export default function FinancePeriodsPage() {
    const [periods, setPeriods] = useState([]);
    const [form, setForm] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const societyId = localStorage.getItem("selectedSocietyId");
            setPeriods(rowsFrom(societyId ? await accountingPeriodApi.getBySociety(societyId) : await accountingPeriodApi.getAll()));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load accounting periods.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const runAction = async (action, id, label) => {
        try {
            setBusy(true);
            setError("");
            await action(id);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || `Could not ${label} this period.`);
        } finally {
            setBusy(false);
        }
    };

    const create = async (event) => {
        event.preventDefault();
        const societyId = localStorage.getItem("selectedSocietyId");
        if (!societyId) return setError("Select a society before creating an accounting period.");
        if (form.endDate < form.startDate) return setError("End date must be on or after the start date.");
        try {
            setBusy(true);
            setError("");
            await accountingPeriodApi.create({ ...form, societyId });
            setForm(initial);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Could not create the accounting period.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div><h1>Accounting periods</h1><p>Manage posting windows and lock periods after close.</p></div>
            </header>
            {error && <div className="society-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2><CalendarDays size={17} /> Create period</h2><p>Define the date range used to validate journal postings.</p></div></div>
                <form className="society-toolbar" onSubmit={create}>
                    <input aria-label="Period name" placeholder="Period name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    <input aria-label="Start date" type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                    <input aria-label="End date" type="date" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                    <button className="society-add-button" disabled={busy}><Plus size={16} /> Create period</button>
                </form>
            </section>
            <section className="society-list-panel">
                <div className="society-list-heading"><div><h2>Period register</h2><p>Closed or locked periods should not accept postings.</p></div><span className="society-count">{loading ? "Loading" : `${periods.length} periods`}</span></div>
                {loading ? <div className="society-loading">Loading periods...</div> : <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Name</th><th>Start</th><th>End</th><th>Status</th><th>Controls</th></tr></thead><tbody>
                    {periods.map((period) => {
                        const status = String(period.status || "OPEN").toUpperCase();
                        return <tr key={period.id}><td>{period.name || "Accounting period"}</td><td>{String(period.startDate || "").slice(0, 10) || "-"}</td><td>{String(period.endDate || "").slice(0, 10) || "-"}</td><td>{status}</td><td><div className="society-row-actions">
                            {status === "OPEN" && <button className="society-workflow-action" disabled={busy} onClick={() => runAction(accountingPeriodApi.close, period.id, "close")}>Close period</button>}
                            {status === "CLOSED" && <button className="society-workflow-action" disabled={busy} onClick={() => runAction(accountingPeriodApi.lock, period.id, "lock")}><LockKeyhole size={15} /> Lock period</button>}
                        </div></td></tr>;
                    })}
                    {!periods.length && <tr><td colSpan="5"><div className="society-empty"><h3>No periods configured</h3><p>Create a period before posting journals.</p></div></td></tr>}
                </tbody></table></div>}
            </section>
        </section>
    );
}
