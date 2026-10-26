import { useEffect, useMemo, useState } from "react";
import { BookOpen, SquarePen, Plus, Search, Trash2 } from "lucide-react";
import accountApi from "../api/account.api";
import AccountForm from "../components/AccountForm";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const FinanceAccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const closeForm = () => {
        setShowForm(false);
        setEditingAccount(null);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const societyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
            const response = await accountApi.getAll(societyId);
            setAccounts(rowsFrom(response));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load accounts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!showForm) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event) => {
            if (event.key === "Escape") closeForm();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showForm]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return accounts;
        return accounts.filter((account) => {
            const text = [account.accountCode, account.accountName, account.accountType, account.description].join(" ").toLowerCase();
            return text.includes(query);
        });
    }, [accounts, search]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this account?")) return;
        try {
            await accountApi.remove(id);
            await loadData();
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to delete account.");
        }
    };

    const handleFormSuccess = async () => {
        closeForm();
        await loadData();
    };

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Chart of accounts</h1>
                    <p>Review the account structure and account classifications for the society.</p>
                </div>
                <button className="society-add-button" onClick={() => { setEditingAccount(null); setShowForm(true); }}><Plus size={18} strokeWidth={2.4} /> Add account</button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Accounts</h2><p>All active and configured financial accounts.</p></div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} ${filtered.length === 1 ? "account" : "accounts"}`}</span>
                </div>
                <div className="society-toolbar">
                    <label className="society-search"><Search size={17} /><input aria-label="Search accounts" placeholder="Search by code, name, or type" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌕</kbd></label>
                </div>

                {loading ? <div className="society-loading">Loading accounts…</div> : filtered.length === 0 ? (
                    <div className="society-empty"><span className="society-empty-icon"><BookOpen size={24} /></span><h3>No accounts found</h3><p>There are no account records available for this society yet.</p><button className="society-add-button" onClick={() => { setEditingAccount(null); setShowForm(true); }}><Plus size={17} /> Add first account</button></div>
                ) : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>{filtered.map((account) => (
                        <tr key={account.id}>
                            <td>{account.accountCode || "—"}</td>
                            <td>{account.accountName || "—"}</td>
                            <td>{account.accountType || "—"}</td>
                            <td>{account.isActive === false ? "Inactive" : "Active"}</td>
                            <td><div className="society-row-actions"><button className="society-icon-action" title="Edit account" onClick={() => { setEditingAccount(account); setShowForm(true); }}><SquarePen size={16} /></button><button className="society-icon-action society-delete-action" title="Delete account" onClick={() => handleDelete(account.id)}><Trash2 size={16} /></button></div></td>
                        </tr>
                    ))}</tbody></table></div>
                )}
            </section>

            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><AccountForm key={editingAccount?.id || "new-account"} account={editingAccount} onClose={closeForm} onSuccess={handleFormSuccess} /></div>}
        </section>
    );
};

export default FinanceAccountsPage;



