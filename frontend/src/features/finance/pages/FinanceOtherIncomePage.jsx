import { useEffect, useMemo, useState } from 'react';
import { Coins, Plus, Search, X } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import societyBankAccountApi from '../api/societyBankAccount.api';
import otherIncomeApi from '../api/otherIncome.api';

const categories = [
  ['SHOP_RENT', 'Shop rent'], ['VENDOR_FEE', 'Vendor fee'], ['PARKING', 'Parking'],
  ['HALL_BOOKING', 'Hall booking'], ['INTEREST', 'Interest'], ['OTHER', 'Other'],
];
const methods = [['CASH', 'Cash'], ['BANK_TRANSFER', 'Bank transfer'], ['UPI', 'UPI'], ['CHEQUE', 'Cheque'], ['OTHER', 'Other']];
const societyId = () => String(localStorage.getItem('selectedSocietyId') || '').replace(/^:+/, '').trim();
const rowsFrom = (r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.records) ? r.records : [];
const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount || 0));
const initial = { category: 'Vendor fee', payerName: '', amount: '', receivedDate: new Date().toISOString().slice(0, 10), paymentMethod: 'CASH', bankAccountId: '', referenceNumber: '', description: '' };
const categoryLabel = (value) => categories.find(([key]) => key === value)?.[1] || String(value || '').replaceAll('_', ' ');

export default function FinanceOtherIncomePage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('OTHER_INCOME_CREATE');
  const [entries, setEntries] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const id = societyId();
      const [income, bankAccounts] = await Promise.all([otherIncomeApi.list(id), societyBankAccountApi.getAll(id)]);
      setEntries(rowsFrom(income));
      setBanks(rowsFrom(bankAccounts).filter((account) => account.isActive));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load other income.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((item) => !q || [item.payerName, item.category, item.description, item.receiptNumber, item.referenceNumber].join(' ').toLowerCase().includes(q));
  }, [entries, search]);
  const total = entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError(''); setNotice('');
      await otherIncomeApi.create({ ...form, societyId: societyId(), amount: Number(form.amount), bankAccountId: form.bankAccountId || null });
      setForm(initial); setShowForm(false); setNotice('Income entry saved and added to the society financial reports.');
      await load();
    } catch (err) { setError(err.response?.data?.message || 'Could not record this income.'); }
    finally { setSaving(false); }
  };

  return <section className="society-dashboard module-shell-page finance-module-page finance-other-income-page">
    <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div><h1>Other income</h1><p>Record money received from society sources outside maintenance billing.</p></div>{canCreate && <button type="button" className="society-add-button" onClick={() => { setError(''); setShowForm(true); }}><Plus size={18} /> Record income</button>}</header>
    {error && <div className="society-error" role="alert">{error}<button type="button" onClick={load}>Try again</button></div>}
    {notice && <div className="finance-income-notice" role="status">{notice}<button type="button" aria-label="Dismiss" onClick={() => setNotice('')}><X size={16} /></button></div>}
    <div className="finance-income-summary"><article><span>Total other income recorded</span><strong>{loading ? '—' : money(total)}</strong><small>Across {entries.length} {entries.length === 1 ? 'receipt' : 'receipts'}</small></article><article><span>Common sources</span><strong>Shop rent · Vendor fees</strong><small>Parking, hall bookings, and other receipts are supported too</small></article></div>
    <section className="society-list-panel"><div className="society-list-heading"><div><h2>Income register</h2><p>Each receipt is posted to Finance reports when saved.</p></div><span className="society-count">{loading ? 'Loading' : `${filtered.length} entries`}</span></div>
      <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search other income" placeholder="Search payer, source, receipt, or reference" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
      {loading ? <div className="society-loading">Loading income entries...</div> : filtered.length ? <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Received</th><th>Source</th><th>Payer</th><th>Description</th><th>Method</th><th>Receipt</th><th>Amount</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{String(item.receivedDate).slice(0, 10)}</td><td>{categoryLabel(item.category)}</td><td><strong>{item.payerName}</strong></td><td>{item.description || '—'}</td><td>{methods.find(([key]) => key === item.paymentMethod)?.[1] || item.paymentMethod}</td><td>{item.receiptNumber}</td><td><strong>{money(item.amount)}</strong></td></tr>)}</tbody></table></div> : <div className="society-empty"><span className="society-empty-icon"><Coins size={24} /></span><h3>{search ? 'No matching income entries' : 'No other income recorded'}</h3><p>{search ? 'Try a different search.' : 'Record shop rent, vendor fees, parking, or another payment received by the society.'}</p>{!search && canCreate && <button type="button" className="society-add-button" onClick={() => setShowForm(true)}><Plus size={17} /> Record first income</button>}</div>}
    </section>
    {showForm && <div className="society-modal-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="society-form-modal finance-income-modal" role="dialog" aria-modal="true" aria-labelledby="finance-income-title"><header className="society-form-header"><div><h2 id="finance-income-title">Record other income</h2><p>Enter a payment already received by the society.</p></div><button type="button" className="modal-close-btn" aria-label="Close" onClick={() => setShowForm(false)}><X size={18} /></button></header><form onSubmit={submit}><div className="finance-income-form-grid">
      <label>Income source *<input required maxLength="80" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="For example: Shop rent or fruit vendor fee" /></label>
      <label>Payer / tenant *<input required maxLength="160" value={form.payerName} onChange={(e) => setForm({ ...form, payerName: e.target.value })} placeholder="Vendor or tenant name" /></label>
      <label>Amount (₹) *<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
      <label>Received date *<input required type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} /></label>
      <label>Payment method *<select required value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{methods.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {form.paymentMethod !== 'CASH' && <label>Society bank account<select value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}><option value="">Choose account (optional)</option>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName} · {bank.accountNumberMasked}</option>)}</select></label>}
      <label>Reference number<input maxLength="120" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="Transaction or cheque number" /></label>
      <label className="wide">Description<textarea rows="3" maxLength="1000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="For example: Fruit vendor fee — 27 October" /></label>
    </div><footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save income'}</button></footer></form></section></div>}
  </section>;
}
