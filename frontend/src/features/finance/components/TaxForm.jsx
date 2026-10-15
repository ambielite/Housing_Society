import { useState } from "react";
import { X } from "lucide-react";
import taxApi from "../api/tax.api";

const society = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const makeForm = (tax) => ({
    societyId: tax?.societyId || society(), taxCode: tax?.taxCode || "", taxName: tax?.taxName || "",
    taxType: tax?.taxType || "GST", taxRate: tax?.taxRate ?? "", calculationMethod: tax?.calculationMethod || "PERCENTAGE",
    fixedAmount: tax?.fixedAmount ?? "", componentGroup: tax?.componentGroup || "", applicableOn: tax?.applicableOn || "INVOICE",
    registrationNumber: tax?.registrationNumber || "", effectiveFrom: tax?.effectiveFrom ? String(tax.effectiveFrom).slice(0, 10) : new Date().toISOString().slice(0, 10),
    effectiveTo: tax?.effectiveTo ? String(tax.effectiveTo).slice(0, 10) : "", isActive: tax?.isActive ?? true,
    description: tax?.description || "", remarks: tax?.remarks || ""
});

export default function TaxForm({ tax, onClose, onSuccess }) {
    const [form, setForm] = useState(() => makeForm(tax));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const submit = async (event) => {
        event.preventDefault(); setError("");
        const societyId = String(form.societyId || society()).replace(/^:+/, "").trim();
        if (!societyId) return setError("Select a society before configuring a tax.");
        if (Number(form.taxRate) < 0 || Number(form.taxRate) > 100) return setError("Tax rate must be between 0 and 100.");
        if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) return setError("Effective to must be on or after effective from.");
        try {
            setSaving(true);
            const payload = { ...form, societyId, taxRate: Number(form.taxRate), fixedAmount: form.fixedAmount === "" ? null : Number(form.fixedAmount), effectiveTo: form.effectiveTo || null, componentGroup: form.componentGroup || null, registrationNumber: form.registrationNumber || null, description: form.description || null, remarks: form.remarks || null };
            if (tax?.id) await taxApi.update(tax.id, payload); else await taxApi.create(payload);
            await onSuccess();
        } catch (err) { setError(err.response?.data?.message || "Could not save tax configuration."); }
        finally { setSaving(false); }
    };
    return <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="tax-form-title"><header className="society-form-header"><div><h2 id="tax-form-title">{tax ? "Edit tax rule" : "Add tax rule"}</h2><p>Configure type, calculation, scope, and effective dates.</p></div><button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20}/></button></header>
        <form onSubmit={submit}><div className="society-form-body">{error && <div className="form-error" role="alert">{error}</div>}<div className="form-section"><div className="form-section-title"><h3>Tax configuration</h3><span>Values are configurable; validate statutory treatment with your CA.</span></div><div className="form-grid">
            <div className="form-group"><label>Society</label><input value={form.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly required={false}/></div>
            <div className="form-group"><label>Tax code</label><input value={form.taxCode} onChange={(e)=>set("taxCode",e.target.value.trim().toUpperCase())} required maxLength="50"/></div>
            <div className="form-group"><label>Tax name</label><input value={form.taxName} onChange={(e)=>set("taxName",e.target.value)} required maxLength="150"/></div>
            <div className="form-group"><label>Tax type</label><select value={form.taxType} onChange={(e)=>set("taxType",e.target.value)}>{["GST","CGST","SGST","IGST","TDS","OTHER"].map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="form-group"><label>Calculation method</label><select value={form.calculationMethod} onChange={(e)=>set("calculationMethod",e.target.value)}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></div>
            <div className="form-group"><label>Rate (%)</label><input type="number" min="0" max="100" step="0.0001" value={form.taxRate} onChange={(e)=>set("taxRate",e.target.value)} required/></div>
            {form.calculationMethod === "FIXED" && <div className="form-group"><label>Fixed amount</label><input type="number" min="0" step="0.01" value={form.fixedAmount} onChange={(e)=>set("fixedAmount",e.target.value)} required/></div>}
            <div className="form-group"><label>Applicable on</label><select value={form.applicableOn} onChange={(e)=>set("applicableOn",e.target.value)}>{["INVOICE","BILLING","PAYMENT","VENDOR_PAYMENT","OTHER"].map(x=><option key={x}>{x}</option>)}</select></div>
            <div className="form-group"><label>Component group</label><input value={form.componentGroup} onChange={(e)=>set("componentGroup",e.target.value)} placeholder="e.g. GST"/></div>
            <div className="form-group"><label>Registration number</label><input value={form.registrationNumber} onChange={(e)=>set("registrationNumber",e.target.value)}/></div>
            <div className="form-group"><label>Effective from</label><input type="date" value={form.effectiveFrom} onChange={(e)=>set("effectiveFrom",e.target.value)} required/></div>
            <div className="form-group"><label>Effective to</label><input type="date" value={form.effectiveTo} onChange={(e)=>set("effectiveTo",e.target.value)}/></div>
            <div className="form-group form-group-full"><label>Description</label><textarea rows="2" value={form.description} onChange={(e)=>set("description",e.target.value)}/></div>
            <div className="form-group form-group-full"><label>Remarks</label><textarea rows="2" value={form.remarks} onChange={(e)=>set("remarks",e.target.value)}/></div>
            <div className="form-group form-group-full checkbox-row"><label className="checkbox-label"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e)=>set("isActive",e.target.checked)}/><span>Active tax rule</span></label></div>
        </div></div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? "Saving..." : tax ? "Save changes" : "Create tax rule"}</button></footer></form>
    </section>;
}
