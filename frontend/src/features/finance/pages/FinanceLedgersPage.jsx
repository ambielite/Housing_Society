import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import generalLedgerApi from "../api/generalLedger.api";
import ledgerAccountApi from "../api/ledgerAccount.api";

const rowsFrom = (response) => Array.isArray(response) ? response : response?.data || response?.records || [];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const societyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();

export default function FinanceLedgersPage() {
    const [entries, setEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const loadData = async () => {
        try {
            setLoading(true); setError("");
            const id = societyId();
            if (!id) { setEntries([]); setAccounts([]); setError("Select a society to view its ledgers."); return; }
            const [ledgerResponse, accountResponse] = await Promise.all([generalLedgerApi.getBySociety(id), ledgerAccountApi.getAll(id)]);
            const ledgerData = ledgerResponse?.data ?? ledgerResponse;
            setEntries(rowsFrom(ledgerData?.entries ?? ledgerData));
            setAccounts(rowsFrom(accountResponse));
        } catch (err) { setError(err.response?.data?.message || "Could not load ledger data."); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadData(); }, []);
    const query = search.trim().toLowerCase();
    const filteredEntries = useMemo(() => entries.filter((entry) => !query || [entry.account?.name, entry.account?.code, entry.journalNumber, entry.referenceType, entry.referenceId, entry.journalDescription, entry.description].join(" ").toLowerCase().includes(query)), [entries, query]);
    const filteredAccounts = useMemo(() => accounts.filter((item) => !query || [item.ledgerCode, item.ledgerName, item.unitId, item.memberId, item.accountId].join(" ").toLowerCase().includes(query)), [accounts, query]);
    return <section className="society-dashboard">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div><h1>Ledgers</h1><p>Resident and unit ledger accounts alongside posted general ledger activity.</p></div></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}
        <section className="society-list-panel"><div className="society-list-heading"><div><h2>Member and unit ledger accounts</h2><p>Ledger accounts linked to residents, units, and chart accounts.</p></div><span className="society-count">{loading ? "Loading" : `${filteredAccounts.length} accounts`}</span></div><div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search ledgers" placeholder="Search ledger, unit, member, or account" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {loading ? <div className="society-loading">Loading ledger accounts...</div> : filteredAccounts.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Ledger code</th><th>Ledger name</th><th>Unit</th><th>Member</th><th>Account ID</th><th>Opening balance</th><th>Current balance</th><th>Balance type</th><th>Status</th></tr></thead><tbody>{filteredAccounts.map((item) => <tr key={item.id}><td>{item.ledgerCode}</td><td>{item.ledgerName}</td><td>{item.unitId || "-"}</td><td>{item.memberId || "-"}</td><td>{item.accountId}</td><td>{money(item.openingBalance)}</td><td>{money(item.currentBalance)}</td><td>{item.balanceType}</td><td>{item.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div> : <div className="society-empty"><FileSpreadsheet size={24} /><h3>No member or unit ledger accounts</h3><p>Ledger accounts configured in the backend will appear here.</p></div>}</section>
        <section className="society-list-panel"><div className="society-list-heading"><div><h2>Posted general ledger entries</h2><p>Journal line data returned by the general ledger service.</p></div><span className="society-count">{loading ? "Loading" : `${filteredEntries.length} entries`}</span></div>
        {loading ? <div className="society-loading">Loading posted entries...</div> : filteredEntries.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Date</th><th>Journal</th><th>Account</th><th>Line description</th><th>Debit</th><th>Credit</th><th>Reference</th></tr></thead><tbody>{filteredEntries.map((entry) => <tr key={entry.journalLineId}><td>{entry.transactionDate || "-"}</td><td>{entry.journalNumber || "-"}</td><td>{entry.account ? `${entry.account.code} - ${entry.account.name}` : "-"}</td><td>{entry.description || entry.journalDescription || "-"}</td><td>{money(entry.debit)}</td><td>{money(entry.credit)}</td><td>{[entry.referenceType, entry.referenceId].filter(Boolean).join(" / ") || "-"}</td></tr>)}</tbody></table></div> : <div className="society-empty"><h3>No posted ledger entries</h3><p>Only posted journals appear in general ledger activity.</p></div>}</section>
    </section>;
}
