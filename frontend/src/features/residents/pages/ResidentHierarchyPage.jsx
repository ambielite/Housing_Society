import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2,  Home, KeyRound, Plus, Search, SquarePen, Trash2, Users, UserRound } from "lucide-react";

import residentApi from "../api/resident.api";
import ownerUnitApi from "../api/ownerUnit.api";
import unitApi from "../../units/api/unit.api";
import societyApi from "../../societies/api/society.api";
import { RecordDetailsModal } from "../../../components/ui/Modal";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const profileImageUrl = (url) => {
    if (!url) return undefined;
    const value = String(url).trim().replaceAll("\\", "/");
    if (/^https?:\/\//i.test(value)) return value;
    const base = import.meta.env.VITE_LEGACY_API_BASE_URL || "http://localhost:5000/api";
    return `${new URL(base, window.location.origin).origin}/${value.replace(/^\/+/, "")}`;
};

const emptyForm = () => ({
    societyId: "",
    ownerId: "",
    unitId: "",
    ownershipType: "PRIMARY_OWNER",
    ownershipPercentage: 100,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
    status: "ACTIVE"
});

const ResidentHierarchyPage = () => {
    const [residents, setResidents] = useState([]);
    const [units, setUnits] = useState([]);
    const [societies, setSocieties] = useState([]);
    const [ownerUnits, setOwnerUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [search, setSearch] = useState("");
    const [viewingResident, setViewingResident] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [residentResponse, unitResponse, societyResponse, ownerUnitResponse] = await Promise.all([
                residentApi.getAll(),
                unitApi.getAll(),
                societyApi.getAll(),
                ownerUnitApi.getAll()
            ]);

            setResidents(rowsFrom(residentResponse));
            setUnits(rowsFrom(unitResponse));
            setSocieties(rowsFrom(societyResponse));
            setOwnerUnits(rowsFrom(ownerUnitResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load resident ownership data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return residents;
        return residents.filter((resident) => {
            const label = [resident.displayName, resident.firstName, resident.lastName, resident.email, resident.mobile].filter(Boolean).join(" ").toLowerCase();
            return label.includes(q);
        });
    }, [residents, search]);

    const hierarchy = useMemo(() => {
        return filtered.map((resident) => {
            const relationships = ownerUnits.filter((item) => item.ownerId === resident.id);
            return { ...resident, unitCount: relationships.length, ownerships: relationships };
        });
    }, [filtered, ownerUnits]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setShowForm(true);
    };

    const openEdit = (record) => {
        setEditingId(record.id);
        setForm({
            societyId: record.societyId || "",
            ownerId: record.ownerId || "",
            unitId: record.unitId || "",
            ownershipType: record.ownershipType || "PRIMARY_OWNER",
            ownershipPercentage: record.ownershipPercentage ?? 100,
            effectiveFrom: record.effectiveFrom ? record.effectiveFrom.slice(0, 10) : new Date().toISOString().slice(0, 10),
            effectiveTo: record.effectiveTo ? record.effectiveTo.slice(0, 10) : "",
            status: record.status || "ACTIVE"
        });
        setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                ...form,
                ownershipPercentage: Number(form.ownershipPercentage || 100),
                effectiveFrom: form.effectiveFrom || new Date().toISOString().slice(0, 10)
            };

            if (editingId) await ownerUnitApi.update(editingId, payload);
            else await ownerUnitApi.create(payload);

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm());
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save unit-resident relationship.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this owner-unit relationship?")) return;
        try {
            await ownerUnitApi.delete(id);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not remove relationship.");
        }
    };

    return (
        <section className="society-dashboard module-shell-page resident-module-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> RESIDENT RELATIONSHIPS</div>
                    <h1>Owner & unit hierarchy</h1>
                    <p>Link residents to units, define ownership share, and track active relationships.</p>
                </div>
                <button className="society-add-button" type="button" onClick={openCreate}>
                    <Plus size={18} strokeWidth={2.4} /> Add relationship
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}</div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><Users size={19} /></span>
                    <div><span className="society-stat-label">Residents</span><strong>{loading ? "—" : residents.length}</strong></div>
                    <span className="society-stat-note">Stakeholders</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><Home size={19} /></span>
                    <div><span className="society-stat-label">Units</span><strong>{loading ? "—" : units.length}</strong></div>
                    <span className="society-stat-note">Available properties</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><KeyRound size={19} /></span>
                    <div><span className="society-stat-label">Assignments</span><strong>{loading ? "—" : ownerUnits.length}</strong></div>
                    <span className="society-stat-note">Active ownership links</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div>
                        <h2>Resident ownership map</h2>
                        <p>Track resident-to-unit relationships and shared ownership details.</p>
                    </div>
                    <span className="society-count">{loading ? "Loading" : `${hierarchy.length} residents`}</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search resident ownership" placeholder="Search resident name or email..." value={search} onChange={(event) => setSearch(event.target.value)} />
                        <kbd>⌕</kbd>
                    </label>
                    <button className="society-refresh-button" type="button" onClick={loadData} disabled={loading}>Refresh</button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading ownership...</div>
                ) : hierarchy.length === 0 ? (
                    <div className="society-empty">
                        <span className="society-empty-icon"><Building2 size={24} /></span>
                        <h3>No resident-unit links yet</h3>
                        <p>Create the first owner-unit relationship to begin tracking occupancy.</p>
                    </div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Role</th>
                                    <th>Units linked</th>
                                    <th>Ownership</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hierarchy.map((resident) => (
                                    <tr key={resident.id}>
                                        <td>
                                            <div className="society-name-cell">
                                                <span className="society-avatar">
                                                    {resident.profilePhoto ? (
                                                        <img src={profileImageUrl(resident.profilePhoto)} alt={resident.displayName || resident.firstName || "Resident"} className="resident-table-photo" />
                                                    ) : (
                                                        <Users size={19} />
                                                    )}
                                                </span>
                                                <span>
                                                    <button type="button" className="record-details-trigger" onClick={() => setViewingResident(resident)}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "Unnamed resident"}</button>
                                                    <small>{resident.email || resident.mobile || "No contact"}</small>
                                                </span>
                                            </div>
                                        </td>
                                        <td>{(resident.role || "PRIMARY_OWNER").replaceAll("_", " ")}</td>
                                        <td>{resident.unitCount}</td>
                                        <td>{resident.ownerships[0]?.ownershipType || "PRIMARY_OWNER"}</td>
                                        <td>
                                            <div className="society-row-actions">
                                                <button className="society-icon-action" type="button" title="Edit relationship" onClick={() => openEdit(resident.ownerships[0])}><SquarePen size={16} /></button>
                                                <button className="society-icon-action society-delete-action" type="button" title="Remove relationship" onClick={() => resident.ownerships[0] && handleDelete(resident.ownerships[0].id)}><Trash2 size={16} /></button>
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
                                <h2>{editingId ? "Edit relationship" : "Add unit relationship"}</h2>
                                <p>Map a resident to a unit with ownership share and effective dates.</p>
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
                                        <label>Resident</label>
                                        <select value={form.ownerId} onChange={(e) => setForm((current) => ({ ...current, ownerId: e.target.value }))} required>
                                            <option value="">Select resident</option>
                                            {residents.map((resident) => (
                                                <option key={resident.id} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Unit</label>
                                        <select value={form.unitId} onChange={(e) => setForm((current) => ({ ...current, unitId: e.target.value }))} required>
                                            <option value="">Select unit</option>
                                            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNumber || unit.name || unit.id}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ownership type</label>
                                        <select value={form.ownershipType} onChange={(e) => setForm((current) => ({ ...current, ownershipType: e.target.value }))}>
                                            <option value="PRIMARY_OWNER">Primary owner</option>
                                            <option value="CO_OWNER">Co-owner</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ownership %</label>
                                        <input type="number" min="1" max="100" value={form.ownershipPercentage} onChange={(e) => setForm((current) => ({ ...current, ownershipPercentage: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Effective from</label>
                                        <input type="date" value={form.effectiveFrom} onChange={(e) => setForm((current) => ({ ...current, effectiveFrom: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Effective to</label>
                                        <input type="date" value={form.effectiveTo} onChange={(e) => setForm((current) => ({ ...current, effectiveTo: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                            <footer className="society-form-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : (editingId ? "Update" : "Create")}</button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}

            {viewingResident && <RecordDetailsModal
                title={viewingResident.displayName || [viewingResident.firstName, viewingResident.middleName, viewingResident.lastName].filter(Boolean).join(" ") || "Resident details"}
                subtitle="Resident profile and ownership details"
                icon={UserRound}
                image={profileImageUrl(viewingResident.profilePhoto)}
                onClose={() => setViewingResident(null)}
                sections={[
                    { title: "Personal information", fields: [["First name", viewingResident.firstName], ["Middle name", viewingResident.middleName], ["Last name", viewingResident.lastName], ["Date of birth", viewingResident.dateOfBirth], ["Role", viewingResident.role], ["Status", viewingResident.status]] },
                    { title: "Contact", fields: [["Email", viewingResident.email], ["Mobile", viewingResident.mobile], ["Alternate mobile", viewingResident.alternateMobile], ["Emergency contact", viewingResident.emergencyContactName], ["Emergency phone", viewingResident.emergencyContactMobile]] },
                    ...viewingResident.ownerships.map((ownership, index) => {
                        const unit = units.find((item) => item.id === ownership.unitId);
                        const society = societies.find((item) => item.id === ownership.societyId);
                        return {
                            title: `Ownership ${index + 1}`,
                            fields: [["Unit", unit?.unitNumber || unit?.name], ["Society", society?.name], ["Ownership type", ownership.ownershipType], ["Ownership share", ownership.ownershipPercentage == null ? null : `${ownership.ownershipPercentage}%`], ["Status", ownership.status], ["Effective from", ownership.effectiveFrom], ["Effective to", ownership.effectiveTo], ["Remarks", ownership.remarks]]
                        };
                    }),
                    { title: "Resident record", fields: [["Resident ID", viewingResident.id]] }
                ]}
            />}
        </section>
    );
};

export default ResidentHierarchyPage;
