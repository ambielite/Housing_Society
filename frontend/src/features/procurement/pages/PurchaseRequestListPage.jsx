import { useState } from 'react';
import { ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import { RequestStatusBadge } from '../components/ProcurementBadges';
import { REQUEST_STATUSES } from '../components/procurementOptions';

export default function PurchaseRequestListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const notice = useLocation().state?.notice;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, loading, error, reload } = useFetch(
    () => (societyId ? procurementApi.listRequests({ societyId, status }) : Promise.resolve(null)),
    [societyId, status]
  );

  const newButton = hasPermission('PURCHASE_REQUEST_CREATE') && (
    <Link to="/procurement/requests/new" className="society-add-button">
      <Plus size={16} /> New purchase request
    </Link>
  );

  if (!societyId) {
    return (
      <section className="society-dashboard purchase-orders-page">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Purchase Requests</h1><p>Track purchase requests from draft through approval and order.</p></div></header>
        <SocietyIdPrompt />
      </section>
    );
  }

  // The list isn't paged, so searching happens in the browser.
  const term = search.trim().toLowerCase();
  const rows = data ? data.filter((r) => !term || `${r.request_no} ${r.department || ''}`.toLowerCase().includes(term)) : null;
  const filtersActive = Boolean(term || status);

  const columns = [
    {
      key: 'request',
      header: 'Request',
      render: (r) => (
        <>
          <Link to={`/procurement/requests/${r.id}`} className="cell-title">
            {r.request_no}
          </Link>
          {r.department && <span className="cell-sub">{r.department}</span>}
        </>
      ),
    },
    { key: 'date', header: 'Requested on', render: (r) => formatDate(r.requested_date) },
    { key: 'amount', header: 'Estimated amount', render: (r) => formatCurrency(r.estimated_amount) },
    { key: 'status', header: 'Status', render: (r) => <RequestStatusBadge status={r.status} /> },
  ];

  return (
    <section className="society-dashboard purchase-orders-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Purchase Requests</h1><p>Track purchase requests from draft through approval and order.</p></div><div className="purchase-orders-actions"><button type="button" className="society-workflow-action" onClick={reload} disabled={loading}><RefreshCw size={16} /> Refresh</button>{newButton}</div></header>
      {notice && <Alert variant="success">{notice}</Alert>}
      <section className="society-list-panel purchase-orders-panel">
        <div className="society-list-heading"><div><h2>Purchase requests</h2><p>Review requested dates, estimated amounts, departments, and status.</p></div><span className="society-count">{loading ? 'Loading' : `${rows?.length || 0} requests`}</span></div>
        <div className="society-toolbar purchase-orders-toolbar">
          <label className="society-search"><ClipboardList size={17} /><input type="search" placeholder="Search by request number or department" aria-label="Search purchase requests" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select className="input toolbar-select" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{REQUEST_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </div>
        {error && !data && <Alert>{getErrorMessage(error)} <button type="button" className="society-workflow-action" onClick={reload}>Try again</button></Alert>}
        <div className="purchase-orders-table"><DataTable columns={columns} rows={rows} loading={loading} error={error ? getErrorMessage(error) : ''} onRetry={reload} emptyTitle={filtersActive ? 'No requests match these filters' : 'No purchase requests yet'} emptyMessage={filtersActive ? 'Try a different search or status.' : 'Raise a purchase request to start buying something.'} emptyAction={filtersActive ? <button type="button" className="society-workflow-action" onClick={() => { setSearch(''); setStatus(''); }}>Clear filters</button> : newButton || null} /></div>
      </section>
    </section>
  );
}
