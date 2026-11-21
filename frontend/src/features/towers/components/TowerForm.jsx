import { useDashboardFeedback } from '../../../lib/useDashboardFeedback.js';
import { useState } from "react";
import { X } from "lucide-react";
import towerApi from "../api/tower.api";

const TowerForm = ({ tower, societies, selectedSociety, onClose, onSuccess }) => {
    const [values, setValues] = useState({
        name: tower?.name || "",
        floorCount: tower?.floorCount ?? "",
        status: tower?.status || "ACTIVE"
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useDashboardFeedback('', 'error');

    const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        if (!tower && !selectedSociety) {
            setError("Select a society from the top bar before adding a tower.");
            return;
        }
        setSaving(true);
        setError("");
        const payload = {
            name: values.name.trim(),
            floorCount: Number(values.floorCount)
        };
        if (tower) payload.status = values.status;

        try {
            if (tower) await towerApi.update(tower.id, payload);
            else await towerApi.create({ ...payload, societyId: selectedSociety.id });
            if (tower) window.dispatchEvent(new Event("property:hierarchy-updated"));
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save tower. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="tower-form-title">
            <header className="society-form-header">
                <div><h2 id="tower-form-title">{tower ? "Edit tower" : "Add tower"}</h2><p>{tower ? "Update this tower’s details." : "The selected society is added automatically."}</p></div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20} /></button>
            </header>
            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}
                    <section className="form-section">
                        <header className="form-section-title"><h3>Tower information</h3><span>Complete the required fields</span></header>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="tower-society">Society</label>
                                <input
                                    id="tower-society"
                                    value={tower
                                        ? societies.find((item) => String(item.id) === String(tower.societyId))?.name || "Society"
                                        : selectedSociety?.name || ""}
                                    placeholder="Select a society from the top bar"
                                    readOnly
                                    required
                                />
                            </div>
                            <div className="form-group"><label htmlFor="tower-name">Tower name</label><input id="tower-name" name="name" value={values.name} onChange={update} maxLength={255} required placeholder="e.g. Tower A" /></div>
                            <div className="form-group"><label htmlFor="tower-floor-count">Number of floors</label><input className="tower-floor-count-input" id="tower-floor-count" name="floorCount" type="number" min="1" step="1" value={values.floorCount} onChange={update} required placeholder="e.g. 12" /></div>
                            {tower && <div className="form-group"><label htmlFor="tower-status">Status</label><select id="tower-status" name="status" value={values.status} onChange={update}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>}
                        </div>
                    </section>
                </div>
                <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving || (!tower && !selectedSociety)}>{saving ? "Saving…" : tower ? "Save changes" : "Create tower"}</button></footer>
            </form>
        </section>
    );
};

export default TowerForm;
