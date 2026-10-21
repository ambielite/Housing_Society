import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import billingApi from "../api/billing.api";
import ledgerAccountApi from "../api/ledgerAccount.api";
import accountApi from "../api/account.api";
import towerApi from "../../towers/api/tower.api";
import floorApi from "../../floors/api/floor.api";
import unitApi from "../../units/api/unit.api";

const societyId = () => String(localStorage.getItem("selectedSocietyId") || "").replace(/^:+/, "").trim();
const rows = (r) => { const value = Array.isArray(r) ? r : r?.data || r?.records || []; return Array.isArray(value) ? value : []; };
const unwrap = (r) => r?.data?.data || r?.data || r;
const initial = () => {
    const today = new Date();
    return { societyId: societyId(), unitId: "", ledgerAccountId: "", billingRuleCode: "", billNumber: `BILL-${today.getFullYear()}-${Date.now().toString().slice(-7)}`, billingPeriod: today.toISOString().slice(0, 7), billDate: today.toISOString().slice(0, 10), dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10), taxAmount: "0", penaltyAmount: "0", description: "", remarks: "" };
};
const BillingForm = ({ onClose, onSuccess, billingRules = [] }) => {
    const [form, setForm] = useState(initial);
    const [units, setUnits] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [receivableAccounts, setReceivableAccounts] = useState([]);
    const [showLedgerForm, setShowLedgerForm] = useState(false);
    const [ledgerAccountId, setLedgerAccountId] = useState("");
    const [creatingLedger, setCreatingLedger] = useState(false);
    const [calculation, setCalculation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const sid = societyId();
                if (!sid) throw new Error("Select a society before creating a bill.");
                const [towerResponse, ledgerResponse, receivableResponse] = await Promise.all([towerApi.getBySociety(sid), ledgerAccountApi.getAll(sid), accountApi.getByType(sid, "RECEIVABLE")]);
                const towers = rows(towerResponse);
                const floorLists = await Promise.all(towers.map((tower) => floorApi.getByTower(tower.id).then(rows)));
                const floors = floorLists.flat();
                const unitLists = await Promise.all(floors.map((floor) => unitApi.getByFloor(floor.id).then((response) => rows(response).map((unit) => ({ ...unit, floor, tower: towers.find((x) => x.id === floor.towerId) })) )));
                if (active) { const receivables = rows(receivableResponse).filter((x) => x.isActive !== false); const receivableIds = new Set(receivables.map((x) => x.id)); setUnits(unitLists.flat()); setReceivableAccounts(receivables); setLedgers(rows(ledgerResponse).filter((x) => x.isActive !== false && receivableIds.has(x.accountId))); }
            } catch (e) { if (active) setError(e.response?.data?.message || e.message || "Could not load units and ledger accounts."); }
            finally { if (active) setLoading(false); }
        };
        load(); return () => { active = false; };
    }, []);
    const selectedUnit = units.find((x) => x.id === form.unitId);
    const matchingLedgers = useMemo(() => ledgers.filter((x) => !x.unitId || x.unitId === form.unitId), [ledgers, form.unitId]);
    const selectedRule = billingRules.find((x) => x.code === form.billingRuleCode);
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const createUnitLedger = async (event) => {
        event.preventDefault();
        const account = receivableAccounts.find((item) => item.id === ledgerAccountId);
        if (!selectedUnit || !account) return setError("Select a receivable account to create this unit ledger.");
        const unitLabel = selectedUnit.unitNumber || selectedUnit.unitName || selectedUnit.name || "Unit";
        const codePart = String(account.accountCode || account.id.slice(0, 8)).replace(/[^a-z0-9-]/gi, "-");
        try {
            setCreatingLedger(true); setError("");
            const created = unwrap(await ledgerAccountApi.create({
                societyId: form.societyId,
                unitId: selectedUnit.id,
                accountId: account.id,
                ledgerCode: `UNIT-${selectedUnit.id}-${codePart}`,
                ledgerName: `${unitLabel} - ${account.accountName}`,
                openingBalance: 0,
                balanceType: "DEBIT"
            }));
            setLedgers((current) => [created, ...current]);
            set("ledgerAccountId", created.id);
            setShowLedgerForm(false);
        } catch (e) { setError(e.response?.data?.message || e.message || "Could not create the unit ledger account."); }
        finally { setCreatingLedger(false); }
    };
    const calculate = async () => {
        try {
            setError(""); setCalculation(null);
            if (!form.unitId || !form.billingRuleCode) throw new Error("Select a unit and active billing rule first.");
            const area = Number(selectedUnit?.carpetArea || selectedUnit?.builtUpArea || 0);
            const result = unwrap(await billingApi.calculate({ societyId: form.societyId, unitId: form.unitId, billingRuleCode: form.billingRuleCode, billDate: form.billDate, unitArea: area, taxAmount: Number(form.taxAmount || 0), penaltyAmount: Number(form.penaltyAmount || 0) }));
            setCalculation(result);
        } catch (e) { setError(e.response?.data?.message || e.message || "Could not calculate bill."); }
    };
    const submit = async (event) => {
        event.preventDefault(); setError("");
        if (!form.societyId || !form.unitId || !form.ledgerAccountId) return setError("Society, unit and receivable ledger are required.");
        if (form.billDate > form.dueDate) return setError("Due date must be on or after the bill date.");
        if (form.billingRuleCode && !calculation) return setError("Calculate the bill before creating it.");
        try {
            setSaving(true);
            const payload = { societyId: form.societyId, unitId: form.unitId, ledgerAccountId: form.ledgerAccountId, billNumber: form.billNumber, billingPeriod: form.billingPeriod, billDate: form.billDate, dueDate: form.dueDate, description: form.description || selectedRule?.name || "", remarks: form.remarks || null, ...(form.billingRuleCode ? { billingRuleCode: form.billingRuleCode, unitArea: Number(selectedUnit?.carpetArea || selectedUnit?.builtUpArea || 0), taxAmount: Number(form.taxAmount || 0), penaltyAmount: Number(form.penaltyAmount || 0) } : { subtotal: Number(form.subtotal || 0), taxAmount: Number(form.taxAmount || 0), penaltyAmount: Number(form.penaltyAmount || 0) }) };
            await billingApi.create(payload); await onSuccess();
        } catch (e) { setError(e.response?.data?.message || e.message || "Could not create draft bill."); }
        finally { setSaving(false); }
    };
    const amount = calculation?.totalAmount;
    return <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="billing-create-title"><header className="society-form-header"><div><h2 id="billing-create-title">Create draft bill</h2><p>The backend calculates the charge, arrears and total from the selected rule.</p></div><button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close"><X size={20}/></button></header>
        <form onSubmit={submit}><div className="society-form-body">{error && <div className="form-error" role="alert">{error}</div>}{loading && <p>Loading society units and ledger accounts...</p>}<div className="form-grid">
            <div className="form-group"><label>Society</label><input value={form.societyId ? "Currently selected society" : "Select a society in the top bar"} readOnly/></div>
            <div className="form-group"><label>Unit *</label><select value={form.unitId} onChange={(e)=>{set("unitId",e.target.value);set("ledgerAccountId","");setCalculation(null);}} required disabled={loading}><option value="">Select unit</option>{units.map((u)=><option key={u.id} value={u.id}>{[u.tower?.name,u.floor?.name,u.unitNumber||u.unitName||u.name].filter(Boolean).join(" / ")}</option>)}</select>{!loading&&!units.length&&<small>No units found for the selected society.</small>}</div>
            <div className="form-group"><label>Receivable ledger *</label><select value={form.ledgerAccountId} onChange={(e)=>set("ledgerAccountId",e.target.value)} required disabled={!form.unitId||loading}><option value="">Select ledger account</option>{matchingLedgers.map((l)=><option key={l.id} value={l.id}>{l.ledgerCode} - {l.ledgerName}{l.unitId?"":" (society ledger)"}</option>)}</select>{form.unitId&&!matchingLedgers.length&&<><small>No active ledger account is available for this unit.</small>{receivableAccounts.length>0?<button type="button" className="society-workflow-action" onClick={()=>setShowLedgerForm((visible)=>!visible)}><Plus size={15}/> Add ledger for this unit</button>:<small>Create an active RECEIVABLE account in Finance &gt; Accounts first.</small>}</>}</div>
            {showLedgerForm&&form.unitId&&!matchingLedgers.length&&<section className="billing-ledger-create form-group-full" aria-label="Create unit ledger"><div className="form-section-title"><h3>Create receivable ledger</h3><span>Link this unit to an active receivable account.</span></div><div className="billing-ledger-create-controls"><select aria-label="Receivable chart account" value={ledgerAccountId} onChange={(e)=>setLedgerAccountId(e.target.value)}><option value="">Select receivable chart account</option>{receivableAccounts.map((account)=><option key={account.id} value={account.id}>{account.accountCode} - {account.accountName}</option>)}</select><button type="button" className="btn-primary" disabled={creatingLedger||!ledgerAccountId} onClick={createUnitLedger}>{creatingLedger?"Creating...":"Create ledger"}</button><button type="button" className="btn-secondary" disabled={creatingLedger} onClick={()=>setShowLedgerForm(false)}>Cancel</button></div></section>}
            <div className="form-group"><label>Billing rule</label><select value={form.billingRuleCode} onChange={(e)=>{set("billingRuleCode",e.target.value);setCalculation(null);}}><option value="">Manual charge</option>{billingRules.map((r)=><option key={r.id} value={r.code}>{r.code} - {r.name} ({r.billingModel})</option>)}</select></div>
            <div className="form-group"><label>Bill number *</label><input value={form.billNumber} onChange={(e)=>set("billNumber",e.target.value)} required/></div><div className="form-group"><label>Billing period *</label><input value={form.billingPeriod} onChange={(e)=>set("billingPeriod",e.target.value)} placeholder="YYYY-MM" required/></div>
            <div className="form-group"><label>Bill date *</label><input type="date" value={form.billDate} onChange={(e)=>{set("billDate",e.target.value);setCalculation(null);}} required/></div><div className="form-group"><label>Due date *</label><input type="date" value={form.dueDate} onChange={(e)=>set("dueDate",e.target.value)} required/></div>
            {form.billingRuleCode ? <><div className="form-group"><label>Tax amount</label><input type="number" min="0" step="0.01" value={form.taxAmount} onChange={(e)=>{set("taxAmount",e.target.value);setCalculation(null);}}/></div><div className="form-group"><label>Penalty amount</label><input type="number" min="0" step="0.01" value={form.penaltyAmount} onChange={(e)=>{set("penaltyAmount",e.target.value);setCalculation(null);}}/></div></> : <><div className="form-group"><label>Charge subtotal *</label><input type="number" min="0.01" step="0.01" value={form.subtotal||""} onChange={(e)=>set("subtotal",e.target.value)} required/></div><div className="form-group"><label>Tax amount</label><input type="number" min="0" step="0.01" value={form.taxAmount} onChange={(e)=>set("taxAmount",e.target.value)}/></div><div className="form-group"><label>Penalty amount</label><input type="number" min="0" step="0.01" value={form.penaltyAmount} onChange={(e)=>set("penaltyAmount",e.target.value)}/></div></>}
            <div className="form-group"><label>Description</label><input value={form.description} onChange={(e)=>set("description",e.target.value)}/></div>
        </div>{form.billingRuleCode&&<div className="form-section"><button type="button" className="btn-secondary" onClick={calculate}>Calculate bill</button>{calculation&&<p>Charge {calculation.subtotal} | Previous balance {calculation.previousBalance} | Tax {calculation.taxAmount} | Penalty {calculation.penaltyAmount} | Total {amount}</p>}</div>}</div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving||loading}>{saving?"Creating...":"Create draft bill"}</button></footer></form>
    </section>;
};
export default BillingForm;


