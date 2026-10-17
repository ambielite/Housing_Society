import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import paymentApi from "../api/payment.api";
import PaymentForm from "../components/PaymentForm";

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

const FinancePaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [actionError, setActionError] = useState("");

    const closeForm = () => {
        setShowForm(false);
        setEditingPayment(null);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const societyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
            const response = await paymentApi.getAll(societyId);
            setPayments(rowsFrom(response));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load payments.");
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
        if (!query) return payments;
        return payments.filter((payment) => {
            const text = [payment.paymentReference, payment.paymentMethod, payment.status, payment.receiptNumber].join(" ").toLowerCase();
            return text.includes(query);
        });
    }, [payments, search]);

    const handleVerify = async (id) => {
        try {
            setActionError("");
            await paymentApi.verify(id, { verificationRemarks: "Verified in finance module" });
            await loadData();
        } catch (err) {
            const message = err.response?.data?.message || "Failed to verify payment.";
            setActionError(message.includes("No OPEN accounting period found for payment date")
                ? "This payment cannot be verified because no OPEN accounting period covers its payment date. Create an OPEN period for this society that includes the payment date, then retry verification."
                : message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this payment?")) return;
        try {
            await paymentApi.cancel(id);
            await loadData();
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to cancel payment.");
        }
    };

    const handleFormSuccess = async () => {
        closeForm();
        await loadData();
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Payments</h1>
                    <p>Review payment references, methods, and settlement status.</p>
                </div>
                <button className="society-add-button" onClick={() => { setEditingPayment(null); setShowForm(true); }}><Plus size={18} strokeWidth={2.4} /> Add payment</button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}
            {actionError && <div className="society-error" role="alert">
                {actionError}
                {actionError.includes("accounting period covers its payment date") && <a href="/finance/periods" style={{ marginLeft: 8 }}>Open Accounting periods</a>}
            </div>}

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Payment ledger</h2><p>Recorded online and offline payment transactions.</p></div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} ${filtered.length === 1 ? "payment" : "payments"}`}</span>
                </div>
                <div className="society-toolbar">
                    <label className="society-search"><Search size={17} /><input aria-label="Search payments" placeholder="Search by reference, method, or status" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌕</kbd></label>
                </div>

                {loading ? <div className="society-loading">Loading payments…</div> : filtered.length === 0 ? (
                    <div className="society-empty"><span className="society-empty-icon"><ReceiptText size={24} /></span><h3>No payments found</h3><p>There are no payment records available yet.</p><button className="society-add-button" onClick={() => { setEditingPayment(null); setShowForm(true); }}><Plus size={17} /> Add first payment</button></div>
                ) : (
                    <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Reference</th><th>Method</th><th>Date</th><th>Amount</th><th>Status</th><th className="society-actions-heading">Actions</th></tr></thead><tbody>{filtered.map((payment) => (
                        <tr key={payment.id}>
                            <td>{payment.paymentReference || "—"}</td>
                            <td>{payment.paymentMethod || "—"}</td>
                            <td>{payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "—"}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.status || "PENDING"}</td>
                            <td><div className="society-row-actions">{payment.status === "VERIFICATION_PENDING" && <button className="society-icon-action" title="Verify offline payment" onClick={() => handleVerify(payment.id)}><CheckCircle2 size={16} /></button>}{!payment.journalId && !["SUCCESS", "VERIFIED", "CANCELLED"].includes(payment.status) && <button className="society-icon-action society-delete-action" title="Cancel payment" onClick={() => handleDelete(payment.id)}><Trash2 size={16} /></button>}</div></td>
                        </tr>
                    ))}</tbody></table></div>
                )}
            </section>

            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><PaymentForm key={editingPayment?.id || "new-payment"} payment={editingPayment} onClose={closeForm} onSuccess={handleFormSuccess} /></div>}
        </section>
    );
};

export default FinancePaymentsPage;


