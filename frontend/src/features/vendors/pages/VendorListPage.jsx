import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import useDebounce from '../../../utils/useDebounce';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import { VendorStatusBadge } from '../components/VendorBadges';
import { VENDOR_STATUSES } from '../components/vendorOptions';

const PAGE_SIZE = 10;

export default function VendorListPage() {
  const { hasPermission, roles } = useAuth();
  const { societyId } = useSociety();
  const notice = useLocation().state?.notice;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());

  // A vendor's own login only ever sees its own record, so it doesn't need a society chosen.
  const vendorOnly = roles.length === 1 && roles[0] === 'VENDOR';
  const ready = Boolean(societyId) || vendorOnly;

  const { data, loading, error, reload } = useFetch(
    () => (ready ? vendorsApi.listVendors({ societyId, status, search: debouncedSearch, page, limit: PAGE_SIZE }) : Promise.resolve(null)),
    [ready, societyId, status, debouncedSearch, page]
  );

  const newButton = hasPermission('VENDOR_CREATE') && (
    <Link to="/vendors/new" className="btn btn-primary">
      New vendor
    </Link>
  );

  if (!ready) {
    return (
      <PageContainer title="Vendors" subtitle="Service providers and suppliers your society works with.">
        <SocietyIdPrompt />
      </PageContainer>
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
    <PageContainer title="Vendors" subtitle="Service providers and suppliers your society works with." actions={newButton}>
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search by vendor name"
          aria-label="Search vendors"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="input toolbar-select"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {VENDOR_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
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
              className="btn btn-secondary"
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
      />
    </PageContainer>
  );
}
