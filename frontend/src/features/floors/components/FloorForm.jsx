import { useState } from "react";
import { X } from "lucide-react";
import floorApi from "../api/floor.api";

const FloorForm = ({ floor, towers, onClose, onSuccess }) => {
    const [values, setValues] = useState({
        towerId: floor?.towerId || "",
        floorNumber: floor?.floorNumber ?? "",
        name: floor?.name || ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        const payload = { floorNumber: Number(values.floorNumber), name: values.name.trim() || null };

        try {
            if (floor) await floorApi.update(floor.id, payload);
            else await floorApi.create({ ...payload, towerId: values.towerId });
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save floor. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="floor-form-title">
            <header className="society-form-header">
                <div><h2 id="floor-form-title">{floor ? "Edit floor" : "Add floor"}</h2><p>{floor ? "Update this floor’s details." : "Choose a tower and enter its floor details."}</p></div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20} /></button>
            </header>
            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}
                    <section className="form-section">
                        <header className="form-section-title"><h3>Floor information</h3><span>Floor numbers start at ground floor 0</span></header>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="floor-tower">Tower{!floor && <span className="required">*</span>}</label>
                                {floor ? <input id="floor-tower" value={towers.find((item) => item.id === floor.towerId)?.name || "Selected tower"} disabled /> : (
                                    <select id="floor-tower" name="towerId" value={values.towerId} onChange={update} required>
                                        <option value="">Select a tower</option>
                                        {towers.map((tower) => <option key={tower.id} value={tower.id}>{tower.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="floor-number">Floor number<span className="required">*</span></label><input id="floor-number" name="floorNumber" type="number" min="0" step="1" value={values.floorNumber} onChange={update} required placeholder="0 for ground floor" /></div>
                            <div className="form-group"><label htmlFor="floor-name">Floor label</label><input id="floor-name" name="name" value={values.name} onChange={update} maxLength={100} placeholder="e.g. Ground Floor" /></div>
                        </div>
                    </section>
                </div>
                <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving || (!floor && towers.length === 0)}>{saving ? "Saving…" : floor ? "Save changes" : "Create floor"}</button></footer>
            </form>
        </section>
    );
};

export default FloorForm;
