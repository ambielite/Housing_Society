import { useEffect, useState } from "react";
import { X } from "lucide-react";

import paymentApi from "../api/payment.api";
import invoiceApi from "../api/invoice.api";

const createInitialForm = (payment) => ({
    societyId: payment?.societyId || String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim(),
    invoiceId: payment?.invoiceId || "",
    unitId: payment?.unitId || "",
    memberId: payment?.memberId || "",
    ledgerAccountId: payment?.ledgerAccountId || "",
    paymentReference: payment?.paymentReference || "",
    paymentMethod: payment?.paymentMethod || "CASH",
    amount: payment?.amount || "",
    paymentDate: payment?.paymentDate ? String(payment.paymentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    idempotencyKey: payment?.idempotencyKey || `payment-${Date.now()}`,
    remarks: payment?.remarks || ""
});

const PaymentForm = ({ payment, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(() => createInitialForm(payment));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        const societyId = formData.societyId;
        if (!societyId) return;
        invoiceApi.getAll().then((response) => {
            const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
            setInvoices(rows.filter((invoice) => invoice.societyId === societyId && !["PAID", "CANCELLED"].includes(invoice.status)));
        }).catch((err) => setError(err.response?.data?.message || "Could not load invoices."));
    }, [formData.societyId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!formData.societyId.trim()) {
            setError("Society ID is required.");
            return;
        }

        if (!formData.amount || Number(formData.amount) <= 0) {
            setError("Valid payment amount is required.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                unitId: formData.unitId || null,
                invoiceId: formData.invoiceId || null,
                memberId: formData.memberId || null,
                ledgerAccountId: formData.ledgerAccountId || null,
                remarks: formData.remarks || null
            };

            if (payload.paymentMethod === "ONLINE") {
                await paymentApi.initiate(payload);
            } else {
                await paymentApi.create(payload);
            }
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save payment.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
            <div className="society-form-header">
                <div>
                    <h2 id="payment-form-title">{payment ? "Edit payment" : "Add payment"}</h2>
                    <p>{payment ? "Update payment details." : "Record a payment received for the society."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="society-form-body">
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-section">
                        <div className="form-section-title">
                            <h3>Payment information</h3>
                            <span>Basic payment setup</span>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Society<span className="required">*</span></label>
                                <input type="text" value={formData.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly required />
                            </div>
                            <div className="form-group">
                                <label>Invoice ID</label>
                                <select required value={formData.invoiceId} onChange={(event) => { const invoice = invoices.find((item) => item.id === event.target.value); setFormData((prev) => ({ ...prev, invoiceId: invoice?.id || "", unitId: invoice?.unitId || prev.unitId, memberId: invoice?.memberId || prev.memberId, amount: invoice?.outstandingAmount || prev.amount })); }}><option value="">Select an unpaid invoice</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - Unit {invoice.unitId} - Due {invoice.outstandingAmount} ({invoice.status})</option>)}</select>
                            </div>
                            <div className="form-group">
                                <label>Payment reference</label>
                                <input type="text" value={formData.paymentReference} onChange={(event) => setFormData((prev) => ({ ...prev, paymentReference: event.target.value }))} placeholder="Reference number" />
                            </div>
                            <div className="form-group">
                                <label>Payment method</label>
                                <select value={formData.paymentMethod} onChange={(event) => setFormData((prev) => ({ ...prev, paymentMethod: event.target.value }))}>
                                    <option value="CHEQUE">CHEQUE</option>
                                    <option value="ONLINE">ONLINE</option>
                                    <option value="CASH">CASH</option>
                                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                                    <option value="NEFT">NEFT</option>
                                    <option value="RTGS">RTGS</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount<span className="required">*</span></label>
                                <input type="number" min="0" step="0.01" value={formData.amount} onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))} placeholder="0.00" required />
                            </div>
                            <div className="form-group">
                                <label>Payment date</label>
                                <input type="date" value={formData.paymentDate} onChange={(event) => setFormData((prev) => ({ ...prev, paymentDate: event.target.value }))} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Idempotency key</label>
                                <input type="text" value={formData.idempotencyKey} onChange={(event) => setFormData((prev) => ({ ...prev, idempotencyKey: event.target.value }))} placeholder="Unique payment key" />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Remarks</label>
                                <textarea value={formData.remarks} onChange={(event) => setFormData((prev) => ({ ...prev, remarks: event.target.value }))} rows="3" placeholder="Optional notes" />
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : payment ? "Save changes" : "Add payment"}</button>
                </footer>
            </form>
        </div>
    );
};

export default PaymentForm;



