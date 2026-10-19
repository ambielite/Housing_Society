import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import PageContainer from '../../../components/layout/PageContainer';
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
    <Link to="/procurement/requests/new" className="btn btn-primary">
      <Plus size={16} /> New purchase request
    </Link>
  );

  if (!societyId) {
    return (
      <PageContainer title="Procurement" subtitle="Purchase requests, RFQs and vendor quotations.">
        <SocietyIdPrompt />
      </PageContainer>
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
    <PageContainer title="Procurement" subtitle="Purchase requests, RFQs and vendor quotations." actions={newButton}>
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search by request number or department"
          aria-label="Search purchase requests"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="input toolbar-select" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {REQUEST_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={filtersActive ? 'No requests match these filters' : 'No purchase requests yet'}
        emptyMessage={filtersActive ? 'Try a different search or status.' : 'Raise a purchase request to start buying something.'}
        emptyAction={
          filtersActive ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setStatus('');
              }}
            >
              Clear filters
            </button>
          ) : (
            newButton || null
          )
        }
      />
    </PageContainer>
  );
}
