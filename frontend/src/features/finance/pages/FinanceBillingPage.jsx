import { useEffect, useMemo, useState } from "react";
import { Plus, Receipt, Search } from "lucide-react";
import billingApi from "../api/billing.api";
import billingConfigApi from "../api/billingConfig.api";
import BillingForm from "../components/BillingForm";
import { legacyApi as axiosClient } from "../../../lib/axios";
import unitApi from "../../units/api/unit.api";

const rowsFrom = (response) => {
    const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
    return Array.isArray(rows) ? rows : [];
};
const society = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const date = (value) => value ? String(value).slice(0, 10) : "-";
const FinanceBillingPage = () => {
    const [items, setItems] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [view, setView] = useState("bills");
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState("");
    const [billingDate, setBillingDate] = useState(new Date().toISOString().slice(0, 10));
    const [configType, setConfigType] = useState("BILLING_RULE");
    const [configForm, setConfigForm] = useState(null);
    const [savingConfig, setSavingConfig] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true); setError("");
            const societyId = society();
            const [billResponse, configResponse, unitResponse] = await Promise.all([
                billingApi.getAll({ ...(societyId ? { societyId } : {}), ...(status ? { status } : {}) }),
                billingConfigApi.getAll(societyId ? { societyId } : {}),
                unitApi.getAll().catch(() => null)
            ]);
            setItems(rowsFrom(billResponse)); setConfigs(rowsFrom(configResponse)); setUnits(rowsFrom(unitResponse));
        } catch (err) { setError(err.response?.data?.message || "Could not load billing data."); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadData(); }, [status]);
    const unitNameById = useMemo(() => new Map(units.map((unit) => [unit.id, unit.unitNumber || unit.unitName || unit.name || `Unit ${String(unit.id).slice(0, 8)}`])), [units]);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((x) => !q || [x.billNumber, x.billingPeriod, x.unit?.unitNumber, unitNameById.get(x.unitId), x.unitId, x.status, x.billingModel].join(" ").toLowerCase().includes(q));
    }, [items, search, unitNameById]);
    const act = async (entry, action) => {
        if (action === "cancel" && !window.confirm(`Cancel bill ${entry.billNumber}?`)) return;
        try { setBusy(entry.id); setError(""); await billingApi[action](entry.id); await loadData(); }
        catch (err) { setError(err.response?.data?.message || err.message || `Could not ${action} bill.`); }
        finally { setBusy(""); }
    };
    const runScheduler = async () => {
        try { setBusy("scheduler"); setError(""); const id = society(); if (!id) throw new Error("Select a society first.");
            const result = await axiosClient.post("/billing-scheduler/run", { societyId: id, billingDate });
            const data = result.data?.data || result.data;
            window.alert(data?.message || `Billing run completed. ${data?.results?.length ?? 0} unit results.`); await loadData();
        } catch (err) { setError(err.response?.data?.message || err.message || "Billing run failed."); }
        finally { setBusy(""); }
    };
    const updateOverdue = async () => { try { setBusy("overdue"); await billingApi.updateOverdue(); await loadData(); } catch (err) { setError(err.response?.data?.message || "Could not update overdue bills."); } finally { setBusy(""); } };
    const openConfig = (item = null) => { setConfigForm(item ? { ...item, effectiveFrom: date(item.effectiveFrom), effectiveTo: date(item.effectiveTo) === "-" ? "" : date(item.effectiveTo) } : { societyId: society(), configType, code: "", name: "", effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "", chargeCategory: "MAINTENANCE", billingModel: "FLAT_RATE", flatAmount: "", ratePerArea: "", fixedAmount: "", billingFrequency: "MONTHLY", billingDay: 1, dueDays: 7, penaltyType: "PERCENTAGE", penaltyValue: "", gracePeriodDays: 0, isTaxable: false, taxRate: 0, description: "" }); };
    const saveConfig = async (event) => {
        event.preventDefault();
        try {
            setSavingConfig(true);
            const payload = {
                ...configForm,
                societyId: society(),
                effectiveTo: configForm.effectiveTo || null
            };
            const fieldsByType = {
                CHARGE_HEAD: ["chargeCategory"],
                BILLING_RULE: ["chargeCategory", "billingModel", "flatAmount", "ratePerArea", "fixedAmount", "isTaxable", "taxRate"],
                BILLING_CYCLE: ["billingFrequency", "billingDay", "dueDays"],
                PENALTY_RULE: ["penaltyType", "penaltyValue", "gracePeriodDays"]
            };
            const applicableFields = new Set(fieldsByType[configForm.configType] || []);
            ["chargeCategory", "billingModel", "flatAmount", "ratePerArea", "fixedAmount", "billingFrequency", "billingDay", "dueDays", "penaltyType", "penaltyValue", "gracePeriodDays", "isTaxable", "taxRate"].forEach((field) => {
                if (!applicableFields.has(field)) delete payload[field];
            });
            ["flatAmount", "ratePerArea", "fixedAmount", "billingDay", "dueDays", "penaltyValue", "gracePeriodDays", "taxRate"].forEach((field) => {
                if (!applicableFields.has(field)) return;
                if (payload[field] === "" || payload[field] == null) payload[field] = null;
                else payload[field] = Number(payload[field]);
            });
            if (configForm.id) await billingConfigApi.update(configForm.id, payload);
            else await billingConfigApi.create(payload);
            setConfigForm(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save billing configuration.");
        } finally {
            setSavingConfig(false);
        }
    };
    const deactivateConfig = async (row) => { if (!window.confirm(`Deactivate ${row.name}?`)) return; try { await billingConfigApi.remove(row.id); await loadData(); } catch (err) { setError(err.response?.data?.message || "Could not deactivate configuration."); } };
    const visibleConfigs = configs.filter((x) => x.configType === configType);
    return <section className="society-dashboard module-shell-page finance-module-page">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot"/> FINANCE</div><h1>Billing</h1><p>Create bills, manage billing rules, and run scheduled billing.</p></div><div className="society-row-actions"><button className="btn-secondary" onClick={() => setView(view === "bills" ? "setup" : "bills")}>{view === "bills" ? "Billing setup" : "Back to bills"}</button>{view === "bills" && <button className="society-add-button" onClick={() => setShowForm(true)}><Plus size={17}/> Create bill</button>}</div></header>
        {error && <div className="society-error" role="alert">{error}<button onClick={loadData}>Try again</button></div>}
        {view === "bills" ? <section className="society-list-panel">
            <div className="society-list-heading"><div><h2>Billing records</h2><p>Amounts and statuses returned by the billing service.</p></div><span className="society-count">{loading ? "Loading" : `${filtered.length} bills`}</span></div>
            <div className="society-toolbar"><label className="society-search"><Search size={17}/><input aria-label="Search bills" placeholder="Search bill, unit, period or status" value={search} onChange={(e) => setSearch(e.target.value)}/></label><select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["DRAFT","ISSUED","PARTIALLY_PAID","PAID","OVERDUE","CANCELLED"].map((x)=><option key={x}>{x}</option>)}</select><input aria-label="Billing run date" type="date" value={billingDate} onChange={(e)=>setBillingDate(e.target.value)}/><button className="btn-secondary" disabled={!!busy} onClick={runScheduler}>{busy === "scheduler" ? "Running..." : "Run billing cycle"}</button><button className="btn-secondary" disabled={!!busy} onClick={updateOverdue}>Update overdue</button></div>
            {loading ? <div className="society-loading">Loading billing...</div> : !filtered.length ? <div className="society-empty"><span className="society-empty-icon"><Receipt size={24}/></span><h3>No bills found</h3><p>Create a draft bill or configure a billing rule and cycle.</p><button className="society-add-button" onClick={()=>setShowForm(true)}><Plus size={17}/> Create bill</button></div> : <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Bill number</th><th>Unit</th><th>Period</th><th>Bill date</th><th>Due date</th><th>Model</th><th>Subtotal</th><th>Arrears</th><th>Tax</th><th>Penalty</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((x)=><tr key={x.id}><td>{x.billNumber || "-"}</td><td>{x.unit?.unitNumber || x.unit?.name || unitNameById.get(x.unitId) || "-"}</td><td>{x.billingPeriod || "-"}</td><td>{date(x.billDate)}</td><td>{date(x.dueDate)}</td><td>{x.billingModel || (x.billingConfigId ? "-" : "Manual charge")}</td><td>{money(x.subtotal)}</td><td>{money(x.previousBalance)}</td><td>{money(x.taxAmount)}</td><td>{money(x.penaltyAmount)}</td><td>{money(x.totalAmount)}</td><td>{money(x.paidAmount)}</td><td>{money(x.outstandingAmount)}</td><td>{x.status}</td><td><div className="society-row-actions">{x.status === "DRAFT" && <button className="society-workflow-action" disabled={!!busy} onClick={()=>act(x,"issue")}>Issue</button>}{!["PAID","CANCELLED"].includes(x.status) && <button className="society-workflow-action" disabled={!!busy} onClick={()=>act(x,"cancel")}>Cancel</button>}{x.status === "DRAFT" && <button className="society-icon-action society-delete-action" title="Delete draft" disabled={!!busy} onClick={()=>act(x,"remove")}>Delete</button>}</div></td></tr>)}</tbody></table></div>}
        </section> : <section className="society-list-panel"><div className="society-list-heading"><div><h2>Billing configuration</h2><p>Effective dates control which rules are used for calculations and scheduled billing.</p></div><button className="society-add-button" onClick={()=>openConfig()}><Plus size={17}/> Add configuration</button></div><div className="society-toolbar"><select value={configType} onChange={(e)=>setConfigType(e.target.value)}>{[["CHARGE_HEAD","Charge heads"],["BILLING_RULE","Billing rules"],["BILLING_CYCLE","Billing cycles"],["PENALTY_RULE","Penalty rules"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="society-table-wrap"><table className="society-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Model / setting</th><th>Effective</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleConfigs.map((c)=><tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.chargeCategory || "-"}</td><td>{c.configType === "BILLING_RULE" ? `${c.billingModel || "-"} / ${c.flatAmount || c.ratePerArea || c.fixedAmount || "-"}` : c.configType === "BILLING_CYCLE" ? `${c.billingFrequency || "-"}, day ${c.billingDay || "-"}, due ${c.dueDays ?? "-"}d` : c.configType === "PENALTY_RULE" ? `${c.penaltyType || "-"} ${c.penaltyValue || 0}; grace ${c.gracePeriodDays || 0}d` : "Charge head"}</td><td>{date(c.effectiveFrom)} to {date(c.effectiveTo)}</td><td>{c.isActive ? "Active" : "Inactive"}</td><td><div className="society-row-actions"><button className="society-workflow-action" onClick={()=>openConfig(c)}>Edit</button>{c.isActive && <button className="society-workflow-action" onClick={()=>deactivateConfig(c)}>Deactivate</button>}</div></td></tr>)}</tbody></table>{!visibleConfigs.length && <div className="society-empty"><h3>No configuration found</h3><p>Add the first {configType.toLowerCase().replaceAll("_", " ")}.</p></div>}</div></section>}
        {showForm && <div className="society-modal-layer" onMouseDown={(e)=>{if(e.target===e.currentTarget)setShowForm(false)}}><BillingForm onClose={()=>setShowForm(false)} onSuccess={async()=>{setShowForm(false);await loadData();}} billingRules={configs.filter((c)=>c.configType==="BILLING_RULE"&&c.isActive)}/></div>}
        {configForm && <div className="society-modal-layer" onMouseDown={(e)=>{if(e.target===e.currentTarget)setConfigForm(null)}}><section className="society-form-modal" role="dialog" aria-modal="true"><header className="society-form-header"><div><h2>{configForm.id?"Edit":"Add"} {configType.toLowerCase().replaceAll("_"," ")}</h2><p>Configuration applies within its effective date range.</p></div><button className="modal-close-btn" type="button" onClick={()=>setConfigForm(null)}>X</button></header><form onSubmit={saveConfig}><div className="society-form-body"><div className="form-grid">
            <div className="form-group"><label>Code *</label><input value={configForm.code} onChange={(e)=>setConfigForm({...configForm,code:e.target.value})} required/></div><div className="form-group"><label>Name *</label><input value={configForm.name} onChange={(e)=>setConfigForm({...configForm,name:e.target.value})} required/></div>
            {(configType==="CHARGE_HEAD"||configType==="BILLING_RULE")&&<div className="form-group"><label>Charge category</label><select value={configForm.chargeCategory||"MAINTENANCE"} onChange={(e)=>setConfigForm({...configForm,chargeCategory:e.target.value})}>{["MAINTENANCE","PARKING","AMENITY","UTILITY","OTHER"].map(x=><option key={x}>{x}</option>)}</select></div>}
            {configType==="BILLING_RULE"&&<><div className="form-group"><label>Billing model *</label><select value={configForm.billingModel||"FLAT_RATE"} onChange={(e)=>setConfigForm({...configForm,billingModel:e.target.value})}>{["FLAT_RATE","AREA_BASED","HYBRID"].map(x=><option key={x}>{x}</option>)}</select></div>{configForm.billingModel==="FLAT_RATE"&&<div className="form-group"><label>Flat amount *</label><input type="number" min="0.01" step="0.01" value={configForm.flatAmount} onChange={(e)=>setConfigForm({...configForm,flatAmount:e.target.value})} required/> </div>}{configForm.billingModel!=="FLAT_RATE"&&<><div className="form-group"><label>Rate per area *</label><input type="number" min="0.0001" step="0.0001" value={configForm.ratePerArea} onChange={(e)=>setConfigForm({...configForm,ratePerArea:e.target.value})} required/></div>{configForm.billingModel==="HYBRID"&&<div className="form-group"><label>Fixed amount</label><input type="number" min="0" step="0.01" value={configForm.fixedAmount} onChange={(e)=>setConfigForm({...configForm,fixedAmount:e.target.value})}/></div>}</>}
            <div className="form-group"><label>Taxable</label><select value={String(!!configForm.isTaxable)} onChange={(e)=>setConfigForm({...configForm,isTaxable:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></div>{configForm.isTaxable&&<div className="form-group"><label>Tax rate (%)</label><input type="number" min="0" step="0.01" value={configForm.taxRate} onChange={(e)=>setConfigForm({...configForm,taxRate:e.target.value})}/></div>}</>}
            {configType==="BILLING_CYCLE"&&<><div className="form-group"><label>Frequency *</label><select value={configForm.billingFrequency||"MONTHLY"} onChange={(e)=>setConfigForm({...configForm,billingFrequency:e.target.value})}>{["MONTHLY","QUARTERLY","HALF_YEARLY","YEARLY","CUSTOM"].map(x=><option key={x}>{x}</option>)}</select></div><div className="form-group"><label>Billing day (1-28)</label><input type="number" min="1" max="28" value={configForm.billingDay} onChange={(e)=>setConfigForm({...configForm,billingDay:e.target.value})}/></div><div className="form-group"><label>Due days</label><input type="number" min="0" value={configForm.dueDays} onChange={(e)=>setConfigForm({...configForm,dueDays:e.target.value})}/></div></>}
            {configType==="PENALTY_RULE"&&<><div className="form-group"><label>Penalty type *</label><select value={configForm.penaltyType||"PERCENTAGE"} onChange={(e)=>setConfigForm({...configForm,penaltyType:e.target.value})}>{["PERCENTAGE","FIXED_AMOUNT","DAILY_FIXED","DAILY_PERCENTAGE"].map(x=><option key={x}>{x}</option>)}</select></div><div className="form-group"><label>Penalty value *</label><input type="number" min="0" step="0.0001" value={configForm.penaltyValue} onChange={(e)=>setConfigForm({...configForm,penaltyValue:e.target.value})} required/></div><div className="form-group"><label>Grace period (days)</label><input type="number" min="0" value={configForm.gracePeriodDays} onChange={(e)=>setConfigForm({...configForm,gracePeriodDays:e.target.value})}/></div></>}
            <div className="form-group"><label>Effective from *</label><input type="date" value={configForm.effectiveFrom} onChange={(e)=>setConfigForm({...configForm,effectiveFrom:e.target.value})} required/></div><div className="form-group"><label>Effective to</label><input type="date" value={configForm.effectiveTo||""} onChange={(e)=>setConfigForm({...configForm,effectiveTo:e.target.value})}/></div><div className="form-group"><label>Description</label><textarea value={configForm.description||""} onChange={(e)=>setConfigForm({...configForm,description:e.target.value})}/></div>
        </div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={()=>setConfigForm(null)}>Cancel</button><button className="btn-primary" disabled={savingConfig}>{savingConfig?"Saving...":"Save configuration"}</button></footer></form></section></div>}
    </section>;
};
export default FinanceBillingPage;
