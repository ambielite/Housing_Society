import { useEffect, useState } from "react";
import { X } from "lucide-react";

import agreementApi from "../api/agreement.api";
import societyApi from "../../societies/api/society.api";
import unitApi from "../../units/api/unit.api";
import residentApi from "../../residents/api/resident.api";
import { openMoveInDocument } from "../utils/openMoveInDocument";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};

const initialValues = (agreement) => ({
    societyId: agreement?.societyId || "",
    unitId: agreement?.unitId || "",
    ownerId: agreement?.ownerId || "",
    tenantId: agreement?.tenantId || "",
    agreementReference: agreement?.agreementReference || "",
    agreementType: agreement?.agreementType || "RENTAL",
    startDate: agreement?.startDate ? String(agreement.startDate).slice(0, 10) : "",
    expiryDate: agreement?.expiryDate ? String(agreement.expiryDate).slice(0, 10) : "",
    duration: agreement?.duration ?? "",
    agreementDocument: agreement?.agreementDocument || "",
    signedAgreementCopy: agreement?.signedAgreementCopy || "",
    uploadedAt: agreement?.uploadedAt ? String(agreement.uploadedAt).slice(0, 10) : "",
    signedAt: agreement?.signedAt ? String(agreement.signedAt).slice(0, 10) : "",
    remarks: agreement?.remarks || ""
});

const AgreementForm = ({ agreement, onClose, onSuccess }) => {
    const [values, setValues] = useState(() => initialValues(agreement));
    const [societies, setSocieties] = useState([]);
    const [units, setUnits] = useState([]);
    const [residents, setResidents] = useState([]);
    const [documents, setDocuments] = useState({ agreementDocument: null, signedAgreementCopy: null });
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
                    setError(err.response?.data?.message || "Could not load agreement form options.");
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

    const viewDocument = async (documentPath) => {
        try {
            await openMoveInDocument(documentPath);
        } catch (documentError) {
            setError(documentError.response?.data?.message || documentError.message || "Could not open the document.");
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!values.societyId || !values.unitId || !values.agreementReference || !values.agreementType || !values.startDate || !values.expiryDate) {
            setError("Society, unit, agreement reference, type, start date and expiry date are required.");
            return;
        }

        if (new Date(values.startDate) >= new Date(values.expiryDate)) {
            setError("Expiry date must be after start date.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...values,
                ownerId: values.ownerId || null,
                tenantId: values.tenantId || null,
                duration: values.duration === "" ? null : Number(values.duration),
                uploadedAt: values.uploadedAt || null,
                signedAt: values.signedAt || null,
                remarks: values.remarks.trim() || null
            };

            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (key === "agreementDocument" || key === "signedAgreementCopy") return;
                formData.append(key, value == null ? "" : String(value));
            });
            if (documents.agreementDocument) formData.append("agreementDocument", documents.agreementDocument);
            if (documents.signedAgreementCopy) formData.append("signedAgreementCopy", documents.signedAgreementCopy);

            if (agreement?.id) await agreementApi.update(agreement.id, formData);
            else await agreementApi.create(formData);
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not create agreement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="agreement-form-title">
            <header className="society-form-header">
                <div>
                    <h2 id="agreement-form-title">{agreement ? "Edit agreement" : "Add agreement"}</h2>
                    <p>{agreement ? "Update this agreement record." : "Record a rental, lease or tenancy agreement for the selected unit."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </header>

            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}

                    <section className="form-section">
                        <header className="form-section-title"><h3>Agreement details</h3><span>Required fields are marked *</span></header>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="agreement-society">Society<span className="required">*</span></label>
                                <select id="agreement-society" name="societyId" value={values.societyId} onChange={updateField} required disabled={loading || societies.length === 0}>
                                    <option value="">{loading ? "Loading societies…" : "Select a society"}</option>
                                    {societies.map((society) => (
                                        <option key={society.id} value={society.id}>{society.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-unit">Unit<span className="required">*</span></label>
                                <select id="agreement-unit" name="unitId" value={values.unitId} onChange={updateField} required disabled={loading || units.length === 0}>
                                    <option value="">{loading ? "Loading units…" : "Select a unit"}</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>{unit.unitNumber || unit.name || unit.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-reference">Agreement reference<span className="required">*</span></label>
                                <input id="agreement-reference" name="agreementReference" type="text" value={values.agreementReference} onChange={updateField} placeholder="AG-2026-001" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-type">Agreement type<span className="required">*</span></label>
                                <select id="agreement-type" name="agreementType" value={values.agreementType} onChange={updateField} required>
                                    <option value="RENTAL">RENTAL</option>
                                    <option value="LEASE">LEASE</option>
                                    <option value="TENANCY">TENANCY</option>
                                    <option value="LEAVE_AND_LICENSE">LEAVE_AND_LICENSE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-owner">Owner</label>
                                <select id="agreement-owner" name="ownerId" value={values.ownerId} onChange={updateField}>
                                    <option value="">Select an owner (optional)</option>
                                    {residents.map((resident) => (
                                        <option key={`${resident.id}-owner`} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || resident.name || resident.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-tenant">Tenant</label>
                                <select id="agreement-tenant" name="tenantId" value={values.tenantId} onChange={updateField}>
                                    <option value="">Select a tenant (optional)</option>
                                    {residents.map((resident) => (
                                        <option key={`${resident.id}-tenant`} value={resident.id}>{resident.displayName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || resident.name || resident.id}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-start-date">Start date<span className="required">*</span></label>
                                <input id="agreement-start-date" type="date" name="startDate" value={values.startDate} onChange={updateField} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-expiry-date">Expiry date<span className="required">*</span></label>
                                <input id="agreement-expiry-date" type="date" name="expiryDate" value={values.expiryDate} onChange={updateField} required />
                            </div>

                            <div className="form-group form-group-full">
                                <label htmlFor="agreement-duration">Duration (months)</label>
                                <input id="agreement-duration" type="number" name="duration" min="1" value={values.duration} onChange={updateField} placeholder="Optional duration in months" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="agreement-document">Agreement document</label>
                                <input id="agreement-document" name="agreementDocument" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={updateDocument} />
                                {values.agreementDocument && <small>Current file: <button type="button" className="btn-link" onClick={() => viewDocument(values.agreementDocument)}>View document</button></small>}
                            </div>
                            <div className="form-group"><label htmlFor="agreement-uploaded-at">Uploaded date</label><input id="agreement-uploaded-at" type="date" name="uploadedAt" value={values.uploadedAt} onChange={updateField} /></div>
                            <div className="form-group">
                                <label htmlFor="agreement-signed-copy">Signed agreement copy</label>
                                <input id="agreement-signed-copy" name="signedAgreementCopy" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={updateDocument} />
                                {values.signedAgreementCopy && <small>Current file: <button type="button" className="btn-link" onClick={() => viewDocument(values.signedAgreementCopy)}>View signed copy</button></small>}
                            </div>
                            <div className="form-group"><label htmlFor="agreement-signed-at">Signed date</label><input id="agreement-signed-at" type="date" name="signedAt" value={values.signedAt} onChange={updateField} /></div>

                            <div className="form-group form-group-full">
                                <label htmlFor="agreement-remarks">Remarks</label>
                                <textarea id="agreement-remarks" name="remarks" value={values.remarks} onChange={updateField} rows="4" placeholder="Optional agreement notes or clauses" />
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving || loading}>{saving ? "Saving…" : (agreement ? "Update agreement" : "Create agreement")}</button>
                </footer>
            </form>
        </section>
    );
};

export default AgreementForm;
