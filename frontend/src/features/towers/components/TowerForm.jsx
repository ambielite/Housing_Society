import { useState } from "react";
import { X } from "lucide-react";
import towerApi from "../api/tower.api";

const TowerForm = ({ tower, societies, onClose, onSuccess }) => {
    const [values, setValues] = useState({
        societyId: tower?.societyId || "",
        name: tower?.name || "",
        floorCount: tower?.floorCount ?? ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        const payload = {
            name: values.name.trim(),
            floorCount: Number(values.floorCount)
        };

        try {
            if (tower) await towerApi.update(tower.id, payload);
            else await towerApi.create({ ...payload, societyId: values.societyId });
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
                <div><h2 id="tower-form-title">{tower ? "Edit tower" : "Add tower"}</h2><p>{tower ? "Update this tower’s details." : "Choose a society and enter its tower details."}</p></div>
                <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20} /></button>
            </header>
            <form onSubmit={submit}>
                <div className="society-form-body">
                    {error && <div className="form-error" role="alert">{error}</div>}
                    <section className="form-section">
                        <header className="form-section-title"><h3>Tower information</h3><span>Fields marked with * are required</span></header>
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="tower-society">Society{!tower && <span className="required">*</span>}</label>
                                {tower ? <input id="tower-society" value={societies.find((item) => item.id === tower.societyId)?.name || "Selected society"} disabled /> : (
                                    <select id="tower-society" name="societyId" value={values.societyId} onChange={update} required>
                                        <option value="">Select a society</option>
                                        {societies.map((society) => <option key={society.id} value={society.id}>{society.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="tower-name">Tower name<span className="required">*</span></label><input id="tower-name" name="name" value={values.name} onChange={update} maxLength={255} required placeholder="e.g. Tower A" /></div>
                            <div className="form-group"><label htmlFor="tower-floor-count">Number of floors<span className="required">*</span></label><input id="tower-floor-count" name="floorCount" type="number" min="1" step="1" value={values.floorCount} onChange={update} required placeholder="e.g. 12" /></div>
                        </div>
                    </section>
                </div>
                <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving || (!tower && societies.length === 0)}>{saving ? "Saving…" : tower ? "Save changes" : "Create tower"}</button></footer>
            </form>
        </section>
    );
};

export default TowerForm;
