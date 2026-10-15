import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, CheckCircle2, Edit, FileText, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import agreementApi from "../api/agreement.api";
import residentApi from "../../residents/api/resident.api";
import unitApi from "../../units/api/unit.api";
import AgreementForm from "../components/AgreementForm";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const statusTone = (status) => ["ACTIVE", "APPROVED", "RENEWED"].includes(status) ? "success" : ["TERMINATED", "EXPIRED"].includes(status) ? "danger" : ["SUBMITTED", "UNDER_VERIFICATION", "EXPIRING_SOON", "RENEWAL_INITIATED"].includes(status) ? "pending" : "neutral";

const AgreementListPage = () => {
    const [agreements, setAgreements] = useState([]);
    const [residents, setResidents] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingAgreement, setEditingAgreement] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [agreementResponse, residentResponse, unitResponse] = await Promise.all([
                agreementApi.getAll(),
                residentApi.getAll(),
                unitApi.getAll()
            ]);

            setAgreements(rowsFrom(agreementResponse));
            setResidents(rowsFrom(residentResponse));
            setUnits(rowsFrom(unitResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load agreements.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return agreements;

        return agreements.filter((agreement) => {
            const residentName = residents.find((resident) => resident.id === agreement.tenantId)?.displayName || residents.find((resident) => resident.id === agreement.tenantId)?.name || "";
            const unitName = units.find((unit) => unit.id === agreement.unitId)?.unitNumber || units.find((unit) => unit.id === agreement.unitId)?.name || "";
            const text = [agreement.agreementReference, agreement.agreementType, agreement.status, residentName, unitName, agreement.startDate, agreement.expiryDate].join(" ").toLowerCase();
            return text.includes(query);
        });
    }, [agreements, residents, search, units]);

    const runWorkflowAction = async (agreement) => {
        const transitions = {
            DRAFT: ["Submit", () => agreementApi.submit(agreement.id)],
            SUBMITTED: ["Start verification", () => agreementApi.verify(agreement.id)],
            UNDER_VERIFICATION: ["Approve", () => agreementApi.approve(agreement.id)],
            APPROVED: ["Activate", () => agreementApi.activate(agreement.id)],
            ACTIVE: ["Mark expiring", () => agreementApi.markExpiringSoon(agreement.id)],
            EXPIRING_SOON: ["Mark expired", () => agreementApi.markExpired(agreement.id)],
            RENEWAL_INITIATED: ["Mark expired", () => agreementApi.markExpired(agreement.id)]
        };
        const transition = transitions[agreement.status];
        if (!transition) return;
        try {
            setSubmitting(true);
            await transition[1]();
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || `Could not ${transition[0].toLowerCase()} agreement.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id, terminate = false) => {
        const reason = window.prompt(terminate ? "Enter termination reason:" : "Enter rejection reason for this agreement:", "Rejected");
        if (reason === null) return;

        try {
            setSubmitting(true);
            if (terminate) await agreementApi.terminate(id, reason || "Terminated");
            else await agreementApi.reject(id, reason || "Rejected");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not reject agreement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this agreement?");
        if (!confirmed) return;

        try {
            setSubmitting(true);
            await agreementApi.delete(id);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete agreement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> AGREEMENT MANAGEMENT</div>
                    <h1>Agreements</h1>
                    <p>Track lease and tenancy records, renewal dates, approvals, and expiry status.</p>
                </div>
                <button className="society-add-button" onClick={() => { setEditingAgreement(null); setShowForm(true); }}>
                    <Plus size={18} /> Add agreement
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><FileText size={19} /></span>
                    <div><span className="society-stat-label">Total agreements</span><strong>{loading ? "—" : agreements.length}</strong></div>
                    <span className="society-stat-note">Across all units</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Active</span><strong>{loading ? "—" : agreements.filter((item) => item.status === "ACTIVE").length}</strong></div>
                    <span className="society-stat-note">Live occupancy</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><BadgeCheck size={19} /></span>
                    <div><span className="society-stat-label">Expiring soon</span><strong>{loading ? "—" : agreements.filter((item) => item.status === "EXPIRING_SOON").length}</strong></div>
                    <span className="society-stat-note">Require action</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Agreement records</h2><p>Review agreement type, tenant or owner, date range, and status.</p></div>
                    <span className="society-count">{filtered.length} entries</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search agreements" placeholder="Search reference, tenant, unit or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                    <button className="society-refresh-button" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading agreements...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty"><h3>No agreements found</h3><p>{search ? "Try another search." : "No agreement records available."}</p></div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Tenant / Owner</th>
                                    <th>Unit</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((agreement) => {
                                    const resident = residents.find((item) => item.id === agreement.tenantId || item.id === agreement.ownerId);
                                    const unit = units.find((item) => item.id === agreement.unitId);

                                    return (
                                        <tr key={agreement.id}>
                                            <td>
                                                <div className="society-name-cell">
                                                    <span className="society-avatar"><FileText size={18} /></span>
                                                    <span>
                                                        <strong>{agreement.agreementReference || "Agreement"}</strong>
                                                        <small>{agreement.startDate || "—"} to {agreement.expiryDate || "—"}</small>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{resident?.displayName || resident?.name || "Resident"}</td>
                                            <td>{unit?.unitNumber || unit?.name || agreement.unitId}</td>
                                            <td>{agreement.agreementType || "LEASE"}</td>
                                            <td><span className={`moveinout-status moveinout-status-${statusTone(agreement.status)}`}>{agreement.status || "DRAFT"}</span></td>
                                            <td>
                                                <div className="society-row-actions moveinout-actions">
                                                    <button className="society-icon-action" title="Edit agreement" aria-label={`Edit ${agreement.id}`} onClick={() => { setEditingAgreement(agreement); setShowForm(true); }}><Edit size={16} /></button>
                                                    {!["TERMINATED", "EXPIRED"].includes(agreement.status) && <button className="society-workflow-action" onClick={() => runWorkflowAction(agreement)} disabled={submitting}>{({ DRAFT: "Submit", SUBMITTED: "Verify", UNDER_VERIFICATION: "Approve", APPROVED: "Activate", ACTIVE: "Mark expiring", EXPIRING_SOON: "Mark expired", RENEWAL_INITIATED: "Mark expired" }[agreement.status] || "Continue")}</button>}
                                                    {["SUBMITTED", "UNDER_VERIFICATION"].includes(agreement.status) && <button className="society-icon-action society-delete-action" title="Reject agreement" aria-label={`Reject ${agreement.id}`} onClick={() => handleReject(agreement.id)} disabled={submitting}><XCircle size={16} /></button>}
                                                    {!["TERMINATED", "EXPIRED"].includes(agreement.status) && <button className="society-icon-action society-delete-action" title="Terminate agreement" aria-label={`Terminate ${agreement.id}`} onClick={() => handleReject(agreement.id, true)} disabled={submitting}><Ban size={16} /></button>}
                                                    <button className="society-icon-action society-delete-action" title="Delete agreement" aria-label={`Delete ${agreement.id}`} onClick={() => handleDelete(agreement.id)} disabled={submitting}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowForm(false); setEditingAgreement(null); } }}><AgreementForm key={editingAgreement?.id || "new-agreement"} agreement={editingAgreement} onClose={() => { setShowForm(false); setEditingAgreement(null); }} onSuccess={async () => { setShowForm(false); setEditingAgreement(null); await loadData(); }} /></div>}
        </section>
    );
};

export default AgreementListPage;
