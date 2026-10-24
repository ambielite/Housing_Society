import { useEffect, useState } from "react";
import { Camera, X } from "lucide-react";

import societyApi from "../../societies/api/society.api";
import towerApi from "../../towers/api/tower.api";
import floorApi from "../../floors/api/floor.api";
import unitApi from "../../units/api/unit.api";
import ownerUnitApi from "../api/ownerUnit.api";
import residentApi from "../api/resident.api";
import occupancyApi from "../api/occupancy.api";

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

const unitRowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.units;
    return Array.isArray(rows) ? rows : [];
};

const initialValues = (resident) => ({
    societyId: resident?.societyId || "",
    towerId: "",
    unitId: "",
    firstName: resident?.firstName || "",
    middleName: resident?.middleName || "",
    lastName: resident?.lastName || "",
    dateOfBirth: resident?.dateOfBirth || "",
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

const normalizeName = (value) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const profileImageUrl = (url) => !url || /^https?:\/\//i.test(url) ? url : `${new URL(import.meta.env.VITE_LEGACY_API_BASE_URL || "http://localhost:5000/api", window.location.origin).origin}${url}`;

const ResidentForm = ({ resident, residents = [], onClose, onSuccess }) => {
    const [values, setValues] = useState(() => initialValues(resident));
    const [societies, setSocieties] = useState([]);
    const [towers, setTowers] = useState([]);
    const [towerFloors, setTowerFloors] = useState([]);
    const [units, setUnits] = useState([]);
    const [loadingSocieties, setLoadingSocieties] = useState(true);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [loadingTowers, setLoadingTowers] = useState(false);
    const [loadingTowerFloors, setLoadingTowerFloors] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [createdResidentId, setCreatedResidentId] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [picturePreview, setPicturePreview] = useState(profileImageUrl(resident?.profilePhoto));

    useEffect(() => {
        if (!profilePicture) return;
        const preview = URL.createObjectURL(profilePicture);
        setPicturePreview(preview);
        return () => URL.revokeObjectURL(preview);
    }, [profilePicture]);

    useEffect(() => {
        if (!profilePicture) setPicturePreview(profileImageUrl(resident?.profilePhoto));
    }, [profilePicture, resident?.profilePhoto]);

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

    useEffect(() => {
        let isMounted = true;
        setUnits([]);
        setTowers([]);
        setTowerFloors([]);
        if (!values.societyId) {
            setLoadingUnits(false);
            setLoadingTowers(false);
            return () => { isMounted = false; };
        }

        setLoadingUnits(true);
        setLoadingTowers(true);
        const societyConfig = { headers: { "x-society-id": values.societyId } };
        Promise.all([
            unitApi.getAll(societyConfig),
            towerApi.getBySociety(values.societyId, societyConfig)
        ])
            .then(([unitResponse, towerResponse]) => {
                if (!isMounted) return;
                setUnits(unitRowsFrom(unitResponse));
                setTowers(rowsFrom(towerResponse));
            })
            .catch((err) => {
                if (isMounted) setError(err.response?.data?.message || "Could not load towers and units for this society.");
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingUnits(false);
                    setLoadingTowers(false);
                }
            });

        return () => { isMounted = false; };
    }, [values.societyId]);

    useEffect(() => {
        let isMounted = true;
        setTowerFloors([]);
        if (!values.towerId) {
            setLoadingTowerFloors(false);
            return () => { isMounted = false; };
        }

        setLoadingTowerFloors(true);
        floorApi.getByTower(values.towerId, {
            headers: { "x-society-id": values.societyId }
        })
            .then((response) => {
                if (isMounted) setTowerFloors(unitRowsFrom(response));
            })
            .catch((err) => {
                if (isMounted) setError(err.response?.data?.message || "Could not load floors for this tower.");
            })
            .finally(() => {
                if (isMounted) setLoadingTowerFloors(false);
            });

        return () => { isMounted = false; };
    }, [values.towerId, values.societyId]);

    const towerFloorIds = new Set(towerFloors.map((floor) => floor.id));
    const visibleUnits = values.towerId
        ? units.filter((unit) => towerFloorIds.has(unit.floorId))
        : units;

    const update = (event) => {
        const { name, value, type, checked } = event.target;
        setValues((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
            ...(name === "societyId" ? { towerId: "", unitId: "" } : {}),
            ...(name === "towerId" ? { unitId: "" } : {}),
            ...(name === "role" && !["PRIMARY_OWNER", "CO_OWNER", "TENANT"].includes(value) ? { unitId: "" } : {})
        }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        const submittedName = normalizeName([
            values.firstName,
            values.middleName,
            values.lastName
        ].filter(Boolean).join(" "));
        const duplicateName = residents.some((existing) => {
            if (existing.id === resident?.id || existing.societyId !== values.societyId) return false;
            const existingName = normalizeName(existing.displayName || [
                existing.firstName,
                existing.middleName,
                existing.lastName
            ].filter(Boolean).join(" "));
            return existingName === submittedName;
        });

        if (duplicateName) {
            setError("A resident with this name already exists in this society.");
            return;
        }

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
        payload.dateOfBirth = values.dateOfBirth || null;
        if (profilePicture) payload.profilePicture = profilePicture;

        let residentId = createdResidentId;
        const societyConfig = { headers: { "x-society-id": values.societyId } };
        try {
            setSaving(true);
            if (resident?.id) {
                await residentApi.update(resident.id, payload);
            } else {
                if (!residentId) {
                    const result = await residentApi.create(payload, societyConfig);
                    const createdResident = result?.data || result?.resident || result;
                    residentId = createdResident.id;
                    setCreatedResidentId(residentId);
                }
                if (values.unitId) {
                    const effectiveFrom = new Date().toISOString().slice(0, 10);
                    if (values.role === "TENANT") {
                        await occupancyApi.create({
                            societyId: values.societyId,
                            unitId: values.unitId,
                            residentId,
                            occupancyType: "TENANT",
                            startDate: effectiveFrom
                        }, societyConfig);
                    } else {
                        await ownerUnitApi.create({
                            societyId: values.societyId,
                            ownerId: residentId,
                            unitId: values.unitId,
                            ownershipType: values.role,
                            ownershipPercentage: null,
                            effectiveFrom,
                            status: "ACTIVE"
                        }, societyConfig);
                    }
                }
                setCreatedResidentId("");
            }
            await onSuccess();
        } catch (err) {
            const message = err.response?.data?.message || "Could not save resident. Please try again.";
            setError(residentId
                ? `Resident was created, but the unit assignment failed: ${message} You can retry the assignment or clear the unit selection and save.`
                : message);
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
                            {!resident && <div className="form-group form-group-full">
                                <label htmlFor="resident-tower">Tower (optional)</label>
                                <select id="resident-tower" name="towerId" value={values.towerId} onChange={update} disabled={!values.societyId || loadingTowers}>
                                    <option value="">{loadingTowers ? "Loading towers…" : "No tower selected"}</option>
                                    {towers.map((tower) => <option key={tower.id} value={tower.id}>{tower.name || tower.towerName || tower.id}</option>)}
                                </select>
                                {values.towerId && <small className="field-hint">Selected tower: {towers.find((tower) => tower.id === values.towerId)?.name || "Tower"}</small>}
                                <small className="field-hint">Optional. Selecting a tower filters the unit list below.</small>
                            </div>}
                            {!resident && <div className="form-group form-group-full">
                                <label htmlFor="resident-unit">Unit (optional)</label>
                                <select id="resident-unit" name="unitId" value={values.unitId} onChange={update} disabled={!values.societyId || loadingUnits || loadingTowerFloors || (Boolean(values.role) && !["PRIMARY_OWNER", "CO_OWNER", "TENANT"].includes(values.role))}>
                                    <option value="">
                                        {loadingUnits || loadingTowerFloors
                                            ? "Loading units…"
                                            : visibleUnits.length === 0
                                                ? values.towerId ? "No units in this tower" : "No units in this society"
                                                : "No unit / not assigned"}
                                    </option>
                                    {visibleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNumber || unit.name || unit.id}</option>)}
                                </select>
                                {values.unitId && <small className="field-hint">Selected unit: {visibleUnits.find((unit) => unit.id === values.unitId)?.unitNumber || "Unit"}{values.towerId ? ` · Tower: ${towers.find((tower) => tower.id === values.towerId)?.name || "Tower"}` : ""}</small>}
                                <small className="field-hint">Optional. Choose a resident role to assign the selected unit; unit assignments are supported for owners and tenants.</small>
                            </div>}
                            <div className="form-group"><label htmlFor="resident-first-name">First name<span className="required">*</span></label><input id="resident-first-name" name="firstName" value={values.firstName} onChange={update} maxLength={100} autoComplete="given-name" required /></div>
                            <div className="form-group"><label htmlFor="resident-middle-name">Middle name</label><input id="resident-middle-name" name="middleName" value={values.middleName} onChange={update} maxLength={100} /></div>
                            <div className="form-group"><label htmlFor="resident-last-name">Last name<span className="required">*</span></label><input id="resident-last-name" name="lastName" value={values.lastName} onChange={update} maxLength={100} autoComplete="family-name" required /></div>
                            <div className="form-group"><label htmlFor="resident-dob">Date of birth</label><input id="resident-dob" name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={update} max={new Date().toISOString().slice(0, 10)} /></div>
                            <div className="form-group form-group-full">
                                <label htmlFor="resident-profile-picture">Profile picture</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <span style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: "var(--surface-2, #f1f5f9)" }}>{picturePreview ? <img src={picturePreview} alt="Resident profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={22} />}</span>
                                    <div><input id="resident-profile-picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) { setError("Profile picture must be 5 MB or smaller."); event.target.value = ""; return; } setError(""); setProfilePicture(file || null); }} /><small className="field-hint">JPG, PNG, or WEBP · Up to 5 MB</small></div>
                                </div>
                            </div>
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
