import { useEffect, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import reconciliationApi from "../api/reconciliation.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const FinanceReconciliationPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await reconciliationApi.getAll();
            setItems(rowsFrom(response));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load reconciliations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const filtered = items.filter((entry) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        const text = [entry.reference, entry.bankName, entry.status, entry.matchedAccount].join(" ").toLowerCase();
        return text.includes(query);
    });

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Reconciliation</h1>
                    <p>Track bank entries, manual matching, and account reconciliation records.</p>
                </div>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Transactions</h2><p>Bank and ledger reconciliation activity.</p></div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} records`}</span>
                </div>
                <div className="society-toolbar">
                    <label className="society-search"><Search size={17} /><input aria-label="Search reconciliation" placeholder="Search reconciliation details" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌕</kbd></label>
                </div>

                {loading ? <div className="society-loading">Loading reconciliations…</div> : filtered.length === 0 ? (
                    <div className="society-empty"><span className="society-empty-icon"><ArrowLeftRight size={24} /></span><h3>No entries</h3><p>No reconciliation records found yet.</p></div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Bank</th>
                                    <th>Status</th>
                                    <th>Matched Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.reference || "—"}</td>
                                        <td>{entry.bankName || "—"}</td>
                                        <td>{entry.status || "PENDING"}</td>
                                        <td>{entry.matchedAccount || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
};

export default FinanceReconciliationPage;
