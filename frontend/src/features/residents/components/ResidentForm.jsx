import { useEffect, useState } from "react";
import { X } from "lucide-react";

import societyApi from "../../societies/api/society.api";
import residentApi from "../api/resident.api";

const RESIDENT_ROLES = [
    ["PRIMARY_OWNER", "Primary owner"],
    ["CO_OWNER", "Co-owner"],
    ["TENANT", "Tenant"],
    ["FAMILY_MEMBER", "Family member"],
    ["PROPERTY_MANAGER", "Property manager"]
];

const RESIDENT_STATUSES = [
    ["PENDING", "Pending"],
    ["ACTIVE", "Active"],
    ["SUSPENDED", "Suspended"],
    ["BLACKLISTED", "Blacklisted"],
    ["ARCHIVED", "Archived"]
];

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.societies;
    return Array.isArray(rows) ? rows : [];
};

const initialValues = (resident) => ({
    societyId: resident?.societyId || "",
    firstName: resident?.firstName || "",
    middleName: resident?.middleName || "",
    lastName: resident?.lastName || "",
    email: resident?.email || "",
    mobile: resident?.mobile || "",
    alternateMobile: resident?.alternateMobile || "",
    emergencyContactName: resident?.emergencyContactName || "",
    emergencyContactMobile: resident?.emergencyContactMobile || "",
    emergencyContactRelation: resident?.emergencyContactRelation || "",
    role: resident?.role || "",
    status: resident?.status || "PENDING",
    directoryPhoneVisible: Boolean(resident?.directoryPhoneVisible),
    remarks: resident?.remarks || ""
});

const ResidentForm = ({ resident, onClose, onSuccess }) => {
    const [values, setValues] = useState(() => initialValues(resident));
    const [societies, setSocieties] = useState([]);
    const [loadingSocieties, setLoadingSocieties] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        societyApi.getAll()
            .then((response) => {
                if (isMounted) setSocieties(rowsFrom(response));
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.response?.data?.message || "Could not load societies. Please try again.");
                }
            })
            .finally(() => {
                if (isMounted) setLoadingSocieties(false);
            });

        return () => { isMounted = false; };
    }, []);

    const update = (event) => {
        const { name, value, type, checked } = event.target;
        setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        const payload = {
            ...values,
            firstName: values.firstName.trim(),
            middleName: values.middleName.trim() || null,
            lastName: values.lastName.trim(),
            mobile: values.mobile.trim(),
            email: values.email.trim() || null,
            alternateMobile: values.alternateMobile.trim() || null,
            emergencyContactName: values.emergencyContactName.trim() || null,
            emergencyContactMobile: values.emergencyContactMobile.trim() || null,
            emergencyContactRelation: values.emergencyContactRelation.trim() || null,
            remarks: values.remarks.trim() || null
        };

        try {
            setSaving(true);
            if (resident?.id) await residentApi.update(resident.id, payload);
            else await residentApi.create(payload);
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save resident. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="resident-form-title">
            <header className="society-form-header">
                <div>
                    <h2 id="resident-form-title">{resident ? "Edit resident" : "Add resident"}</h2>
                    <p>{resident ? "Update this resident’s contact and directory details." : "Add a resident and their contact details to a society."}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close form">
                    <X size={20} />
                </button>
            </header>

            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}

                    <section className="form-section">
                        <header className="form-section-title"><h3>Resident information</h3><span>Fields marked with * are required</span></header>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="resident-society">Society<span className="required">*</span></label>
                                {resident ? (
                                    <input id="resident-society" value={societies.find((item) => item.id === resident.societyId)?.name || "Selected society"} disabled />
                                ) : (
                                    <select id="resident-society" name="societyId" value={values.societyId} onChange={update} required disabled={loadingSocieties || societies.length === 0}>
                                        <option value="">{loadingSocieties ? "Loading societies…" : "Select a society"}</option>
                                        {societies.map((society) => <option key={society.id} value={society.id}>{society.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="resident-first-name">First name<span className="required">*</span></label><input id="resident-first-name" name="firstName" value={values.firstName} onChange={update} maxLength={100} autoComplete="given-name" required /></div>
                            <div className="form-group"><label htmlFor="resident-middle-name">Middle name</label><input id="resident-middle-name" name="middleName" value={values.middleName} onChange={update} maxLength={100} /></div>
                            <div className="form-group"><label htmlFor="resident-last-name">Last name<span className="required">*</span></label><input id="resident-last-name" name="lastName" value={values.lastName} onChange={update} maxLength={100} autoComplete="family-name" required /></div>
                            <div className="form-group"><label htmlFor="resident-role">Resident role<span className="required">*</span></label><select id="resident-role" name="role" value={values.role} onChange={update} required><option value="">Select a role</option>{RESIDENT_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                            <div className="form-group"><label htmlFor="resident-status">Status</label><select id="resident-status" name="status" value={values.status} onChange={update}>{RESIDENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                        </div>
                    </section>

                    <section className="form-section">
                        <header className="form-section-title"><h3>Contact details</h3><span>Used for resident communication</span></header>
                        <div className="form-grid">
                            <div className="form-group"><label htmlFor="resident-mobile">Mobile number<span className="required">*</span></label><input id="resident-mobile" name="mobile" type="tel" value={values.mobile} onChange={update} maxLength={20} autoComplete="tel" required /></div>
                            <div className="form-group"><label htmlFor="resident-alternate-mobile">Alternate mobile</label><input id="resident-alternate-mobile" name="alternateMobile" type="tel" value={values.alternateMobile} onChange={update} maxLength={20} /></div>
                            <div className="form-group form-group-full"><label htmlFor="resident-email">Email</label><input id="resident-email" name="email" type="email" value={values.email} onChange={update} maxLength={255} autoComplete="email" /></div>
                        </div>
                    </section>

                    <section className="form-section">
                        <header className="form-section-title"><h3>Emergency contact</h3><span>Optional contact for urgent situations</span></header>
                        <div className="form-grid">
                            <div className="form-group"><label htmlFor="resident-emergency-name">Contact name</label><input id="resident-emergency-name" name="emergencyContactName" value={values.emergencyContactName} onChange={update} maxLength={255} /></div>
                            <div className="form-group"><label htmlFor="resident-emergency-mobile">Contact mobile</label><input id="resident-emergency-mobile" name="emergencyContactMobile" type="tel" value={values.emergencyContactMobile} onChange={update} maxLength={20} /></div>
                            <div className="form-group"><label htmlFor="resident-emergency-relation">Relationship</label><input id="resident-emergency-relation" name="emergencyContactRelation" value={values.emergencyContactRelation} onChange={update} maxLength={100} placeholder="e.g. Spouse" /></div>
                            <div className="form-group form-group-full"><label htmlFor="resident-remarks">Notes</label><textarea id="resident-remarks" name="remarks" value={values.remarks} onChange={update} rows="3" placeholder="Optional notes" /></div>
                        </div>
                        <label className="resident-visibility-option">
                            <input type="checkbox" name="directoryPhoneVisible" checked={values.directoryPhoneVisible} onChange={update} />
                            <span>Show this resident’s phone number in the society directory</span>
                        </label>
                    </section>
                </div>

                <footer className="society-form-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving || loadingSocieties || (!resident && societies.length === 0)}>{saving ? "Saving…" : resident ? "Save changes" : "Add resident"}</button>
                </footer>
            </form>
        </section>
    );
};

export default ResidentForm;
