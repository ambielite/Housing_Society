import { useState } from "react";
import { X } from "lucide-react";

import accountApi from "../api/account.api";

const createInitialForm = (account) => ({
    societyId: account?.societyId || String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim(),
    parentAccountId: account?.parentAccountId || "",
    accountCode: account?.accountCode || "",
    accountName: account?.accountName || "",
    accountType: account?.accountType || "ASSET",
    description: account?.description || "",
    isActive: account?.isActive !== undefined ? account.isActive : true
});

const AccountForm = ({ account, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(() => createInitialForm(account));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!formData.societyId.trim()) {
            setError("Society ID is required.");
            return;
        }

        if (!formData.accountCode.trim()) {
            setError("Account code is required.");
            return;
        }

        if (!formData.accountName.trim()) {
            setError("Account name is required.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                parentAccountId: formData.parentAccountId || null,
                description: formData.description?.trim() || null,
                isActive: Boolean(formData.isActive)
            };

            if (account?.id) {
                await accountApi.update(account.id, payload);
            } else {
                await accountApi.create(payload);
            }

            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to save account.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="account-form-title">
            <header className="society-form-header">
                <div>
                    <h2 id="account-form-title">{account ? "Edit account" : "Add account"}</h2>
                    <p>{account ? "Update the account details." : "Create a new chart of accounts entry."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="society-form-body">
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-section">
                        <div className="form-section-title">
                            <h3>Account information</h3>
                            <span>Basic account setup</span>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Society<span className="required">*</span></label>
                                <input type="text" value={formData.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly required />
                            </div>


                            <div className="form-group">
                                <label>Account code<span className="required">*</span></label>
                                <input type="text" name="accountCode" value={formData.accountCode} onChange={handleChange} placeholder="e.g. 1001" required />
                            </div>

                            <div className="form-group">
                                <label>Account name<span className="required">*</span></label>
                                <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Enter account name" required />
                            </div>

                            <div className="form-group">
                                <label>Account type<span className="required">*</span></label>
                                <select name="accountType" value={formData.accountType} onChange={handleChange}>
                                    <option value="ASSET">ASSET</option>
                                    <option value="LIABILITY">LIABILITY</option>
                                    <option value="INCOME">INCOME</option>
                                    <option value="EXPENSE">EXPENSE</option>
                                    <option value="EQUITY">EQUITY</option>
                                    <option value="RECEIVABLE">RECEIVABLE</option>
                                </select>
                            </div>

                            <div className="form-group form-group-full">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Add notes about this account" />
                            </div>

                            <div className="form-group form-group-full checkbox-row">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="isActive" checked={Boolean(formData.isActive)} onChange={handleChange} />
                                    <span>Active account</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : account ? "Save changes" : "Add account"}</button>
                </footer>
            </form>
        </section>
    );
};

export default AccountForm;


