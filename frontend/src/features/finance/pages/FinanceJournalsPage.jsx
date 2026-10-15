import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import journalApi from "../api/journal.api";
import JournalForm from "../components/JournalForm";

const rowsFrom = (response) => Array.isArray(response) ? response : response?.data || response?.records || [];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));

export default function FinanceJournalsPage() {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const societyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
            setJournals(rowsFrom(await journalApi.getAll(societyId)));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load journals.");
        } finally { setLoading(false); }
    };
    useEffect(() => { loadData(); }, []);
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return !query ? journals : journals.filter((row) => [row.journalNumber, row.referenceType, row.referenceId, row.status, row.description].join(" ").toLowerCase().includes(query));
    }, [journals, search]);
    const removeDraft = async (id) => {
        if (!window.confirm("Delete this draft journal?")) return;
        try { await journalApi.removeDraft(id); await loadData(); }
        catch (err) { window.alert(err.response?.data?.message || "Only draft journals can be deleted."); }
    };

    return <section className="society-dashboard">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div><h1>Journal entries</h1><p>Review balanced journal transactions for the selected society.</p></div><button className="society-add-button" onClick={() => setShowForm(true)}><Plus size={18} /> Add journal</button></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}
        <section className="society-list-panel"><div className="society-list-heading"><div><h2>Journal register</h2><p>Totals and references from each journal header.</p></div><span className="society-count">{loading ? "Loading" : `${filtered.length} journals`}</span></div>
            <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search journals" placeholder="Search number, description, reference, or status" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
            {loading ? <div className="society-loading">Loading journals...</div> : filtered.length === 0 ? <div className="society-empty"><FileText size={24} /><h3>No journals found</h3><p>Create a journal with balanced debit and credit lines.</p><button className="society-add-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add journal</button></div> : <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Journal no.</th><th>Transaction date</th><th>Description</th><th>Reference</th><th>Debit total</th><th>Credit total</th><th>Lines</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((journal) => <tr key={journal.id}><td>{journal.journalNumber || "-"}</td><td>{journal.transactionDate ? String(journal.transactionDate).slice(0, 10) : "-"}</td><td>{journal.description || "-"}</td><td>{[journal.referenceType, journal.referenceId].filter(Boolean).join(" / ") || "-"}</td><td>{money(journal.totalDebit)}</td><td>{money(journal.totalCredit)}</td><td>{journal.lines?.length ?? 0}</td><td>{journal.status || "DRAFT"}</td><td>{journal.status === "DRAFT" && <button className="society-icon-action society-delete-action" title="Delete draft journal" onClick={() => removeDraft(journal.id)}><Trash2 size={16} /></button>}</td></tr>)}</tbody></table></div>}
        </section>
        {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><JournalForm onClose={() => setShowForm(false)} onSuccess={async () => { setShowForm(false); await loadData(); }} /></div>}
    </section>;
}


