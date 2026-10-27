import { useEffect, useState } from 'react';
import { Landmark, Plus, Search, SquarePen, Trash2 } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import societyBankAccountApi from '../api/societyBankAccount.api';
import SocietyBankAccountForm from '../components/SocietyBankAccountForm';

const societyId = () => String(localStorage.getItem('selectedSocietyId') || '').replace(/^:+/, '').trim();
const rowsFrom = (response) => {
  const rows = Array.isArray(response) ? response : response?.data || response?.records || [];
  return Array.isArray(rows) ? rows : [];
};

export default function FinanceAccountSettingsPage() {
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');
  const canCreate = hasPermission('SOCIETY_BANK_ACCOUNT_CREATE');
  const canUpdate = hasPermission('SOCIETY_BANK_ACCOUNT_UPDATE');
  const canDelete = hasPermission('SOCIETY_BANK_ACCOUNT_DELETE');

  const loadData = async () => {
    const id = societyId();
    if (!id) {
      setAccounts([]);
      setError('Select a society from the top bar to manage its bank accounts.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      setAccounts(rowsFrom(await societyBankAccountApi.getAll(id)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load society bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const query = search.trim().toLowerCase();
  const filtered = accounts.filter((account) => !query || [account.bankName, account.accountHolderName, account.accountNumberMasked, account.accountType, account.ifsc, account.branchName].join(' ').toLowerCase().includes(query));

  const deactivate = async (account) => {
    if (!window.confirm(`Deactivate the ${account.bankName} account ending ${account.accountNumberMasked?.slice(-4) || '••••'}?`)) return;
    try {
      setBusyId(account.id);
      setError('');
      await societyBankAccountApi.deactivate(account.id, societyId());
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not deactivate this bank account.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="society-dashboard module-shell-page finance-module-page finance-account-settings-page">
      <header className="society-heading">
        <div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div><h1>Account settings</h1><p>Manage bank accounts owned by the selected society.</p></div>
        {canCreate && <button type="button" className="society-add-button" onClick={() => setEditing({})}><Plus size={18} /> Add bank account</button>}
      </header>

      {error && <div className="society-error" role="alert">{error}<button type="button" onClick={loadData}>Try again</button></div>}

      <section className="society-list-panel">
        <div className="society-list-heading"><div><h2>Society bank accounts</h2><p>Account numbers are masked in this list. Mark one account as the society’s primary account.</p></div><span className="society-count">{loading ? 'Loading' : `${filtered.length} accounts`}</span></div>
        <div className="society-toolbar"><label className="society-search"><Search size={17} /><input aria-label="Search society bank accounts" placeholder="Search bank, account holder, IFSC, or branch" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {loading ? <div className="society-loading">Loading society bank accounts...</div> : filtered.length ? (
          <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Bank</th><th>Account holder</th><th>Account number</th><th>Type</th><th>IFSC</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filtered.map((account) => <tr key={account.id}>
              <td><div className="finance-bank-name"> <strong>{account.bankName}</strong>{account.isPrimary && <span className="finance-primary-badge">Primary</span>}</div></td>
              <td>{account.accountHolderName}</td><td>{account.accountNumberMasked}</td><td>{String(account.accountType || '').replaceAll('_', ' ')}</td><td>{account.ifsc}</td><td>{account.branchName || '—'}</td>
              <td>{account.isActive ? 'Active' : 'Inactive'}</td>
              <td><div className="society-row-actions">{canUpdate && account.isActive && <button type="button" className="society-icon-action" aria-label={`Edit ${account.bankName} account`} title="Edit account" onClick={() => setEditing(account)}><SquarePen size={16} /></button>}{canDelete && account.isActive && <button type="button" className="society-icon-action society-delete-action" aria-label={`Deactivate ${account.bankName} account`} title="Deactivate account" disabled={busyId === account.id} onClick={() => deactivate(account)}><Trash2 size={16} /></button>}</div></td>
            </tr>)}
          </tbody></table></div>
        ) : <div className="society-empty"><span className="society-empty-icon"><Landmark size={24} /></span><h3>{query ? 'No matching bank accounts' : 'No society bank accounts yet'}</h3><p>{query ? 'Try a different search.' : 'Add the society bank account used for collections and payments.'}</p>{!query && canCreate && <button type="button" className="society-add-button" onClick={() => setEditing({})}><Plus size={17} /> Add bank account</button>}</div>}
      </section>

      {editing && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><SocietyBankAccountForm account={editing.id ? editing : null} onClose={() => setEditing(null)} onSuccess={async () => { setEditing(null); await loadData(); }} /></div>}
    </section>
  );
}
