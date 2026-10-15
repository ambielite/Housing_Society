import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, CheckCircle2, Edit, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import moveInApi from "../api/moveIn.api";
import residentApi from "../../residents/api/resident.api";
import unitApi from "../../units/api/unit.api";
import MoveInForm from "../components/MoveInForm";
import { useAuth } from "../../../app/providers/useAuth";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const statusTone = (status) => ["COMPLETED", "APPROVED", "ACCESS_ACTIVATED", "CLEARED"].includes(status) ? "success" : ["REJECTED", "CANCELLED"].includes(status) ? "danger" : ["PENDING_DOCUMENTS", "INFORMATION_REQUIRED", "UNDER_VERIFICATION"].includes(status) ? "pending" : "neutral";

const MoveInListPage = () => {
    const [moveIns, setMoveIns] = useState([]);
    const [residents, setResidents] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [editingMoveIn, setEditingMoveIn] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [moveInResponse, residentResponse, unitResponse] = await Promise.all([
                moveInApi.getAll(),
                residentApi.getAll(),
                unitApi.getAll()
            ]);

            setMoveIns(rowsFrom(moveInResponse));
            setResidents(rowsFrom(residentResponse));
            setUnits(rowsFrom(unitResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load move-ins.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return moveIns;

        return moveIns.filter((moveIn) => {
            const residentName = residents.find((resident) => resident.id === moveIn.residentId)?.displayName || residents.find((resident) => resident.id === moveIn.residentId)?.name || "";
            const unitName = units.find((unit) => unit.id === moveIn.unitId)?.unitNumber || units.find((unit) => unit.id === moveIn.unitId)?.name || "";
            const text = [moveIn.status, moveIn.occupancyType, residentName, unitName, moveIn.requestedMoveInDate].join(" ").toLowerCase();
            return text.includes(query);
        });
    }, [moveIns, residents, search, units]);

    const runWorkflowAction = async (moveIn) => {
        const actions = {
            PENDING_DOCUMENTS: ["Submit documents", () => moveInApi.submitDocuments(moveIn.id)],
            INFORMATION_REQUIRED: ["Resubmit documents", () => moveInApi.submitDocuments(moveIn.id)],
            DOCUMENTS_SUBMITTED: ["Start verification", () => moveInApi.verify(moveIn.id)],
            UNDER_VERIFICATION: ["Approve request", () => {
                const approvedBy = user?.id || user?.userId || user?.user?.id;
                if (!approvedBy) throw new Error("Your account is missing an approver ID. Sign in again and retry.");
                return moveInApi.approve(moveIn.id, approvedBy);
            }],
            APPROVED: ["Issue gate pass", () => moveInApi.issueGatePass(moveIn.id)],
            GATE_PASS_ISSUED: ["Create ledger", () => moveInApi.markLedgerCreated(moveIn.id)],
            LEDGER_CREATED: ["Activate access", () => moveInApi.activateAccess(moveIn.id)],
            ACCESS_ACTIVATED: ["Complete move-in", () => moveInApi.complete(moveIn.id)]
        };
        const next = actions[moveIn.status];
        if (!next) return;
        try {
            setSubmitting(true);
            await next[1]();
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || `Could not ${next[0].toLowerCase()}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason for this move-in:", "Rejected");
        if (reason === null) return;

        try {
            setSubmitting(true);
            await moveInApi.reject(id, reason || "Rejected");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not reject move-in.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestInformation = async (id) => {
        const informationRequest = window.prompt("What additional information or documents are required?");
        if (!informationRequest?.trim()) return;
        try {
            setSubmitting(true);
            await moveInApi.requestInformation(id, informationRequest.trim());
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not request information.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this move-in record?");
        if (!confirmed) return;

        try {
            setSubmitting(true);
            await moveInApi.delete(id);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete move-in.");
        } finally {
            setSubmitting(false);
        }
    };

    const openCreate = () => {
        setEditingMoveIn(null);
        setShowForm(true);
    };

    const openEdit = (moveIn) => {
        setEditingMoveIn(moveIn);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMoveIn(null);
    };

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

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> MOVE-IN APPLICATIONS</div>
                    <h1>Move-Ins</h1>
                    <p>Monitor resident move-in applications, verification, approval and access activation.</p>
                </div>
                <button className="society-add-button" onClick={openCreate}>
                    <Plus size={18} /> Add move-in
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><ArrowDownLeft size={19} /></span>
                    <div><span className="society-stat-label">Total move-ins</span><strong>{loading ? "—" : moveIns.length}</strong></div>
                    <span className="society-stat-note">Across all societies</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Approved</span><strong>{loading ? "—" : moveIns.filter((item) => item.status === "APPROVED").length}</strong></div>
                    <span className="society-stat-note">Ready for activation</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Verification</span><strong>{loading ? "—" : moveIns.filter((item) => item.status === "UNDER_VERIFICATION").length}</strong></div>
                    <span className="society-stat-note">Pending review</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Move-in requests</h2><p>Review requests, approvals, gate pass status and next steps.</p></div>
                    <span className="society-count">{filtered.length} entries</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search move-ins" placeholder="Search resident, unit or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                    <button className="society-refresh-button" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading move-ins...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty"><h3>No move-ins found</h3><p>{search ? "Try another search." : "No move-in applications recorded yet."}</p></div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Unit</th>
                                    <th>Type</th>
                                    <th>Requested date</th>
                                            <th>Status</th>
                                            <th>Move-in pass</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((moveIn) => {
                                    const resident = residents.find((item) => item.id === moveIn.residentId);
                                    const unit = units.find((item) => item.id === moveIn.unitId);

                                    return (
                                        <tr key={moveIn.id}>
                                            <td>
                                                <div className="society-name-cell">
                                                    <span className="society-avatar"><CheckCircle2 size={18} /></span>
                                                    <span>
                                                        <strong>{resident?.displayName || resident?.name || "Resident"}</strong>
                                                        <small>{moveIn.occupancyType || "OWNER"}</small>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{unit?.unitNumber || unit?.name || moveIn.unitId}</td>
                                            <td>{moveIn.occupancyType || "OWNER"}</td>
                                            <td>{moveIn.requestedMoveInDate || "—"}</td>
                                            <td><span className={`moveinout-status moveinout-status-${statusTone(moveIn.status)}`}>{moveIn.status || "PENDING_DOCUMENTS"}</span></td>
                                            <td>{moveIn.gatePassCode || "—"}</td>
                                            <td>
                                                <div className="society-row-actions moveinout-actions">
                                                    <button className="society-icon-action" title="Edit move-in" aria-label={`Edit ${moveIn.id}`} onClick={() => openEdit(moveIn)}><Edit size={16} /></button>
                                                    {moveIn.status === "UNDER_VERIFICATION" && <button className="society-icon-action society-delete-action" title="Reject move-in" aria-label={`Reject ${moveIn.id}`} onClick={() => handleReject(moveIn.id)} disabled={submitting}><XCircle size={16} /></button>}
                                                    {moveIn.status === "UNDER_VERIFICATION" && <button className="moveinout-text-action" title="Request information" onClick={() => handleRequestInformation(moveIn.id)} disabled={submitting}>Request info</button>}
                                                    {!["COMPLETED", "REJECTED", "CANCELLED"].includes(moveIn.status) && <button className="society-workflow-action" onClick={() => runWorkflowAction(moveIn)} disabled={submitting}>{moveIn.status === "UNDER_VERIFICATION" ? "Approve" : ({ PENDING_DOCUMENTS: "Submit docs", DOCUMENTS_SUBMITTED: "Verify", APPROVED: "Issue pass", GATE_PASS_ISSUED: "Create ledger", LEDGER_CREATED: "Activate access", ACCESS_ACTIVATED: "Complete" }[moveIn.status] || "Continue")}</button>}
                                                    {moveIn.status === "PENDING_DOCUMENTS" && <button className="society-icon-action society-delete-action" title="Delete move-in" aria-label={`Delete ${moveIn.id}`} onClick={() => handleDelete(moveIn.id)} disabled={submitting}><Trash2 size={16} /></button>}
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

            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><MoveInForm key={editingMoveIn?.id || "new-move-in"} moveIn={editingMoveIn} onClose={closeForm} onSuccess={async () => { closeForm(); await loadData(); }} /></div>}
        </section>
    );
};

export default MoveInListPage;
