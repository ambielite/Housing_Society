import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as poApi from '../api/purchase-orders.api';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import { FullPageLoader } from '../../../components/ui/Spinner';
import PurchaseOrderLineForm from '../components/PurchaseOrderLineForm';
import GoodsReceiptForm from '../components/GoodsReceiptForm';
import { PurchaseOrderStatusBadge } from '../components/PurchaseOrderBadges';
import { PO_STATUS_TRANSITIONS, PO_STATUS_LABELS } from '../components/purchaseOrderOptions';
import useVendorDirectory from '../../procurement/components/useVendorDirectory';
import assetsApi from '../../assets/api/assets.api';

export default function PurchaseOrderDetailPage() {
  const { poId: routePoId, id: routeId } = useParams();
  const poId = routePoId || routeId;
  const location = useLocation();
  const { hasPermission } = useAuth();
  const po = useFetch(() => (poId ? poApi.getPurchaseOrder(poId) : Promise.resolve(null)), [poId]);
  const [showLine, setShowLine] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const { nameOf } = useVendorDirectory(po.data?.society_id);
  const assetCategoryResult = useFetch(() => assetsApi.getCategories(), [po.data?.society_id]);
  const assetCategories = assetCategoryResult.data?.data || assetCategoryResult.data?.categories || [];
  const lines = useFetch(() => (poId && po.data ? poApi.listPurchaseOrderLines(poId) : Promise.resolve([])), [poId, po.data?.updated_at]);
  const receipts = useFetch(() => (poId && po.data ? poApi.listGoodsReceipts(poId) : Promise.resolve([])), [poId, po.data?.updated_at]);
  const receiptDetail = useFetch(() => (selectedReceiptId ? poApi.getGoodsReceipt(selectedReceiptId) : Promise.resolve(null)), [selectedReceiptId]);
  const [selectedStatus, setSelectedStatus] = useState('');

  
  if (po.loading && !po.data) return <FullPageLoader />;
  if (po.error && !po.data) return <div className="empty-state"><h1>Couldn’t load purchase order</h1><p>{getErrorMessage(po.error)}</p><Link to="/purchase-orders">Back to purchase orders</Link></div>;

  const target = po.data;
  const orderLines = lines.data || target.lines || [];
  const transitions = PO_STATUS_TRANSITIONS[target.status] || [];
  const save = async (fn, success) => { setSaving(true); setError(''); try { await fn(); setNotice(success); setShowLine(false); setShowReceipt(false); setShowStatus(false); po.reload(); receipts.reload(); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); } };
  const addLine = (payload) => save(() => poApi.addPurchaseOrderLine(poId, payload), 'Purchase order line added.');
  const recordReceipt = (payload) => save(() => poApi.createGoodsReceipt(payload), 'Goods receipt recorded.');
  const changeStatus = (status) => save(() => poApi.updatePurchaseOrderStatus(poId, status), `Purchase order moved to ${PO_STATUS_LABELS[status]}.`);

  const canEdit = hasPermission('PURCHASE_ORDER_UPDATE') && !['PAID', 'CANCELLED'].includes(target.status);
  const canReceive = hasPermission('GOODS_RECEIPT_CREATE') && !['CANCELLED', 'PAID'].includes(target.status);

  return (
    <section className="society-dashboard purchase-orders-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>{target.po_no}</h1><p>{nameOf(target.vendor_id)}</p></div><div className="purchase-orders-actions">
        {canEdit && transitions.length > 0 && <button className="society-workflow-action" type="button" onClick={() => { setError(''); setShowStatus(true); }}>Change status</button>}
        {canEdit && <button className="society-workflow-action" type="button" onClick={() => { setError(''); setShowLine(true); }}>+ Add line</button>}
        {canReceive && orderLines.length > 0 && <button className="society-add-button" type="button" onClick={() => { setError(''); setShowReceipt(true); }}>Record receipt</button>}
      </div></header>
      <p className="purchase-orders-back-link"><Link to="/purchase-orders">← All purchase orders</Link></p>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && !showLine && !showReceipt && !showStatus && <Alert>{error}</Alert>}

      <section className="society-list-panel purchase-orders-detail-panel">
        <div className="society-list-heading"><div><h2>Order details</h2><p>Supplier, schedule, status, and linked request.</p></div><PurchaseOrderStatusBadge status={target.status} /></div>
        <dl className="details">
          <dt>Vendor</dt><dd>{nameOf(target.vendor_id)}</dd>
          <dt>PO date</dt><dd>{formatDate(target.po_date)}</dd>
          <dt>Delivery date</dt><dd>{formatDate(target.delivery_date)}</dd>
          <dt>Purchase request</dt><dd>{target.purchase_request_id ? (hasPermission('PURCHASE_REQUEST_READ') ? <Link to={`/procurement/requests/${target.purchase_request_id}`}>{target.purchase_request_no || 'View linked request'}</Link> : target.purchase_request_no || 'Purchase request') : '-'}</dd>
          <dt>Created</dt><dd>{formatDateTime(target.created_at)}</dd>
          <dt>Updated</dt><dd>{formatDateTime(target.updated_at)}</dd>
        </dl>
      </section>

      <section className="society-list-panel purchase-orders-detail-panel">
        <div className="society-list-heading"><div><h2>Order lines</h2><p>Items, quantities, prices and calculated totals.</p></div></div>
        <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Item</th><th>Asset category</th><th>Qty</th><th>Unit price</th><th>Tax</th><th>Total</th></tr></thead><tbody>
          {orderLines.map((line) => <tr key={line.id}><td>{line.item_description}</td><td>{line.asset_category_name || '—'}</td><td>{line.quantity}</td><td>{formatCurrency(line.unit_price)}</td><td>{formatCurrency(line.tax)}</td><td>{formatCurrency(line.total)}</td></tr>)}
          {orderLines.length === 0 && <tr><td colSpan="6">No lines added yet.</td></tr>}
        </tbody></table></div>
        <div className="po-total-summary" aria-label="Purchase order totals">
          <div className="po-total-row"><span>Subtotal</span><strong>{formatCurrency(target.subtotal)}</strong></div>
          <div className="po-total-row"><span>Tax</span><strong>{formatCurrency(target.tax)}</strong></div>
          <div className="po-total-row po-grand-total"><span>Total</span><strong>{formatCurrency(target.total)}</strong></div>
        </div>
      </section>

      <section className="society-list-panel purchase-orders-detail-panel">
        <div className="society-list-heading"><div><h2>Goods receipts</h2><p>Receipts recorded against this purchase order.</p></div></div>
        <div className="society-table-wrap"><table className="society-table"><thead><tr><th>Receipt</th><th>Received</th><th>Status</th></tr></thead><tbody>
          {(receipts.data || []).map((receipt) => <tr key={receipt.id}><td className="mono"><button type="button" className="btn btn-link" onClick={() => setSelectedReceiptId(receipt.id)}>{receipt.receipt_no}</button></td><td>{formatDateTime(receipt.received_at)}</td><td>{receipt.status}</td></tr>)}
          {receipts.data && receipts.data.length === 0 && <tr><td colSpan="3">No goods receipts yet.</td></tr>}
        </tbody></table></div>
      </section>

      {selectedReceiptId && <Modal title="Goods receipt details" onClose={() => setSelectedReceiptId(null)} busy={receiptDetail.loading}>
        {receiptDetail.loading && <p>Loading receipt...</p>}
        {receiptDetail.error && <Alert>{getErrorMessage(receiptDetail.error)}</Alert>}
        {receiptDetail.data && <div className="card">
          <dl className="details">
            <dt>Receipt number</dt><dd className="mono">{receiptDetail.data.receipt_no}</dd>
            <dt>Status</dt><dd>{receiptDetail.data.status}</dd>
            <dt>Received</dt><dd>{formatDateTime(receiptDetail.data.received_at)}</dd>
          </dl>
          <div className="section">
            <h3>Receipt lines</h3>
            <div className="table-wrap"><table className="table"><thead><tr><th>PO line</th><th>Received</th><th>Accepted</th><th>Rejected</th></tr></thead><tbody>
              {(receiptDetail.data.lines || []).map((line) => <tr key={line.id}><td className="mono">{line.po_line_id}</td><td>{line.received_qty}</td><td>{line.accepted_qty ?? '-'}</td><td>{line.rejected_qty ?? '-'}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>}
      </Modal>}
      {showLine && <Modal title="Add purchase order line" onClose={() => setShowLine(false)} busy={saving}><PurchaseOrderLineForm saving={saving} error={error} onSubmit={addLine} onCancel={() => setShowLine(false)} assetCategories={assetCategories.filter((category) => (category.status || 'ACTIVE') === 'ACTIVE')} /></Modal>}
      {showReceipt && <Modal title="Record goods receipt" onClose={() => setShowReceipt(false)} busy={saving}><GoodsReceiptForm po={{ ...target, lines: orderLines }} saving={saving} error={error} onSubmit={recordReceipt} onCancel={() => setShowReceipt(false)} /></Modal>}
      {showStatus && (
  <Modal
    title="Change purchase order status"
    onClose={() => setShowStatus(false)}
    busy={saving}
  >
    <div>
      {error && <Alert>{error}</Alert>}

      <div className="field">
        <label htmlFor="poStatus">New status</label>

        <select
          id="poStatus"
          className="input"
          defaultValue=""
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={saving}
        >
          <option value="">Select status</option>

          {transitions.map((s) => (
            <option key={s} value={s}>
              {PO_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <p className="field-hint">
        Status transitions are enforced by the backend.
      </p>

      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => changeStatus(selectedStatus)}
          disabled={!selectedStatus || saving}
        >
          Change
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowStatus(false)}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
)}
      <p className="field-hint purchase-orders-updated">Last updated {formatDateTime(target.updated_at)}</p>
    </section>
  );
}
