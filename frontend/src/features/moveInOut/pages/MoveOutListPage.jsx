import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, SquarePen, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import moveOutApi from "../api/moveOut.api";
import residentApi from "../../residents/api/resident.api";
import unitApi from "../../units/api/unit.api";
import MoveOutForm from "../components/MoveOutForm";
import { useAuth } from "../../../app/providers/useAuth";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const statusTone = (status) => ["COMPLETED", "APPROVED", "ACCESS_REVOKED"].includes(status) ? "success" : ["REJECTED", "CANCELLED"].includes(status) ? "danger" : ["REQUESTED", "CHECKLIST_PENDING", "DUES_PENDING", "FINANCIAL_CLEARANCE_PENDING", "UNDER_VERIFICATION"].includes(status) ? "pending" : "neutral";

const MoveOutListPage = () => {
    const [moveOuts, setMoveOuts] = useState([]);
    const [residents, setResidents] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [editingMoveOut, setEditingMoveOut] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [moveOutResponse, residentResponse, unitResponse] = await Promise.all([
                moveOutApi.getAll(),
                residentApi.getAll(),
                unitApi.getAll()
            ]);

            setMoveOuts(rowsFrom(moveOutResponse));
            setResidents(rowsFrom(residentResponse));
            setUnits(rowsFrom(unitResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load move-outs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return moveOuts;

        return moveOuts.filter((moveOut) => {
            const residentName = residents.find((resident) => resident.id === moveOut.residentId)?.displayName || residents.find((resident) => resident.id === moveOut.residentId)?.name || "";
            const unitName = units.find((unit) => unit.id === moveOut.unitId)?.unitNumber || units.find((unit) => unit.id === moveOut.unitId)?.name || "";
            const text = [moveOut.status, residentName, unitName, moveOut.requestedMoveOutDate, moveOut.financialClearanceStatus].join(" ").toLowerCase();
            return text.includes(query);
        });
    }, [moveOuts, residents, search, units]);

    const runWorkflowAction = async (moveOut) => {
        const actions = {
            REQUESTED: ["Start checklist", () => moveOutApi.startChecklist(moveOut.id)],
            CHECKLIST_PENDING: ["Complete checklist", () => moveOutApi.completeChecklist(moveOut.id)],
            DUES_PENDING: ["Update outstanding dues", async () => {
                const enteredAmount = window.prompt("Enter outstanding dues amount:", String(moveOut.outstandingAmount ?? 0));
                if (enteredAmount === null) return false;
                const amount = Number(enteredAmount);
                if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid non-negative dues amount.");
                const enteredChargesPaid = window.prompt(`Configured charges: ${moveOut.configuredCharges ?? 0}. Enter amount paid:`, String(moveOut.chargesPaid ?? 0));
                if (enteredChargesPaid === null) return false;
                const chargesPaid = Number(enteredChargesPaid);
                if (!Number.isFinite(chargesPaid) || chargesPaid < 0) throw new Error("Enter a valid non-negative charges paid amount.");
                await moveOutApi.updateOutstandingDues(moveOut.id, { outstandingAmount: amount, chargesPaid });
                return true;
            }],
            FINANCIAL_CLEARANCE_PENDING: ["Submit clearance", () => moveOutApi.submitFinancialClearance(moveOut.id)],
            UNDER_VERIFICATION: ["Approve request", () => {
                const approvedBy = user?.id || user?.userId || user?.user?.id;
                if (!approvedBy) throw new Error("Your account is missing an approver ID. Sign in again and retry.");
                return moveOutApi.approve(moveOut.id, approvedBy);
            }],
            APPROVED: ["Issue move-out pass", () => moveOutApi.issueMoveOutPass(moveOut.id)],
            MOVE_OUT_PASS_ISSUED: ["Revoke access", () => moveOutApi.revokeAccess(moveOut.id)],
            ACCESS_REVOKED: ["Complete move-out", () => moveOutApi.complete(moveOut.id)]
        };
        const next = actions[moveOut.status];
        if (!next) return;
        try {
            setSubmitting(true);
            const changed = await next[1]();
            if (changed !== false) await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || `Could not ${next[0].toLowerCase()}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason for this move-out:", "Rejected");
        if (reason === null) return;

        try {
            setSubmitting(true);
            await moveOutApi.reject(id, reason || "Rejected");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not reject move-out.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this move-out record?");
        if (!confirmed) return;

        try {
            setSubmitting(true);
            await moveOutApi.delete(id);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete move-out.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        const reason = window.prompt("Reason for cancelling this move-out:", "Cancelled by administrator");
        if (reason === null) return;
        try {
            setSubmitting(true);
            await moveOutApi.cancel(id, reason);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not cancel move-out.");
        } finally {
            setSubmitting(false);
        }
    };

    const openCreate = () => {
        setEditingMoveOut(null);
        setShowForm(true);
    };

    const openEdit = (moveOut) => {
        setEditingMoveOut(moveOut);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingMoveOut(null);
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
        <section className="society-dashboard moveout-page">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> MOVE-OUT REQUESTS</div>
                    <h1>Move-Outs</h1>
                    <p>Review move-out checklists, financial clearance, approvals, and access revocation.</p>
                </div>
                <button className="society-add-button" onClick={openCreate}>
                    <Plus size={18} /> Add move-out
                </button>
            </header>

            {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}

            <div className="society-stats">
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-blue"><ArrowUpRight size={19} /></span>
                    <div><span className="society-stat-label">Total move-outs</span><strong>{loading ? "—" : moveOuts.length}</strong></div>
                    <span className="society-stat-note">Across all societies</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-green"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Cleared</span><strong>{loading ? "—" : moveOuts.filter((item) => item.financialClearanceStatus === "CLEARED").length}</strong></div>
                    <span className="society-stat-note">Financially cleared</span>
                </article>
                <article className="society-stat-card">
                    <span className="society-stat-icon society-stat-icon-violet"><CheckCircle2 size={19} /></span>
                    <div><span className="society-stat-label">Pending review</span><strong>{loading ? "—" : moveOuts.filter((item) => item.status === "UNDER_VERIFICATION").length}</strong></div>
                    <span className="society-stat-note">Awaiting approval</span>
                </article>
            </div>

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Move-out requests</h2><p>Review checklist completion, dues, clearance, and gate pass issuance.</p></div>
                    <span className="society-count">{filtered.length} entries</span>
                </div>

                <div className="society-toolbar">
                    <label className="society-search">
                        <Search size={17} />
                        <input aria-label="Search move-outs" placeholder="Search resident, unit, status or clearance..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                    <button className="society-refresh-button" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? "society-spinning" : ""} /> Refresh</button>
                </div>

                {loading ? (
                    <div className="society-loading"><span className="society-loader" />Loading move-outs...</div>
                ) : filtered.length === 0 ? (
                    <div className="society-empty"><h3>No move-outs found</h3><p>{search ? "Try another search." : "No move-out requests recorded yet."}</p></div>
                ) : (
                    <div className="society-table-wrap">
                        <table className="society-table">
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Unit</th>
                                    <th>Requested date</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Move-out pass</th>
                                    <th className="society-actions-heading">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((moveOut) => {
                                    const resident = residents.find((item) => item.id === moveOut.residentId);
                                    const unit = units.find((item) => item.id === moveOut.unitId);

                                    return (
                                        <tr key={moveOut.id}>
                                            <td>
                                                <div className="society-name-cell">
                                                    <span className="society-avatar"><ArrowUpRight size={18} /></span>
                                                    <span>
                                                        <strong>{resident?.displayName || resident?.name || "Resident"}</strong>
                                                        <small>{moveOut.financialClearanceStatus || "PENDING"}</small>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{unit?.unitNumber || unit?.name || moveOut.unitId}</td>
                                            <td>{moveOut.effectiveMoveOutDate || moveOut.requestedMoveOutDate || "—"}</td>
                                            <td>{moveOut.outstandingAmount ?? 0}</td>
                                            <td><span className={`moveinout-status moveinout-status-${statusTone(moveOut.status)}`}>{moveOut.status || "REQUESTED"}</span></td>
                                            <td>{moveOut.gatePassCode || "—"}</td>
                                            <td>
                                                <div className="society-row-actions moveinout-actions">
                                                    <button className="society-icon-action" title="Edit move-out" aria-label={`Edit ${moveOut.id}`} onClick={() => openEdit(moveOut)}><SquarePen size={16} /></button>
                                                    {moveOut.status === "UNDER_VERIFICATION" && <button className="society-icon-action society-delete-action" title="Reject move-out" aria-label={`Reject ${moveOut.id}`} onClick={() => handleReject(moveOut.id)} disabled={submitting}><XCircle size={16} /></button>}
                                                    {!['COMPLETED', 'REJECTED', 'CANCELLED', 'ACCESS_REVOKED'].includes(moveOut.status) && <button className="moveinout-text-action moveinout-cancel-action" title="Cancel move-out" aria-label={`Cancel ${moveOut.id}`} onClick={() => handleCancel(moveOut.id)} disabled={submitting}>Cancel</button>}
                                                    {!["COMPLETED", "REJECTED", "CANCELLED"].includes(moveOut.status) && <button className="society-workflow-action" onClick={() => runWorkflowAction(moveOut)} disabled={submitting}>{({ REQUESTED: "Start checklist", CHECKLIST_PENDING: "Complete checklist", DUES_PENDING: "Update dues", FINANCIAL_CLEARANCE_PENDING: "Submit clearance", UNDER_VERIFICATION: "Approve", APPROVED: "Issue pass", MOVE_OUT_PASS_ISSUED: "Revoke access", ACCESS_REVOKED: "Complete" }[moveOut.status] || "Continue")}</button>}
                                                    {moveOut.status === "REQUESTED" && <button className="society-icon-action society-delete-action" title="Delete move-out" aria-label={`Delete ${moveOut.id}`} onClick={() => handleDelete(moveOut.id)} disabled={submitting}><Trash2 size={16} /></button>}
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

            {showForm && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><MoveOutForm key={editingMoveOut?.id || "new-move-out"} moveOut={editingMoveOut} onClose={closeForm} onSuccess={async () => { closeForm(); await loadData(); }} /></div>}
        </section>
    );
};

export default MoveOutListPage;
