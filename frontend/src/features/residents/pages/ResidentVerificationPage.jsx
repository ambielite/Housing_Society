import { useEffect, useMemo, useState } from "react";
import { AlarmClockCheck, CheckCircle2, CircleDashed, Plus, RefreshCw, Search, UserRound, XCircle } from "lucide-react";

import residentApi from "../api/resident.api";
import residentVerificationApi from "../api/residentVerification.api";
import societyApi from "../../societies/api/society.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const emptyForm = () => ({
    societyId: "",
    residentId: "",
    verificationType: "INITIAL_REGISTRATION",
    status: "PENDING",
    reviewedBy: "",
    reviewerRemarks: "",
    rejectionReason: "",
    informationRequest: ""
});

const ResidentVerificationPage = () => {
    const [items, setItems] = useState([]);
    const [residents, setResidents] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm());

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [verificationResponse, residentResponse, societyResponse] = await Promise.all([
                residentVerificationApi.getAll(),
                residentApi.getAll(),
                societyApi.getAll()
            ]);
            setItems(rowsFrom(verificationResponse));
            setResidents(rowsFrom(residentResponse));
            setSocieties(rowsFrom(societyResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load verification data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) => [item.residentId, item.verificationType, item.status, item.reviewedBy].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [items, search]);

    const pendingCount = items.filter((item) => item.status === "PENDING").length;
    const approvedCount = items.filter((item) => item.status === "APPROVED").length;

    const handleCreate = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await residentVerificationApi.create({ ...form, status: form.status || "PENDING" });
            setShowForm(false);
            setForm(emptyForm());
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not create verification request.");
        } finally {
            setSaving(false);
        }
    };

    const handleReview = async (id, action) => {
        try {
            setSaving(true);
            if (action === "approve") {
                await residentVerificationApi.approve(id, { reviewedBy: "Admin", reviewerRemarks: "Approved from resident module" });
            } else if (action === "reject") {
                await residentVerificationApi.reject(id, { reviewedBy: "Admin", rejectionReason: "Rejected from resident module" });
            } else {
                await residentVerificationApi.requestInformation(id, { reviewedBy: "Admin", informationRequest: "Please provide missing information." });
            }
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update verification.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> RESIDENT VERIFICATION</div>
                    <h1>Verification queue</h1>
                    <p>Approve owners, tenants, and stakeholder documents with backend-driven review states.</p>
                </div>
                <button className="society-add-button" type="button" onClick={() => setShowForm(true)}>
                    <Plus size={18} strokeWidth={2.4} /> New verification
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}</div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><CircleDashed size={19} /></span>
                    <div><span className="society-stat-label">Pending</span><strong>{loading ? "—" : pendingCount}</strong></div>
                    <span className="society-stat-note">Awaiting review</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Approved</span><strong>{loading ? "—" : approvedCount}</strong></div>
                    <span className="society-stat-note">Cleared for activation</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><AlarmClockCheck size={19} /></span>
                    <div><span className="society-stat-label">Total checks</span><strong>{loading ? "—" : items.length}</strong></div>
                    <span className="society-stat-note">Across all flows</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div>
                        <h2>Verification records</h2>
                        <p>Review resident verification history, queue state, and required follow-up.</p>
                    </div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`}</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search verification records" placeholder="Search resident, type or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
                        <kbd>⌕</kbd>
                    </label>
                    <button className="society-refresh-button" type="button" onClick={loadData} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading verifications...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty">
                        <span className="society-empty-icon"><UserRound size={24} /></span>
                        <h3>No verification records</h3>
                        <p>Create the first verification request for a resident.</p>
                    </div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="society-name-cell">
                                                <span className="society-avatar">
                                                    {item.avatarUrl ? (
                                                        <img src={item.avatarUrl} alt={item.residentDisplayName || item.residentId || "Resident"} className="society-avatar-img" />
                                                    ) : (
                                                        <UserRound size={19} />
                                                    )}
                                                </span>
                                                <span>
                                                    <strong>{(residents.find((r) => r.id === item.residentId)?.displayName) || item.residentDisplayName || item.residentId || "Resident"}</strong>
                                                    <small>{item.reviewedBy ? `Reviewed by ${item.reviewedBy}` : "Awaiting review"}</small>
                                                </span>
                                            </div>
                                        </td>
                                        <td>{item.verificationType || "INITIAL_REGISTRATION"}</td>
                                        <td><span className="society-tax-label">{item.status || "PENDING"}</span></td>
                                        <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}</td>
                                        <td>
                                            <div className="society-row-actions">
                                                <button className="society-icon-action" type="button" onClick={() => handleReview(item.id, "approve")} title="Approve"><CheckCircle2 size={16} /></button>
                                                <button className="society-icon-action" type="button" onClick={() => handleReview(item.id, "reject")} title="Reject"><XCircle size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showForm && (
                <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
                    <section className="society-form-modal" role="dialog" aria-modal="true">
                        <header className="society-form-header">
                            <div>
                                <h2>Create verification</h2>
                                <p>Submit a resident verification or document review request.</p>
                            </div>
                            <button type="button" className="modal-close-btn" onClick={() => setShowForm(false)}>×</button>
                        </header>

                        <form onSubmit={handleCreate}>
                            <div className="society-form-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Society</label>
                                        <select value={form.societyId} onChange={(e) => setForm((current) => ({ ...current, societyId: e.target.value }))} required>
                                            <option value="">Select society</option>
                                            {societies.map((society) => <option key={society.id} value={society.id}>{society.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Resident</label>
                                        <select value={form.residentId} onChange={(e) => setForm((current) => ({ ...current, residentId: e.target.value }))} required>
                                            <option value="">Select resident</option>
                                            {residents.map((resident) => (
                                                <option key={resident.id} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Verification type</label>
                                        <select value={form.verificationType} onChange={(e) => setForm((current) => ({ ...current, verificationType: e.target.value }))}>
                                            <option value="INITIAL_REGISTRATION">Initial registration</option>
                                            <option value="KYC">KYC</option>
                                            <option value="OWNER_VERIFICATION">Owner verification</option>
                                            <option value="TENANT_VERIFICATION">Tenant verification</option>
                                            <option value="PROFILE_UPDATE">Profile update</option>
                                            <option value="DOCUMENT_REVERIFICATION">Document reverification</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                            <option value="MORE_INFORMATION_REQUIRED">More information required</option>
                                        </select>
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Reviewed by</label>
                                        <input type="text" value={form.reviewedBy} onChange={(e) => setForm((current) => ({ ...current, reviewedBy: e.target.value }))} placeholder="Admin, manager or team" />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Reviewer remarks</label>
                                        <textarea rows="3" value={form.reviewerRemarks} onChange={(e) => setForm((current) => ({ ...current, reviewerRemarks: e.target.value }))} placeholder="Notes for the review" />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Rejection reason</label>
                                        <textarea rows="2" value={form.rejectionReason} onChange={(e) => setForm((current) => ({ ...current, rejectionReason: e.target.value }))} placeholder="Optional if rejected" />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Information request</label>
                                        <textarea rows="2" value={form.informationRequest} onChange={(e) => setForm((current) => ({ ...current, informationRequest: e.target.value }))} placeholder="Optional if more information is required" />
                                    </div>
                                </div>
                            </div>
                            <footer className="society-form-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Create verification"}</button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </section>
    );
};

export default ResidentVerificationPage;
