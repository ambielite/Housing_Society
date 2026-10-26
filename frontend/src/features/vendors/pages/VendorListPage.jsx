import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Truck, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import useDebounce from '../../../utils/useDebounce';
import { getErrorMessage } from '../../../lib/axios';
import { fullName } from '../../../utils/format';
import * as vendorsApi from '../api/vendors.api';
import * as userApi from '../../users/api/user.api';
import VendorForm from '../components/VendorForm';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import { VendorStatusBadge } from '../components/VendorBadges';
import { VENDOR_STATUSES } from '../components/vendorOptions';

const PAGE_SIZE = 10;

export default function VendorListPage() {
  const { hasPermission, roles } = useAuth();
  const { societyId } = useSociety();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [showCreate, setShowCreate] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());

  // A vendor's own login only ever sees its own record, so it doesn't need a society chosen.
  const vendorOnly = roles.length === 1 && roles[0] === 'VENDOR';
  const ready = Boolean(societyId) || vendorOnly;
  const canPickLogin = hasPermission('USER_READ') && Boolean(societyId);
  const users = useFetch(
    () => (canPickLogin ? userApi.listUsers({ societyId, status: 'ACTIVE', limit: 100 }) : Promise.resolve(null)),
    [canPickLogin, societyId]
  );
  const userOptions = users.data ? users.data.users.map((user) => ({ value: user.id, label: `${fullName(user)} (${user.email})` })) : [];

  const { data, loading, error, reload } = useFetch(
    () => (ready ? vendorsApi.listVendors({ societyId, status, search: debouncedSearch, page, limit: PAGE_SIZE }) : Promise.resolve(null)),
    [ready, societyId, status, debouncedSearch, page]
  );

  const newButton = hasPermission('VENDOR_CREATE') && (
    <button type="button" className="society-add-button" onClick={() => { setCreateError(''); setShowCreate(true); }}>
      <Plus size={16} /> New vendor
    </button>
  );

  const closeCreate = useCallback(() => {
    if (createSaving) return;
    setShowCreate(false);
    setCreateError('');
  }, [createSaving]);

  useEffect(() => {
    if (!showCreate) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => { if (event.key === 'Escape') closeCreate(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreate, closeCreate]);

  const createVendor = async (payload) => {
    setCreateSaving(true);
    setCreateError('');
    try {
      await vendorsApi.createVendor({ ...payload, societyId });
      setShowCreate(false);
      setNotice('Vendor created as Pending. Add and verify their documents, then set the status to Active.');
      await reload();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreateSaving(false);
    }
  };

  if (!ready) {
    return (
      <section className="society-dashboard purchase-orders-page vendor-module-page">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> SUPPLIERS</div><h1>Manage Vendors</h1><p>Service providers and suppliers your society works with.</p></div></header>
        <SocietyIdPrompt />
      </section>
    );
  }

  const filtersActive = Boolean(status || debouncedSearch);

  const columns = [
    {
      key: 'name',
      header: 'Vendor',
      render: (vendor) => (
        <>
          <Link to={`/vendors/${vendor.id}`} className="cell-title">
            {vendor.legal_name}
          </Link>
          {vendor.trade_name && <span className="cell-sub">{vendor.trade_name}</span>}
        </>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (vendor) =>
        vendor.contact_email || vendor.phone ? (
          <>
            {vendor.contact_email && <span className="cell-title-plain">{vendor.contact_email}</span>}
            {vendor.phone && <span className="cell-sub">{vendor.phone}</span>}
          </>
        ) : (
          '-'
        ),
    },
    { key: 'gstin', header: 'GSTIN', render: (vendor) => (vendor.gstin ? <span className="mono">{vendor.gstin}</span> : '-') },
    { key: 'status', header: 'Status', render: (vendor) => <VendorStatusBadge status={vendor.status} /> },
  ];

  return (
    <section className="society-dashboard purchase-orders-page vendor-module-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> SUPPLIERS</div><h1>Manage Vendors</h1><p>Service providers and suppliers your society works with.</p></div><div className="purchase-orders-actions"><button type="button" className="society-workflow-action" onClick={reload} disabled={loading}><RefreshCw size={16} /> Refresh</button>{newButton}</div></header>
      {notice && <Alert variant="success">{notice}</Alert>}
      <section className="society-list-panel purchase-orders-panel">
        <div className="society-list-heading"><div><h2>Vendors</h2><p>Manage supplier contact details, verification, and status.</p></div><span className="society-count">{loading ? 'Loading' : `${data?.pagination?.total ?? data?.vendors?.length ?? 0} vendors`}</span></div>
        <div className="society-toolbar purchase-orders-toolbar">
          <label className="society-search"><Truck size={17} /><input type="search" placeholder="Search by vendor name" aria-label="Search vendors" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
          <select className="input toolbar-select" aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{VENDOR_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </div>
        {error && !data && <Alert>{getErrorMessage(error)} <button type="button" className="society-workflow-action" onClick={reload}>Try again</button></Alert>}
        <div className="purchase-orders-table"><DataTable
        columns={columns}
        rows={data ? data.vendors : null}
        loading={loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={filtersActive ? 'No vendors match these filters' : 'No vendors yet'}
        emptyMessage={filtersActive ? 'Try a different search or status.' : 'Add your first vendor to get started.'}
        emptyAction={
          filtersActive ? (
            <button
              type="button"
              className="society-workflow-action"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPage(1);
              }}
            >
              Clear filters
            </button>
          ) : (
            newButton || null
          )
        }
        pagination={data ? { ...data.pagination, onPageChange: setPage } : null}
        /></div>
      </section>
      {showCreate && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
        <section className="society-form-modal vendor-create-modal" role="dialog" aria-modal="true" aria-labelledby="vendor-create-title">
          <header className="society-form-header"><div><h2 id="vendor-create-title">Add Vendor</h2><p>Enter the supplier’s registered business and contact details.</p></div><button type="button" className="modal-close-btn" onClick={closeCreate} disabled={createSaving} aria-label="Close vendor form"><X size={20} /></button></header>
          {users.error && <Alert>Could not load user accounts: {getErrorMessage(users.error)}</Alert>}
          {users.loading && canPickLogin && <p className="vendor-create-loading">Loading user accounts...</p>}
          <VendorForm key="new-vendor-modal" mode="create" userOptions={userOptions} onSubmit={createVendor} onCancel={closeCreate} saving={createSaving} error={createError} />
        </section>
      </div>}
    </section>
  );
}
