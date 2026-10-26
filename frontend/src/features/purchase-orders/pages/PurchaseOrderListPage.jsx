import { useState } from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as poApi from '../api/purchase-orders.api';
import useVendorDirectory from '../../procurement/components/useVendorDirectory';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import { PurchaseOrderStatusBadge } from '../components/PurchaseOrderBadges';
import { PO_STATUSES } from '../components/purchaseOrderOptions';

export default function PurchaseOrderListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vendorId, setVendorId] = useState('');
  const { vendors, nameOf } = useVendorDirectory(societyId);
  const { data, loading, error, reload } = useFetch(
    () => (societyId ? poApi.listPurchaseOrders({ societyId, status, vendorId }) : Promise.resolve(null)),
    [societyId, status, vendorId]
  );

  if (!societyId) return <section className="society-dashboard purchase-orders-page"><header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Purchase Orders</h1><p>Issue and track supplier purchase orders.</p></div></header><SocietyIdPrompt /></section>;

  const term = search.trim().toLowerCase();
  const rows = data ? data.filter((po) => !term || `${po.po_no} ${po.vendor_id}`.toLowerCase().includes(term)) : null;
  const filtersActive = Boolean(term || status || vendorId);
  const newButton = hasPermission('PURCHASE_ORDER_CREATE') && <Link to="/purchase-orders/new" className="society-add-button"><Plus size={16} /> New purchase order</Link>;

  const columns = [
    { key: 'po', header: 'Purchase order', render: (po) => <><Link to={`/purchase-orders/${po.id}`} className="cell-title">{po.po_no}</Link><span className="cell-sub">{nameOf(po.vendor_id)}</span></> },
    { key: 'date', header: 'PO date', render: (po) => formatDate(po.po_date) },
    { key: 'delivery', header: 'Delivery', render: (po) => formatDate(po.delivery_date) },
    { key: 'total', header: 'Total', render: (po) => formatCurrency(po.total) },
    { key: 'status', header: 'Status', render: (po) => <PurchaseOrderStatusBadge status={po.status} /> },
  ];

  return (
    <section className="society-dashboard purchase-orders-page">
      <header className="society-heading">
        <div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Purchase Orders</h1><p>Issue and track supplier purchase orders.</p></div>
        <div className="purchase-orders-actions"><button type="button" className="society-workflow-action" onClick={reload} disabled={loading}><RefreshCw size={16} /> Refresh</button>{newButton}</div>
      </header>
      <section className="society-list-panel purchase-orders-panel">
        <div className="society-list-heading"><div><h2>Purchase orders</h2><p>Review supplier orders, delivery dates, totals, and status.</p></div><span className="society-count">{loading ? 'Loading' : `${rows?.length || 0} orders`}</span></div>
        <div className="society-toolbar purchase-orders-toolbar">
          <label className="society-search"><FileText size={17} /><input type="search" placeholder="Search PO number" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search purchase orders" /></label>
          <select className="input toolbar-select" value={vendorId} onChange={(e) => setVendorId(e.target.value)} aria-label="Filter by vendor"><option value="">All vendors</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.legal_name}</option>)}</select>
          <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{PO_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        </div>
        {error && !data && <Alert>{getErrorMessage(error)}</Alert>}
        <div className="purchase-orders-table"><DataTable columns={columns} rows={rows} loading={loading} error={error ? getErrorMessage(error) : ''} onRetry={reload} emptyTitle={filtersActive ? 'No purchase orders match these filters' : 'No purchase orders yet'} emptyMessage={filtersActive ? 'Try different filters.' : 'Create a purchase order to start tracking supplier purchases.'} emptyAction={filtersActive ? <button className="society-workflow-action" type="button" onClick={() => { setSearch(''); setStatus(''); setVendorId(''); }}>Clear filters</button> : newButton} /></div>
      </section>
    </section>
  );
}
