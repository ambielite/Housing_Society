import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import invoiceApi from "../api/invoice.api";
import unitApi from "../../units/api/unit.api";
import floorApi from "../../floors/api/floor.api";
import towerApi from "../../towers/api/tower.api";

const rowsFrom = (response) => Array.isArray(response) ? response : response?.data || response?.records || [];
const society = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const line = () => ({ description: "", quantity: "1", rate: "", taxRate: "0" });

export default function InvoiceForm({ onClose, onSuccess }) {
    const [form, setForm] = useState({ societyId: society(), unitId: "", invoiceNumber: "", billingPeriod: today().slice(0,7), invoiceDate: today(), dueDate: today(), billingId: "", penaltyAmount: "0", idempotencyKey: `invoice-${crypto.randomUUID()}`, description: "", remarks: "", items: [line()] });
    const [units, setUnits] = useState([]); const [unitsLoading, setUnitsLoading] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        if (!form.societyId) { setUnits([]); return () => { active = false; }; }
        setUnitsLoading(true);
        setUnits([]);
        Promise.all([unitApi.getAll(), floorApi.getAll(), towerApi.getBySociety(form.societyId)])
            .then(([unitResponse, floorResponse, towerResponse]) => {
                if (!active) return;
                const allUnits = rowsFrom(unitResponse);
                const floors = rowsFrom(floorResponse);
                const towers = rowsFrom(towerResponse);
                const towerById = new Map(towers.map((tower) => [tower.id, tower]));
                const floorById = new Map(floors.map((floor) => [floor.id, floor]));
                const societyFloorIds = new Set(floors.filter((floor) => towerById.has(floor.towerId) && floor.status !== "INACTIVE").map((floor) => floor.id));
                const societyUnits = allUnits.filter((unit) => societyFloorIds.has(unit.floorId) && unit.status !== "INACTIVE").map((unit) => {
                    const floor = floorById.get(unit.floorId);
                    const tower = floor ? towerById.get(floor.towerId) : null;
                    return { ...unit, unitLabel: [tower?.name, unit.unitNumber ? `Unit ${unit.unitNumber}` : null, floor?.floorNumber !== undefined ? `Floor ${floor.floorNumber}` : null].filter(Boolean).join(" / ") || unit.id };
                });
                setUnits(societyUnits);
                setError("");
            })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Could not load units for the selected society."); })
            .finally(() => { if (active) setUnitsLoading(false); });
        return () => { active = false; };
    }, [form.societyId]);
    const set=(key,value)=>setForm(current=>({...current,[key]:value}));
    const setItem=(index,key,value)=>setForm(current=>({...current,items:current.items.map((item,i)=>i===index?{...item,[key]:value}:item)}));
    const addItem=()=>setForm(current=>({...current,items:[...current.items,line()]}));
    const removeItem=(index)=>setForm(current=>({...current,items:current.items.filter((_,i)=>i!==index)}));
    const estimatedSubtotal=form.items.reduce((sum,item)=>sum+(Number(item.quantity||0)*Number(item.rate||0)),0);
    const estimatedTax=form.items.reduce((sum,item)=>sum+(Number(item.quantity||0)*Number(item.rate||0)*Number(item.taxRate||0)/100),0);
    const submit = async (event) => {
        event.preventDefault();
        setError("");
        if (!form.societyId) return setError("Select a society before creating an invoice.");
        if (!form.unitId) return setError("Select a unit before creating an invoice.");
        if (!form.invoiceNumber.trim()) return setError("Enter an invoice number.");
        if (!form.billingPeriod.trim()) return setError("Enter a billing period (for example, 2026-10).");
        if (!form.invoiceDate || !form.dueDate) return setError("Enter both invoice and due dates.");
        if (form.dueDate < form.invoiceDate) return setError("Due date must be on or after invoice date.");
        if (!form.items.length) return setError("Add at least one invoice item.");
        const invalidLine = form.items.find((item) => !item.description.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || item.rate === "" || !Number.isFinite(Number(item.rate)) || Number(item.rate) < 0 || !Number.isFinite(Number(item.taxRate || 0)) || Number(item.taxRate || 0) < 0);
        if (invalidLine) return setError("Each item needs a description, positive quantity, and valid non-negative rate and tax rate.");
        try {
            setSaving(true);
            await invoiceApi.create({ ...form, societyId: form.societyId.trim(), invoiceNumber: form.invoiceNumber.trim(), billingPeriod: form.billingPeriod.trim(), penaltyAmount: Number(form.penaltyAmount || 0), billingId: form.billingId.trim() || null, items: form.items.map((item) => ({ ...item, description: item.description.trim(), quantity: Number(item.quantity), rate: Number(item.rate), taxRate: Number(item.taxRate || 0) })) });
            await onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Invoice could not be created. Check the details and try again.");
        } finally { setSaving(false); }
    };
    return <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-form-title"><header className="society-form-header"><div><h2 id="invoice-form-title">Create invoice</h2><p>Invoice totals, tax, and previous balances are calculated by the backend.</p></div><button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20}/></button></header>
    <form onSubmit={submit} noValidate><div className="society-form-body">{error&&<div className="form-error" role="alert">{error}</div>}<div className="form-section"><div className="form-section-title"><h3>Invoice details</h3><span>New invoices are saved as drafts.</span></div><div className="form-grid">
        <div className="form-group"><label>Society</label><input value={form.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly/></div>
        <div className="form-group"><label>Unit</label><select value={form.unitId} onChange={e=>set("unitId",e.target.value)} required><option value="">Select unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.unitLabel}</option>)}</select>{unitsLoading&&<small>Loading units...</small>}{!unitsLoading&&!units.length&&<small>No active units were found for this society.</small>}</div>
        <div className="form-group"><label>Invoice number</label><input value={form.invoiceNumber} onChange={e=>set("invoiceNumber",e.target.value)} required maxLength="100"/></div>
        <div className="form-group"><label>Billing period</label><input value={form.billingPeriod} onChange={e=>set("billingPeriod",e.target.value)} placeholder="YYYY-MM" required/></div>
        <div className="form-group"><label>Invoice date</label><input type="date" value={form.invoiceDate} onChange={e=>set("invoiceDate",e.target.value)} required/></div>
        <div className="form-group"><label>Due date</label><input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} required/></div>
        <div className="form-group"><label>Penalty amount</label><input type="number" min="0" step="0.01" value={form.penaltyAmount} onChange={e=>set("penaltyAmount",e.target.value)}/></div>
        <div className="form-group form-group-full"><label>Description</label><textarea rows="2" value={form.description} onChange={e=>set("description",e.target.value)}/></div>
    </div></div><div className="form-section"><div className="form-section-title"><h3>Invoice items</h3><button type="button" className="btn-secondary btn-small" onClick={addItem}><Plus size={15}/> Add item</button></div>{form.items.map((item,index)=><div className="form-grid" key={index}>
        <div className="form-group form-group-full"><label>Item description</label><input value={item.description} onChange={e=>setItem(index,"description",e.target.value)} required maxLength="255"/></div>
        <div className="form-group"><label>Quantity</label><input type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={e=>setItem(index,"quantity",e.target.value)} required/></div>
        <div className="form-group"><label>Rate</label><input type="number" min="0" step="0.0001" value={item.rate} onChange={e=>setItem(index,"rate",e.target.value)} required/></div>
        <div className="form-group"><label>Tax rate (%)</label><input type="number" min="0" step="0.01" value={item.taxRate} onChange={e=>setItem(index,"taxRate",e.target.value)}/></div>
        <div className="form-group"><label>Line total</label><input value={(Number(item.quantity||0)*Number(item.rate||0)*(1+Number(item.taxRate||0)/100)).toFixed(2)} readOnly/></div>
        {form.items.length>1&&<button type="button" className="btn-link danger" onClick={()=>removeItem(index)}><Trash2 size={15}/> Remove item</button>}
    </div>)}</div><div className="society-toolbar"><strong>Estimated subtotal: {estimatedSubtotal.toFixed(2)}</strong><strong>Estimated tax: {estimatedTax.toFixed(2)}</strong><strong>Estimated total incl. penalty: {(estimatedSubtotal+estimatedTax+Number(form.penaltyAmount||0)).toFixed(2)}</strong></div><div className="form-section"><div className="form-group form-group-full invoice-remarks"><label htmlFor="invoice-remarks">Remarks</label><textarea id="invoice-remarks" rows="3" maxLength="2000" value={form.remarks} onChange={e=>set("remarks",e.target.value)} placeholder="Add any notes for this invoice (optional)" /></div></div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" disabled={saving||!units.length}>{saving?"Creating...":"Create draft invoice"}</button></footer></form></section>;
}




