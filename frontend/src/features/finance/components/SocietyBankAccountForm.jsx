import { useState } from 'react';
import societyBankAccountApi from '../api/societyBankAccount.api';

const societyId = () => String(localStorage.getItem('selectedSocietyId') || '').replace(/^:+/, '').trim();
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function SocietyBankAccountForm({ account, onClose, onSuccess }) {
  const [form, setForm] = useState({
    bankName: account?.bankName || '',
    accountHolderName: account?.accountHolderName || '',
    accountNumber: '',
    accountType: account?.accountType || 'CURRENT',
    ifsc: account?.ifsc || '',
    branchName: account?.branchName || '',
    upiId: account?.upiId || '',
    isPrimary: account?.isPrimary ?? false,
    remarks: account?.remarks || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedIfsc = form.ifsc.trim().toUpperCase();
    const accountNumber = form.accountNumber.replace(/[\s-]/g, '');
    if (!form.bankName.trim() || !form.accountHolderName.trim()) return setError('Bank name and account holder are required.');
    if (!account?.id && !/^\d{6,18}$/.test(accountNumber)) return setError('Enter an account number with 6 to 18 digits.');
    if (accountNumber && !/^\d{6,18}$/.test(accountNumber)) return setError('Enter an account number with 6 to 18 digits.');
    if (!IFSC_PATTERN.test(normalizedIfsc)) return setError('Enter a valid IFSC code, for example HDFC0001234.');
    try {
      setSaving(true);
      const payload = {
        societyId: societyId(),
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber,
        accountType: form.accountType,
        ifsc: normalizedIfsc,
        branchName: form.branchName.trim() || null,
        upiId: form.upiId.trim() || null,
        isPrimary: form.isPrimary,
        remarks: form.remarks.trim() || null,
      };
      if (account?.id) await societyBankAccountApi.update(account.id, payload);
      else await societyBankAccountApi.create(payload);
      await onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save society bank account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="society-bank-account-title">
      <header className="society-form-header">
        <div><h2 id="society-bank-account-title">{account ? 'Edit bank account' : 'Add bank account'}</h2><p>These details belong to the selected society.</p></div>
        <button type="button" className="modal-close-btn" onClick={onClose} disabled={saving} aria-label="Close">×</button>
      </header>
      <form onSubmit={submit}>
        <div className="society-form-body">
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-grid">
            <div className="form-group"><label htmlFor="society-bank-name">Bank name *</label><input id="society-bank-name" value={form.bankName} onChange={update('bankName')} maxLength={150} required /></div>
            <div className="form-group"><label htmlFor="society-bank-holder">Account holder name *</label><input id="society-bank-holder" value={form.accountHolderName} onChange={update('accountHolderName')} maxLength={255} required /></div>
            <div className="form-group"><label htmlFor="society-bank-number">Account number {account ? '(optional)' : '*'}</label><input id="society-bank-number" inputMode="numeric" autoComplete="off" value={form.accountNumber} onChange={update('accountNumber')} placeholder={account ? `Leave blank to keep ending ${account.accountNumberMasked?.slice(-4) || '••••'}` : 'Enter account number'} required={!account} /><small className="field-hint">Account number is masked after saving.</small></div>
            <div className="form-group"><label htmlFor="society-bank-type">Account type *</label><select id="society-bank-type" value={form.accountType} onChange={update('accountType')}><option value="CURRENT">Current</option><option value="SAVINGS">Savings</option><option value="CASH_CREDIT">Cash credit</option><option value="OVERDRAFT">Overdraft</option></select></div>
            <div className="form-group"><label htmlFor="society-bank-ifsc">IFSC code *</label><input id="society-bank-ifsc" value={form.ifsc} onChange={update('ifsc')} maxLength={11} placeholder="HDFC0001234" required /></div>
            <div className="form-group"><label htmlFor="society-bank-branch">Branch</label><input id="society-bank-branch" value={form.branchName} onChange={update('branchName')} maxLength={150} /></div>
            <div className="form-group"><label htmlFor="society-bank-upi">UPI ID</label><input id="society-bank-upi" value={form.upiId} onChange={update('upiId')} maxLength={150} placeholder="society@bank" /></div>
            <div className="form-group form-group-full"><label htmlFor="society-bank-remarks">Notes</label><textarea id="society-bank-remarks" value={form.remarks} onChange={update('remarks')} rows="3" /></div>
            <div className="form-group form-group-full checkbox-row"><label className="checkbox-label"><input type="checkbox" checked={form.isPrimary} onChange={update('isPrimary')} /><span>Use as primary society account</span></label></div>
          </div>
        </div>
        <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : account ? 'Save changes' : 'Add account'}</button></footer>
      </form>
    </section>
  );
}
