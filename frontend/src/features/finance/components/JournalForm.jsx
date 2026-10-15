import { useEffect, useState } from "react";
import { X } from "lucide-react";

import accountingPeriodApi from "../api/accountingPeriod.api";
import journalApi from "../api/journal.api";
import accountApi from "../api/account.api";

const normalizePeriodRows = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const findOpenPeriodForDate = (periods, transactionDate) => {
    if (!transactionDate) return null;

    const targetDate = new Date(`${transactionDate}T00:00:00`);

    return periods.find((period) => {
        const status = String(period?.status || "").toUpperCase();
        if (status !== "OPEN") return false;

        const startDate = new Date(`${period?.startDate || ""}T00:00:00`);
        const endDate = new Date(`${period?.endDate || ""}T00:00:00`);

        return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && targetDate >= startDate && targetDate <= endDate;
    });
};

const createInitialForm = (journal) => {
    const storedSocietyId = String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
    const defaultLines = [
        { accountId: "", description: "", debitAmount: "", creditAmount: "" },
        { accountId: "", description: "", debitAmount: "", creditAmount: "" }
    ];

    return {
        societyId: journal?.societyId || storedSocietyId,
        transactionDate: journal?.transactionDate ? String(journal.transactionDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
        description: journal?.description || "",
        referenceType: journal?.referenceType || "INVOICE",
        referenceId: journal?.referenceId || "",
        status: journal?.status || "DRAFT",
        lines: journal?.lines?.length ? journal.lines : defaultLines
    };
};

const JournalForm = ({ journal, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(() => createInitialForm(journal));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const societyId = formData.societyId || localStorage.getItem("selectedSocietyId");
        if (!societyId) return;
        accountApi.getAll(societyId).then((response) => {
            const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
            setAccounts(rows);
        }).catch((err) => setError(err.response?.data?.message || "Could not load chart of accounts."));
    }, [formData.societyId]);

    const updateLine = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            lines: prev.lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line
            )
        }));
    };

    const addLine = () => {
        setFormData((prev) => ({
            ...prev,
            lines: [...prev.lines, { accountId: "", description: "", debitAmount: "", creditAmount: "" }]
        }));
    };

    const removeLine = (index) => {
        if (formData.lines.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            lines: prev.lines.filter((_, lineIndex) => lineIndex !== index)
        }));
    };

    const validateJournal = () => {
        const rawLines = formData.lines.filter((line) =>
            line.accountId || line.description || line.debitAmount || line.creditAmount
        );

        if (rawLines.length < 2) {
            return "Journal must contain at least two lines. Click Add line and fill both rows before saving.";
        }

        let totalDebit = 0;
        let totalCredit = 0;

        for (const line of rawLines) {
            const accountId = String(line.accountId || "").trim();
            const debit = Number(line.debitAmount || 0);
            const credit = Number(line.creditAmount || 0);

            if (!accountId) {
                return "Each journal line must have an account selected.";
            }

            if (debit < 0 || credit < 0) {
                return "Debit and credit amounts cannot be negative.";
            }

            if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
                return "Each journal line must have either a debit or a credit amount, not both or neither.";
            }

            totalDebit += debit;
            totalCredit += credit;
        }

        if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
            return `Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`;
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const societyId = String(formData.societyId || localStorage.getItem("selectedSocietyId") || "").trim();
        const nextFormData = { ...formData, societyId };

        if (!societyId) {
            setError("Society ID is required. Please select a society before creating a journal.");
            return;
        }

        if (!nextFormData.description.trim()) {
            setError("Description is required.");
            return;
        }

        const validationMessage = validateJournal();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        const transactionDate = nextFormData.transactionDate || new Date().toISOString().slice(0, 10);

        try {
            const periodResponse = await accountingPeriodApi.getBySociety(societyId);
            const periods = normalizePeriodRows(periodResponse);
            const matchingPeriod = findOpenPeriodForDate(periods, transactionDate);

            if (!matchingPeriod) {
                const dateObj = new Date(`${transactionDate}T00:00:00`);
                const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
                const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

                const defaultPeriodPayload = {
                    societyId,
                    name: `Monthly ${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(dateObj)}`,
                    startDate: startOfMonth.toISOString().slice(0, 10),
                    endDate: endOfMonth.toISOString().slice(0, 10),
                    status: "OPEN",
                    description: "Auto-created for journal posting"
                };

                try {
                    await accountingPeriodApi.create(defaultPeriodPayload);
                } catch (createError) {
                    const createMessage = createError.response?.data?.message || "Unable to create an OPEN accounting period for this date.";
                    setError(createMessage);
                    return;
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Unable to verify accounting period for this journal date.");
            return;
        }

        const sanitizedLines = nextFormData.lines
            .filter((line) => line.accountId || line.description || line.debitAmount || line.creditAmount)
            .map((line) => ({
                ...line,
                accountId: String(line.accountId || "").trim(),
                debitAmount: Number(line.debitAmount || 0),
                creditAmount: Number(line.creditAmount || 0),
                description: line.description || ""
            }));

        try {
            setSaving(true);
            const payload = {
                ...nextFormData,
                lines: sanitizedLines
            };

            await journalApi.createDraft(payload);
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save journal entry.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="journal-form-title">
            <div className="society-form-header">
                <div>
                    <h2 id="journal-form-title">{journal ? "Edit journal" : "Add journal"}</h2>
                    <p>{journal ? "Update journal details." : "Create a new journal entry with balanced lines."}</p>
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
                            <h3>Journal details</h3>
                            <span>Entry information</span>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Society<span className="required">*</span></label>
                                <input type="text" value={formData.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly required />
                            </div>

                            <div className="form-group">
                                <label>Transaction date</label>
                                <input type="date" name="transactionDate" value={formData.transactionDate} onChange={(event) => setFormData((prev) => ({ ...prev, transactionDate: event.target.value }))} />
                            </div>

                            <div className="form-group">
                                <label>Reference type</label>
                                <select name="referenceType" value={formData.referenceType} onChange={(event) => setFormData((prev) => ({ ...prev, referenceType: event.target.value }))}>
                                    <option value="INVOICE">INVOICE</option>
                                    <option value="BILLING">BILLING</option>
                                    <option value="PAYMENT">PAYMENT</option>
                                    <option value="MANUAL">MANUAL</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Reference ID</label>
                                <input type="text" name="referenceId" value={formData.referenceId} onChange={(event) => setFormData((prev) => ({ ...prev, referenceId: event.target.value }))} placeholder="Optional reference ID" />
                            </div>

                            <div className="form-group form-group-full">
                                <label>Description<span className="required">*</span></label>
                                <textarea name="description" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} rows="3" placeholder="Enter journal description" required />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <h3>Journal lines</h3>
                            <button type="button" className="btn-secondary btn-small" onClick={addLine}>Add line</button>
                        </div>

                        <div className="form-grid">
                            {formData.lines.map((line, index) => (
                                <div key={index} className="journal-lines-grid">
                                    <div className="form-group">
                                        <label>Account ID</label>
                                        <select value={line.accountId} onChange={(event) => updateLine(index, "accountId", event.target.value)} required><option value="">Select chart account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.accountCode} - {account.accountName} ({account.accountType})</option>)}</select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <input type="text" value={line.description} onChange={(event) => updateLine(index, "description", event.target.value)} placeholder="Line description" />
                                    </div>
                                    <div className="form-group">
                                        <label>Debit</label>
                                        <input type="number" min="0" step="0.01" value={line.debitAmount} onChange={(event) => updateLine(index, "debitAmount", event.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="form-group">
                                        <label>Credit</label>
                                        <input type="number" min="0" step="0.01" value={line.creditAmount} onChange={(event) => updateLine(index, "creditAmount", event.target.value)} placeholder="0.00" />
                                    </div>
                                    {formData.lines.length > 1 && (
                                        <button type="button" className="btn-link danger" onClick={() => removeLine(index)}>Remove</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : journal ? "Save changes" : "Add journal"}</button>
                </footer>
            </form>
        </div>
    );
};

export default JournalForm;


