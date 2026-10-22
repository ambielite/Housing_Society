import { useState } from "react";
import { X } from "lucide-react";
import unitApi from "../api/unit.api";

const UnitForm = ({ unit, floors, towers = [], onClose, onSuccess }) => {
    const [values, setValues] = useState({
        floorId: unit?.floorId || "",
        unitNumber: unit?.unitNumber || "",
        bhk: unit?.bhk || "",
        carpetArea: unit?.carpetArea ?? "",
        builtUpArea: unit?.builtUpArea ?? "",
        areaEffectiveFrom: unit?.areaEffectiveFrom || "",
        propertyType: unit?.propertyType || "RESIDENTIAL",
        status: unit?.status || "VACANT"
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    const floorLabel = (floor) => {
        const floorName = floor.name || `Floor ${floor.floorNumber}`;
        const towerName = towers.find((tower) => tower.id === floor.towerId)?.name;
        return towerName ? `${floorName} — ${towerName}` : `${floorName} — Tower not assigned`;
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        const hasArea = values.carpetArea !== "" || values.builtUpArea !== "";
        const areaChanged = unit && ["carpetArea", "builtUpArea"].some((key) =>
            values[key] !== "" && Number(values[key]) !== Number(unit[key] ?? 0)
        );
        if (((!unit && hasArea) || areaChanged) && !values.areaEffectiveFrom) {
            setError("Enter the effective date when adding or changing area details.");
            return;
        }

        const payload = {
            unitNumber: values.unitNumber.trim(),
            bhk: values.bhk.trim() || null,
            propertyType: values.propertyType,
            status: values.status
        };
        if (!unit) payload.floorId = values.floorId;
        if (values.carpetArea !== "") payload.carpetArea = Number(values.carpetArea);
        if (values.builtUpArea !== "") payload.builtUpArea = Number(values.builtUpArea);
        if (values.areaEffectiveFrom) payload.areaEffectiveFrom = values.areaEffectiveFrom;

        setSaving(true);
        try {
            if (unit) await unitApi.update(unit.id, payload);
            else await unitApi.create(payload);
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save unit. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="unit-form-title">
            <header className="society-form-header">
                <div><h2 id="unit-form-title">{unit ? "Edit unit" : "Add unit"}</h2><p>{unit ? "Update this unit’s details." : "Choose a floor and enter the unit details."}</p></div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20} /></button>
            </header>
            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}
                    <section className="form-section">
                        <header className="form-section-title"><h3>Unit information</h3><span>Area changes require an effective date</span></header>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="unit-floor">Floor{!unit && <span className="required">*</span>}</label>
                                {unit ? <input id="unit-floor" value={floorLabel(floors.find((item) => item.id === unit.floorId) || {})} disabled /> : (
                                    <select id="unit-floor" name="floorId" value={values.floorId} onChange={update} required>
                                        <option value="">Select a floor</option>
                                        {floors.map((floor) => <option key={floor.id} value={floor.id}>{floorLabel(floor)}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="unit-number">Unit number<span className="required">*</span></label><input id="unit-number" name="unitNumber" value={values.unitNumber} onChange={update} maxLength={50} required placeholder="e.g. A-101" /></div>
                            <div className="form-group"><label htmlFor="unit-bhk">Configuration</label><input id="unit-bhk" name="bhk" value={values.bhk} onChange={update} maxLength={20} placeholder="e.g. 2 BHK" /></div>
                            <div className="form-group"><label htmlFor="unit-type">Property type</label><select id="unit-type" name="propertyType" value={values.propertyType} onChange={update}><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option></select></div>
                            <div className="form-group"><label htmlFor="unit-status">Status</label><select id="unit-status" name="status" value={values.status} onChange={update}><option value="VACANT">Vacant</option><option value="OCCUPIED">Occupied</option><option value="UNDER_MOVE_IN">Under move in</option><option value="UNDER_MOVE_OUT">Under move out</option>{unit?.status === "INACTIVE" && <option value="INACTIVE">Inactive</option>}</select></div>
                            <div className="form-group"><label htmlFor="unit-carpet-area">Carpet area (sq. ft.)</label><input id="unit-carpet-area" name="carpetArea" type="number" min="0" step="0.01" value={values.carpetArea} onChange={update} placeholder="Optional" /></div>
                            <div className="form-group"><label htmlFor="unit-built-area">Built-up area (sq. ft.)</label><input id="unit-built-area" name="builtUpArea" type="number" min="0" step="0.01" value={values.builtUpArea} onChange={update} placeholder="Optional" /></div>
                            <div className="form-group"><label htmlFor="unit-area-date">Area effective from</label><input id="unit-area-date" name="areaEffectiveFrom" type="date" value={values.areaEffectiveFrom} onChange={update} /></div>
                        </div>
                    </section>
                </div>
                <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving || (!unit && floors.length === 0)}>{saving ? "Saving…" : unit ? "Save changes" : "Create unit"}</button></footer>
            </form>
        </section>
    );
};

export default UnitForm;
