import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import financialReportApi from "../api/financialReport.api";

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

const normalizeSocietyId = (societyId) => String(societyId ?? "").replace(/^:+/, "").trim();

const FinanceReportsPage = () => {
    const [summary, setSummary] = useState({
        incomeExpense: [],
        balanceSheet: [],
        trialBalance: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const societyId = normalizeSocietyId(localStorage.getItem("selectedSocietyId"));
            const [incomeExpense, balanceSheet, trialBalance] = await Promise.all([
                financialReportApi.getIncomeExpense(societyId),
                financialReportApi.getBalanceSheet(societyId),
                financialReportApi.getTrialBalanceSummary(societyId)
            ]);
            setSummary({
                incomeExpense: rowsFrom(incomeExpense),
                balanceSheet: rowsFrom(balanceSheet),
                trialBalance: rowsFrom(trialBalance)
            });
        } catch (err) {
            setError(err.response?.data?.message || "Could not load financial reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Financial reports</h1>
                    <p>Review the operating performance and balance sheet position.</p>
                </div>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-lifecycle-grid">
                <section className="society-list-panel">
                    <div className="society-list-heading">
                        <div><h2><TrendingUp size={17} /> Income & expense</h2><p>Operating results.</p></div>
                    </div>
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(loading ? [] : summary.incomeExpense.length ? summary.incomeExpense : [{ category: "Income", amount: 0 }, { category: "Expense", amount: 0 }]).map((row, index) => (
                                    <tr key={`${row.category}-${index}`}>
                                        <td>{row.category || "—"}</td>
                                        <td>{formatCurrency(row.amount || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="society-list-panel">
                    <div className="society-list-heading">
                        <div><h2><BarChart3 size={17} /> Balance sheet</h2><p>Assets and liabilities summary.</p></div>
                    </div>
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Section</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(loading ? [] : summary.balanceSheet.length ? summary.balanceSheet : [{ section: "Assets", value: 0 }, { section: "Liabilities", value: 0 }]).map((row, index) => (
                                    <tr key={`${row.section}-${index}`}>
                                        <td>{row.section || "—"}</td>
                                        <td>{formatCurrency(row.value || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </section>
    );
};

export default FinanceReportsPage;
