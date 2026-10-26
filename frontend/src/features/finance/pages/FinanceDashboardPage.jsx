import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BookOpen, ReceiptText, Wallet } from "lucide-react";
import accountApi from "../api/account.api";
import journalApi from "../api/journal.api";
import paymentApi from "../api/payment.api";
import accountingPeriodApi from "../api/accountingPeriod.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(numeric);
};

const statusBadge = (value, fallback = "UNKNOWN") => {
    const status = String(value || fallback).toUpperCase();
    const tone = /VERIFIED|PAID|OPEN|ACTIVE|APPROVED|COMPLETED/.test(status)
        ? "success"
        : /PENDING|ISSUED|PROCESSING|REVIEW/.test(status)
            ? "pending"
            : /FAILED|REJECTED|CANCELLED|OVERDUE/.test(status)
                ? "danger"
                : "neutral";
    return <span className={`moveinout-status moveinout-status-${tone}`}>{status.replaceAll("_", " ")}</span>;
};

const FinanceDashboardPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [journals, setJournals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [accountResponse, journalResponse, paymentResponse, periodResponse] = await Promise.all([
                accountApi.getAll(),
                journalApi.getAll(),
                paymentApi.getAll(),
                accountingPeriodApi.getAll()
            ]);

            setAccounts(rowsFrom(accountResponse));
            setJournals(rowsFrom(journalResponse));
            setPayments(rowsFrom(paymentResponse));
            setPeriods(rowsFrom(periodResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load finance dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activePeriods = periods.filter((period) => period.status === "OPEN");
    const totalJournalDebit = journals.reduce((total, item) => total + Number(item.totalDebit || 0), 0);
    const totalJournalCredit = journals.reduce((total, item) => total + Number(item.totalCredit || 0), 0);
    const totalCollected = payments.reduce((total, item) => total + Number(item.amount || 0), 0);

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Finance dashboard</h1>
                    <p>Track accounts, periods, journal entries, and payment activity.</p>
                </div>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><BookOpen size={19} /></span>
                    <div><span className="society-stat-label">Accounts</span><strong>{loading ? "—" : accounts.length}</strong></div>
                    <span className="society-stat-note">Chart of accounts</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><ArrowDownLeft size={19} /></span>
                    <div><span className="society-stat-label">Open periods</span><strong>{loading ? "—" : activePeriods.length}</strong></div>
                    <span className="society-stat-note">Currently active</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><ArrowUpRight size={19} /></span>
                    <div><span className="society-stat-label">Journal value</span><strong>{loading ? "—" : formatCurrency(totalJournalDebit)}</strong></div>
                    <span className="society-stat-note">Total debit entries</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-orange"><Wallet size={19} /></span>
                    <div><span className="society-stat-label">Collections</span><strong>{loading ? "—" : formatCurrency(totalCollected)}</strong></div>
                    <span className="society-stat-note">Payments received</span>
                </article>
            </div>

            <div className="society-lifecycle-grid">
                <section className="society-list-panel">
                    <div className="society-list-heading">
                        <div><h2>Accounting summary</h2><p>Current posting and period status.</p></div>
                    </div>
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Posted journals</td>
                                    <td>{loading ? "—" : journals.length}</td>
                                </tr>
                                <tr>
                                    <td>Total debit</td>
                                    <td>{loading ? "—" : formatCurrency(totalJournalDebit)}</td>
                                </tr>
                                <tr>
                                    <td>Total credit</td>
                                    <td>{loading ? "—" : formatCurrency(totalJournalCredit)}</td>
                                </tr>
                                <tr>
                                    <td>Payment records</td>
                                    <td>{loading ? "—" : payments.length}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="society-list-panel">
                    <div className="society-list-heading">
                        <div><h2>Open periods</h2><p>Accounting windows available for posting.</p></div>
                    </div>
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(loading ? [] : activePeriods.length ? activePeriods : periods.slice(0, 3)).map((period) => (
                                    <tr key={period.id}>
                                        <td>{period.name || "Accounting period"}</td>
                                        <td>{statusBadge(period.status, "OPEN")}</td>
                                        <td>{period.startDate ? String(period.startDate).slice(0, 10) : "—"} to {period.endDate ? String(period.endDate).slice(0, 10) : "—"}</td>
                                    </tr>
                                ))}
                                {!loading && !periods.length && <tr><td colSpan="3"><div className="society-empty"><h3>No accounting periods available</h3></div></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <section className="society-list-panel society-lifecycle-panel">
                <div className="society-list-heading">
                    <div><h2>Latest payment activity</h2><p>Recent payment records for the society.</p></div>
                </div>
                <div className="society-table-wrap">
                    <table className="society-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(loading ? [] : payments.slice(0, 6)).map((payment) => (
                                <tr key={payment.id}>
                                    <td>{payment.paymentReference || "—"}</td>
                                    <td>{payment.paymentMethod || "—"}</td>
                                    <td>{formatCurrency(payment.amount)}</td>
                                    <td>{statusBadge(payment.status, "PENDING")}</td>
                                </tr>
                            ))}
                            {!loading && !payments.length && <tr><td colSpan="4"><div className="society-empty"><h3>No payment records</h3></div></td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );
};

export default FinanceDashboardPage;
