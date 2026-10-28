import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, Printer, Search, Share2 } from "lucide-react";
import invoiceApi from "../api/invoice.api";
import unitApi from "../../units/api/unit.api";
import InvoiceForm from "../components/InvoiceForm";

const rowsFrom = (response) => Array.isArray(response) ? response : response?.data || response?.records || [];
const society = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const invoiceFilename = (invoice) => `${invoice.invoiceNumber || "invoice"}.pdf`;
const invoiceBlob = (response) => new Blob([response.data], { type: response.headers?.["content-type"] || "application/pdf" });
const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function FinanceInvoicesPage() {
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [busyId, setBusyId] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const id = society();
            const [invoiceResult, unitResult] = await Promise.allSettled([
                invoiceApi.getAll(id ? { societyId: id } : {}),
                unitApi.getAll(),
            ]);
            if (invoiceResult.status === "rejected") throw invoiceResult.reason;
            setItems(rowsFrom(invoiceResult.value));
            setUnits(unitResult.status === "fulfilled" ? rowsFrom(unitResult.value) : []);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load invoices.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadData(); }, []);

    const getUnitName = (unitId) => {
        const unit = units.find((entry) => String(entry.id) === String(unitId));
        return unit?.unitNumber || unit?.name || "Unit";
    };

    const filtered = useMemo(() => items.filter((item) => {
        const query = search.trim().toLowerCase();
        const unit = units.find((entry) => String(entry.id) === String(item.unitId));
        const matches = !query || [item.invoiceNumber, unit?.unitNumber, unit?.name, item.billingPeriod, item.status, item.description]
            .join(" ").toLowerCase().includes(query);
        return matches && (!status || item.status === status);
    }), [items, units, search, status]);

    const printInvoice = async (invoice) => {
        // Open the window during the click gesture so popup blockers allow it.
        const printWindow = window.open("about:blank", "_blank");
        if (!printWindow) {
            const response = await invoiceApi.downloadDocument(invoice.id);
            saveBlob(invoiceBlob(response), invoiceFilename(invoice));
            setNotice("The invoice PDF was downloaded. Open it to print.");
            return;
        }

        printWindow.document.title = `Invoice ${invoice.invoiceNumber || ""}`;
        printWindow.document.body.textContent = "Preparing invoice for printing…";
        try {
            const response = await invoiceApi.downloadDocument(invoice.id);
            const url = URL.createObjectURL(invoiceBlob(response));
            let released = false;
            const releaseUrl = () => {
                if (released) return;
                released = true;
                URL.revokeObjectURL(url);
            };
            printWindow.addEventListener("load", () => {
                printWindow.focus();
                window.setTimeout(() => printWindow.print(), 400);
            }, { once: true });
            printWindow.addEventListener("afterprint", () => {
                releaseUrl();
                printWindow.close();
            }, { once: true });
            printWindow.addEventListener("pagehide", releaseUrl, { once: true });
            printWindow.location.href = url;
            window.setTimeout(releaseUrl, 5 * 60 * 1000);
        } catch (err) {
            printWindow.close();
            throw err;
        }
    };

    const shareInvoice = async (invoice) => {
        const response = await invoiceApi.downloadDocument(invoice.id);
        const blob = invoiceBlob(response);
        const file = new File([blob], invoiceFilename(invoice), { type: "application/pdf" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Invoice ${invoice.invoiceNumber || ""}`,
                    text: `Invoice ${invoice.invoiceNumber || ""}`,
                });
                setNotice("Invoice shared.");
                return;
            } catch (err) {
                if (err.name === "AbortError") return;
                // If the native share sheet fails, leave the user with the PDF.
            }
        }
        saveBlob(blob, invoiceFilename(invoice));
        setNotice("This browser cannot share files directly. The invoice PDF was downloaded so you can attach it to a message.");
    };

    const action = async (invoice, kind) => {
        try {
            setBusyId(invoice.id);
            setError("");
            setNotice("");
            if (kind === "issue") {
                await invoiceApi.issue(invoice.id);
                await loadData();
            } else if (kind === "cancel") {
                await invoiceApi.cancel(invoice.id);
                await loadData();
            } else if (kind === "download") {
                const response = await invoiceApi.downloadDocument(invoice.id);
                saveBlob(invoiceBlob(response), invoiceFilename(invoice));
            } else if (kind === "print") {
                await printInvoice(invoice);
            } else if (kind === "share") {
                await shareInvoice(invoice);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Could not ${kind} invoice.`);
        } finally {
            setBusyId("");
        }
    };

    return (
        <section className="society-dashboard module-shell-page finance-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Invoices</h1>
                    <p>Create itemized drafts, issue invoices, download documents, and track balances.</p>
                </div>
                <button className="society-add-button" onClick={() => setShowForm(true)}><Plus size={18} /> Create invoice</button>
            </header>
            {error && <div className="society-error" role="alert">{error}<button onClick={() => void loadData()}>Try again</button></div>}
            {notice && <div className="invoice-action-notice" role="status">{notice}</div>}
            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Invoice register</h2><p>Amounts and statuses from invoice records.</p></div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} invoices`}</span>
                </div>
                <div className="society-toolbar">
                    <label className="society-search"><Search size={17} /><input aria-label="Search invoices" placeholder="Invoice, unit, period, or status" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                    <select aria-label="Filter invoice status" value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="">All statuses</option>
                        {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].map((value) => <option key={value}>{value}</option>)}
                    </select>
                </div>
                {loading ? <div className="society-loading">Loading invoices...</div> : filtered.length === 0 ? (
                    <div className="society-empty"><span className="society-empty-icon"><FileText size={24} /></span><h3>No invoices found</h3><p>Create a draft invoice with at least one line item.</p><button className="society-add-button" onClick={() => setShowForm(true)}><Plus size={17} /> Create invoice</button></div>
                ) : (
                    <div className="society-table-wrap"><table className="society-table">
                        <thead><tr><th>Invoice</th><th>Unit</th><th>Billing period</th><th>Invoice date</th><th>Due date</th><th>Previous balance</th><th>Subtotal</th><th>Tax</th><th>Penalty</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{filtered.map((invoice) => <tr key={invoice.id}>
                            <td>{invoice.invoiceNumber}</td><td>{getUnitName(invoice.unitId)}</td><td>{invoice.billingPeriod}</td>
                            <td>{String(invoice.invoiceDate || "").slice(0, 10)}</td><td>{String(invoice.dueDate || "").slice(0, 10)}</td>
                            <td>{money(invoice.previousBalance)}</td><td>{money(invoice.subtotal)}</td><td>{money(invoice.taxAmount)}</td>
                            <td>{money(invoice.penaltyAmount)}</td><td>{money(invoice.totalAmount)}</td><td>{money(invoice.paidAmount)}</td>
                            <td>{money(invoice.outstandingAmount)}</td><td>{invoice.status}</td>
                            <td><div className="society-row-actions invoice-row-actions">
                                {invoice.status === "DRAFT" && <button className="society-workflow-action" disabled={busyId === invoice.id} onClick={() => void action(invoice, "issue")}>Issue</button>}
                                <button className="society-icon-action" title="Download invoice PDF" aria-label={`Download invoice ${invoice.invoiceNumber}`} disabled={busyId === invoice.id} onClick={() => void action(invoice, "download")}><Download size={16} /></button>
                                <button className="society-icon-action" title="Print invoice" aria-label={`Print invoice ${invoice.invoiceNumber}`} disabled={busyId === invoice.id} onClick={() => void action(invoice, "print")}><Printer size={16} /></button>
                                <button className="society-icon-action" title="Share invoice" aria-label={`Share invoice ${invoice.invoiceNumber}`} disabled={busyId === invoice.id} onClick={() => void action(invoice, "share")}><Share2 size={16} /></button>
                                {! ["PAID", "PARTIALLY_PAID", "CANCELLED"].includes(invoice.status) && <button className="society-workflow-action" disabled={busyId === invoice.id} onClick={() => void action(invoice, "cancel")}>Cancel</button>}
                            </div></td>
                        </tr>)}</tbody>
                    </table></div>
                )}
            </section>
            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><InvoiceForm onClose={() => setShowForm(false)} onSuccess={async () => { setShowForm(false); await loadData(); }} /></div>}
        </section>
    );
}
