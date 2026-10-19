import { useEffect, useState } from "react";
import { X } from "lucide-react";

import moveInApi from "../api/moveIn.api";
import agreementApi from "../api/agreement.api";
import societyApi from "../../societies/api/society.api";
import unitApi from "../../units/api/unit.api";
import residentApi from "../../residents/api/resident.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const initialValues = (moveIn = null) => ({
    societyId: moveIn?.societyId || "",
    unitId: moveIn?.unitId || "",
    residentId: moveIn?.residentId || "",
    occupancyType: moveIn?.occupancyType || "TENANT",
    requestedMoveInDate: moveIn?.requestedMoveInDate ? String(moveIn.requestedMoveInDate).slice(0, 10) : "",
    agreementId: moveIn?.agreementId || "",
    remarks: moveIn?.remarks || ""
});

const documentBaseUrl = (import.meta.env.VITE_LEGACY_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api(?:\/v1)?\/?$/, "");
const documentHref = (path) => /^https?:\/\//i.test(path) ? path : `${documentBaseUrl}${path}`;

const MoveInForm = ({ moveIn, onClose, onSuccess }) => {
    const [values, setValues] = useState(() => initialValues(moveIn));
    const [societies, setSocieties] = useState([]);
    const [units, setUnits] = useState([]);
    const [residents, setResidents] = useState([]);
    const [agreements, setAgreements] = useState([]);
    const [documents, setDocuments] = useState({ leaseDocument: null, registryDocument: null, policeVerificationDocument: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadOptions = async () => {
            try {
                const [societyResponse, unitResponse, residentResponse, agreementResponse] = await Promise.all([
                    societyApi.getAll(),
                    unitApi.getAll(),
                    residentApi.getAll(),
                    agreementApi.getAll()
                ]);

                if (!isMounted) return;

                setSocieties(rowsFrom(societyResponse));
                setUnits(rowsFrom(unitResponse));
                setResidents(rowsFrom(residentResponse));
                setAgreements(rowsFrom(agreementResponse));
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Could not load move-in form options.");
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

    const updateDocument = (event) => {
        const { name, files: selectedFiles } = event.target;
        setDocuments((current) => ({ ...current, [name]: selectedFiles?.[0] || null }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!values.societyId || !values.unitId || !values.residentId || !values.requestedMoveInDate) {
            setError("Society, unit, resident and requested move-in date are required.");
            return;
        }

        if (!['OWNER', 'TENANT'].includes(values.occupancyType)) {
            setError("Occupancy type must be OWNER or TENANT.");
            return;
        }

        try {
            setSaving(true);
            const payload = new FormData();
            Object.entries({ ...values, remarks: values.remarks.trim() }).forEach(([key, value]) => {
                if (value !== undefined && value !== null) payload.append(key, String(value));
            });
            Object.entries(documents).forEach(([key, file]) => {
                if (file) payload.append(key, file);
            });

            if (moveIn?.id) {
                await moveInApi.update(moveIn.id, payload);
            } else {
                await moveInApi.create(payload);
            }
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save move-in request.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="movein-form-title">
            <header className="society-form-header">
                <div>
                    <h2 id="movein-form-title">{moveIn ? "Edit move-in" : "Add move-in"}</h2>
                    <p>{moveIn ? "Update the resident move-in request and its occupancy details." : "Capture a resident move-in request and required occupancy details."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </header>

            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}

                    <section className="form-section">
                        <header className="form-section-title"><h3>Move-in request</h3><span>Required fields are marked *</span></header>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="movein-society">Society<span className="required">*</span></label>
                                <select id="movein-society" name="societyId" value={values.societyId} onChange={updateField} required disabled={loading || societies.length === 0}>
                                    <option value="">{loading ? "Loading societies…" : "Select a society"}</option>
                                    {societies.map((society) => (
                                        <option key={society.id} value={society.id}>{society.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="movein-unit">Unit<span className="required">*</span></label>
                                <select id="movein-unit" name="unitId" value={values.unitId} onChange={updateField} required disabled={loading || units.length === 0}>
                                    <option value="">{loading ? "Loading units…" : "Select a unit"}</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>{unit.unitNumber || unit.name || unit.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="movein-resident">Resident<span className="required">*</span></label>
                                <select id="movein-resident" name="residentId" value={values.residentId} onChange={updateField} required disabled={loading || residents.length === 0}>
                                    <option value="">{loading ? "Loading residents…" : "Select a resident"}</option>
                                    {residents.map((resident) => (
                                        <option key={resident.id} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || resident.name || resident.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="movein-occupancy">Occupancy type<span className="required">*</span></label>
                                <select id="movein-occupancy" name="occupancyType" value={values.occupancyType} onChange={updateField} required>
                                    <option value="OWNER">OWNER</option>
                                    <option value="TENANT">TENANT</option>
                                </select>
                            </div>

                            <div className="form-group form-group-full">
                                <label htmlFor="movein-date">Requested move-in date<span className="required">*</span></label>
                                <input id="movein-date" type="date" name="requestedMoveInDate" value={values.requestedMoveInDate} onChange={updateField} required />
                            </div>

                            {values.occupancyType === "TENANT" && <>
                                <div className="form-group form-group-full">
                                    <label htmlFor="movein-agreement">Agreement</label>
                                    <select id="movein-agreement" name="agreementId" value={values.agreementId} onChange={updateField} disabled={loading}>
                                        <option value="">No agreement selected</option>
                                        {agreements.filter((agreement) => !values.unitId || agreement.unitId === values.unitId).map((agreement) => (
                                            <option key={agreement.id} value={agreement.id}>{agreement.agreementReference || agreement.id}</option>
                                        ))}
                                    </select>
                                </div>
                                {[["leaseDocument", "Lease / signed agreement document", moveIn?.leaseDocument], ["registryDocument", "Registry document", moveIn?.registryDocument], ["policeVerificationDocument", "Police verification document", moveIn?.policeVerificationDocument]].map(([field, label, existingPath]) => <div className={`form-group${field === "policeVerificationDocument" ? " form-group-full" : ""}`} key={field}>
                                    <label htmlFor={`movein-${field}`}>{label}</label>
                                    {existingPath && <small className="field-hint">Current file: <a href={documentHref(existingPath)} target="_blank" rel="noreferrer">View uploaded document</a></small>}
                                    <input id={`movein-${field}`} name={field} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/png,image/jpeg" onChange={updateDocument} />
                                    {documents[field] && <small className="field-hint">Selected: {documents[field].name}</small>}
                                </div>)}
                            </>}

                            <div className="form-group form-group-full">
                                <label htmlFor="movein-remarks">Remarks</label>
                                <textarea id="movein-remarks" name="remarks" value={values.remarks} onChange={updateField} rows="4" placeholder="Optional remarks or notes for document review" />
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving || loading}>{saving ? "Saving…" : (moveIn ? "Update move-in" : "Create move-in")}</button>
                </footer>
            </form>
        </section>
    );
};

export default MoveInForm;
