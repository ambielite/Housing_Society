import { useEffect, useState } from "react";
import { X } from "lucide-react";

import moveOutApi from "../api/moveOut.api";
import societyApi from "../../societies/api/society.api";
import unitApi from "../../units/api/unit.api";
import residentApi from "../../residents/api/resident.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const initialValues = (moveOut = null) => ({
    societyId: moveOut?.societyId || "",
    unitId: moveOut?.unitId || "",
    residentId: moveOut?.residentId || "",
    requestedMoveOutDate: moveOut?.requestedMoveOutDate ? String(moveOut.requestedMoveOutDate).slice(0, 10) : "",
    effectiveMoveOutDate: moveOut?.effectiveMoveOutDate ? String(moveOut.effectiveMoveOutDate).slice(0, 10) : "",
    configuredCharges: moveOut?.configuredCharges ?? 0,
    revertBillingToOwner: moveOut?.revertBillingToOwner !== false,
    checklistTasksText: Array.isArray(moveOut?.checklistTasks) ? moveOut.checklistTasks.map((task) => `${task.mandatory ? "!" : "?"}${task.completed ? "[x] " : ""}${task.label || task.name || ""}`).join("\n") : "",
    remarks: moveOut?.remarks || ""
});

const MoveOutForm = ({ moveOut, onClose, onSuccess }) => {
    const [values, setValues] = useState(() => initialValues(moveOut));
    const [societies, setSocieties] = useState([]);
    const [units, setUnits] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadOptions = async () => {
            try {
                const [societyResponse, unitResponse, residentResponse] = await Promise.all([
                    societyApi.getAll(),
                    unitApi.getAll(),
                    residentApi.getAll()
                ]);

                if (!isMounted) return;

                setSocieties(rowsFrom(societyResponse));
                setUnits(rowsFrom(unitResponse));
                setResidents(rowsFrom(residentResponse));
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Could not load move-out form options.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const updateField = (event) => {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!values.societyId || !values.unitId || !values.residentId || !values.requestedMoveOutDate) {
            setError("Society, unit, resident and requested move-out date are required.");
            return;
        }

        try {
            setSaving(true);
            const checklistTasks = values.checklistTasksText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => ({
                label: line.slice(1).replace(/^\[x\]\s*/i, "").trim(),
                mandatory: line.startsWith("!"),
                completed: /^\[x\]/i.test(line.slice(1)) || moveOut?.checklistTasks?.find((task) => (task.label || task.name) === line.slice(1).replace(/^\[x\]\s*/i, "").trim())?.completed || false
            }));
            const payload = {
                ...values,
                checklistTasks,
                checklistTasksText: undefined,
                remarks: values.remarks.trim() || null
            };

            if (moveOut?.id) {
                await moveOutApi.update(moveOut.id, payload);
            } else {
                await moveOutApi.create(payload);
            }
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save move-out request.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="moveout-form-title">
            <header className="society-form-header">
                <div>
                    <h2 id="moveout-form-title">{moveOut ? "Edit move-out" : "Add move-out"}</h2>
                    <p>{moveOut ? "Update the resident move-out request and exit checklist details." : "Capture a resident move-out request and start the exit checklist."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </header>

            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}

                    <section className="form-section">
                        <header className="form-section-title"><h3>Move-out request</h3><span>Required fields are marked *</span></header>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="moveout-society">Society<span className="required">*</span></label>
                                <select id="moveout-society" name="societyId" value={values.societyId} onChange={updateField} required disabled={loading || societies.length === 0}>
                                    <option value="">{loading ? "Loading societies…" : "Select a society"}</option>
                                    {societies.map((society) => (
                                        <option key={society.id} value={society.id}>{society.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="moveout-unit">Unit<span className="required">*</span></label>
                                <select id="moveout-unit" name="unitId" value={values.unitId} onChange={updateField} required disabled={loading || units.length === 0}>
                                    <option value="">{loading ? "Loading units…" : "Select a unit"}</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>{unit.unitNumber || unit.name || unit.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="moveout-resident">Resident<span className="required">*</span></label>
                                <select id="moveout-resident" name="residentId" value={values.residentId} onChange={updateField} required disabled={loading || residents.length === 0}>
                                    <option value="">{loading ? "Loading residents…" : "Select a resident"}</option>
                                    {residents.map((resident) => (
                                        <option key={resident.id} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || resident.name || resident.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group form-group-full">
                                <label htmlFor="moveout-date">Requested move-out date<span className="required">*</span></label>
                                <input id="moveout-date" type="date" name="requestedMoveOutDate" value={values.requestedMoveOutDate} onChange={updateField} required />
                            </div>

                            <div className="form-group"><label htmlFor="moveout-effective-date">Effective move-out date</label><input id="moveout-effective-date" type="date" name="effectiveMoveOutDate" value={values.effectiveMoveOutDate} onChange={updateField} /></div>
                            <div className="form-group"><label htmlFor="moveout-charges">Configured move-out charges</label><input id="moveout-charges" type="number" min="0" step="0.01" name="configuredCharges" value={values.configuredCharges} onChange={updateField} /></div>
                            <div className="form-group form-group-full"><label className="form-checkbox-label"><input type="checkbox" name="revertBillingToOwner" checked={values.revertBillingToOwner} onChange={(event) => setValues((current) => ({ ...current, revertBillingToOwner: event.target.checked }))} /> <span>Revert billing responsibility to the owner on the effective date</span></label></div>

                            <div className="form-group form-group-full"><label htmlFor="moveout-checklist">Move-out checklist</label><textarea id="moveout-checklist" name="checklistTasksText" value={values.checklistTasksText} onChange={updateField} rows="4" placeholder="!Return keys (mandatory)\n?Remove nameplate (optional)" /><small>Start each task with ! for mandatory or ? for optional. Add [x] after the prefix when a task is complete.</small></div>

                            <div className="form-group form-group-full">
                                <label htmlFor="moveout-remarks">Remarks</label>
                                <textarea id="moveout-remarks" name="remarks" value={values.remarks} onChange={updateField} rows="4" placeholder="Optional remarks or exit notes" />
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving || loading}>{saving ? "Saving…" : (moveOut ? "Update move-out" : "Create move-out")}</button>
                </footer>
            </form>
        </section>
    );
};

export default MoveOutForm;
