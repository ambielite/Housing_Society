import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw, Search, ShieldAlert, UserRound, Edit, Check, Trash2 } from "lucide-react";

import nonMemberApi from "../api/nonMember.api";
import societyApi from "../../societies/api/society.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const emptyForm = () => ({
    societyId: "",
    name: "",
    memberType: "SERVICE_PROVIDER",
    mobile: "",
    email: "",
    businessName: "",
    status: "PENDING",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    remarks: ""
});

const NonMemberListPage = () => {
    const [nonMembers, setNonMembers] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [membersResponse, societyResponse] = await Promise.all([
                nonMemberApi.getAll(),
                societyApi.getAll()
            ]);
            setNonMembers(rowsFrom(membersResponse));
            setSocieties(rowsFrom(societyResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load non-members.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return nonMembers;
        return nonMembers.filter((member) => [member.name, member.memberType, member.mobile, member.email, member.status].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [nonMembers, search]);

    const activeMembers = nonMembers.filter((member) => member.status === "ACTIVE").length;

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setShowForm(true);
    };

    const openEdit = (member) => {
        setEditingId(member.id);
        setForm({
            societyId: member.societyId || "",
            name: member.name || "",
            memberType: member.memberType || "SERVICE_PROVIDER",
            mobile: member.mobile || "",
            email: member.email || "",
            businessName: member.businessName || "",
            status: member.status || "PENDING",
            startDate: member.startDate ? member.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            endDate: member.endDate ? member.endDate.slice(0, 10) : "",
            remarks: member.remarks || ""
        });
        setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = { ...form };
            if (editingId) await nonMemberApi.update(editingId, payload);
            else await nonMemberApi.create(payload);
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm());
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save non-member.");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await nonMemberApi.updateStatus(id, status, "Updated from resident module");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this non-member record?")) return;
        try {
            await nonMemberApi.delete(id);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete non-member.");
        }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> NON-MEMBER REGISTRY</div>
                    <h1>Non-members</h1>
                    <p>Manage shops, service providers, tutors, and external stakeholders with backend status workflows.</p>
                </div>
                <button className="society-add-button" type="button" onClick={openCreate}>
                    <Plus size={18} strokeWidth={2.4} /> Add non-member
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}</div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><UserRound size={19} /></span>
                    <div><span className="society-stat-label">Total non-members</span><strong>{loading ? "—" : nonMembers.length}</strong></div>
                    <span className="society-stat-note">Registry count</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><Building2 size={19} /></span>
                    <div><span className="society-stat-label">Active</span><strong>{loading ? "—" : activeMembers}</strong></div>
                    <span className="society-stat-note">Permitted access</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><ShieldAlert size={19} /></span>
                    <div><span className="society-stat-label">Pending</span><strong>{loading ? "—" : nonMembers.filter((member) => member.status === "PENDING").length}</strong></div>
                    <span className="society-stat-note">Awaiting approval</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div>
                        <h2>Non-member directory</h2>
                        <p>Review and manage external stakeholders across the society.</p>
                    </div>
                    <span className="society-count">{loading ? "Loading" : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search non-members" placeholder="Search name, mobile, email, type..." value={search} onChange={(event) => setSearch(event.target.value)} />
                        <kbd>⌕</kbd>
                    </label>
                    <button className="society-refresh-button" type="button" onClick={loadData} disabled={loading}>
                        <RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading non-members...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty">
                        <span className="society-empty-icon"><UserRound size={24} /></span>
                        <h3>No non-members yet</h3>
                        <p>Add shops, vendors, tutors, and service providers to the registry.</p>
                    </div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="society-name-cell">
                                                <span className="society-avatar">
                                                    {member.logoUrl ? (
                                                        <img src={member.logoUrl} alt={member.name} className="society-avatar-img" />
                                                    ) : (
                                                        <UserRound size={19} />
                                                    )}
                                                </span>
                                                <span>
                                                    <strong>{member.name}</strong>
                                                    <small>{member.businessName || member.organizationName || "External stakeholder"}</small>
                                                </span>
                                            </div>
                                        </td>
                                        <td><span className="society-tax-label">{member.memberType || "OTHER"}</span></td>
                                        <td>{member.mobile || member.email || "No contact"}</td>
                                        <td><span className={member.status === "ACTIVE" ? "society-registration" : "society-muted"}>{member.status || "PENDING"}</span></td>
                                        <td>
                                            <div className="society-row-actions">
                                                <button
                                                    className="society-icon-action"
                                                    type="button"
                                                    title={`Edit ${member.name}`}
                                                    aria-label={`Edit ${member.name}`}
                                                    onClick={() => openEdit(member)}
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    className="society-icon-action"
                                                    type="button"
                                                    title={member.status === "ACTIVE" ? "Already active" : "Approve non-member"}
                                                    aria-label={member.status === "ACTIVE" ? "Already active" : `Approve ${member.name}`}
                                                    onClick={() => handleStatusChange(member.id, "ACTIVE")}
                                                >
                                                    <Check size={16} />
                                                </button>

                                                <button
                                                    className="society-icon-action society-delete-action"
                                                    type="button"
                                                    title={`Delete ${member.name}`}
                                                    aria-label={`Delete ${member.name}`}
                                                    onClick={() => handleDelete(member.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
                                <h2>{editingId ? "Edit non-member" : "Add non-member"}</h2>
                                <p>Register or update external stakeholders linked to this society.</p>
                            </div>
                            <button type="button" className="modal-close-btn" onClick={() => setShowForm(false)}>×</button>
                        </header>

                        <form onSubmit={handleSubmit}>
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
                                        <label>Name</label>
                                        <input type="text" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Member type</label>
                                        <select value={form.memberType} onChange={(e) => setForm((current) => ({ ...current, memberType: e.target.value }))}>
                                            <option value="SHOP">Shop</option>
                                            <option value="SERVICE_PROVIDER">Service provider</option>
                                            <option value="TUTOR">Tutor</option>
                                            <option value="COMMERCIAL_OCCUPANT">Commercial occupant</option>
                                            <option value="DOMESTIC_WORKER">Domestic worker</option>
                                            <option value="CONTRACTOR">Contractor</option>
                                            <option value="VENDOR">Vendor</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
                                            <option value="PENDING">Pending</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="SUSPENDED">Suspended</option>
                                            <option value="BLACKLISTED">Blacklisted</option>
                                            <option value="ARCHIVED">Archived</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mobile</label>
                                        <input type="tel" value={form.mobile} onChange={(e) => setForm((current) => ({ ...current, mobile: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Business / organization</label>
                                        <input type="text" value={form.businessName} onChange={(e) => setForm((current) => ({ ...current, businessName: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>Start date</label>
                                        <input type="date" value={form.startDate} onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>End date</label>
                                        <input type="date" value={form.endDate} onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))} />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Remarks</label>
                                        <textarea rows="3" value={form.remarks} onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                            <footer className="society-form-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : (editingId ? "Save changes" : "Add non-member")}</button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </section>
    );
};

export default NonMemberListPage;
