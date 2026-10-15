import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { FullPageLoader } from '../../../components/ui/Spinner';
import StatusForm from '../../vendors/components/StatusForm';
import { RequestStatusBadge, RfqStatusBadge } from '../components/ProcurementBadges';
import RequestLineForm from '../components/RequestLineForm';
import RfqForm from '../components/RfqForm';
import { NEXT_REQUEST_STATUSES, REQUEST_STATUSES, friendlyDeleteError } from '../components/procurementOptions';

export default function PurchaseRequestDetailPage() {
  const { requestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const request = useFetch(() => procurementApi.getRequest(requestId), [requestId]);
  const canSeeRfqs = hasPermission('RFQ_READ');
  const rfqs = useFetch(() => (canSeeRfqs ? procurementApi.listRfqs(requestId) : Promise.resolve(null)), [requestId, canSeeRfqs]);

  const [dialog, setDialog] = useState(null); // 'status' | 'line' | 'rfq'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [pageError, setPageError] = useState('');

  const target = request.data;

  if (request.loading && !target) return <FullPageLoader />;

  if (request.error && !target) {
    const notFound = request.error.response?.status === 404;
    return (
      <div className="empty-state">
        <h1>{notFound ? 'Request not found' : "Couldn't load this request"}</h1>
        <p>{notFound ? 'It may have been deleted, or the link is wrong.' : getErrorMessage(request.error)}</p>
        <p>
          <Link to="/procurement/requests">Back to purchase requests</Link>
        </p>
      </div>
    );
  }

  const nextStatuses = NEXT_REQUEST_STATUSES[target.status] || [];
  const canChangeStatus = hasPermission('PURCHASE_REQUEST_UPDATE') && nextStatuses.length > 0;
  const canAddLine = hasPermission('PURCHASE_REQUEST_UPDATE') && target.status === 'DRAFT';
  const canCreateRfq = hasPermission('RFQ_CREATE') && ['SUBMITTED', 'QUOTATION'].includes(target.status);

  const openDialog = (name) => {
    setSaveError('');
    setNotice('');
    setPageError('');
    setDialog(name);
  };

  // One helper for every "save in a dialog" action.
  const run = async (action, successMessage, after) => {
    setSaving(true);
    setSaveError('');
    try {
      const result = await action();
      setDialog(null);
      setNotice(successMessage);
      if (after) after(result);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = (status) => run(() => procurementApi.updateRequestStatus(requestId, status), 'Request status updated.', () => request.reload());
  const saveLine = (payload) => run(() => procurementApi.addRequestLine(requestId, payload), 'Item added.', () => request.reload());
  const saveRfq = (payload) =>
    run(() => procurementApi.createRfq({ ...payload, purchaseRequestId: requestId }), 'RFQ created. Invite vendors to it next.', (rfq) =>
      navigate(`/procurement/rfqs/${rfq.id}`, { state: { notice: 'RFQ created. Invite vendors to it, then record their quotations.' } })
    );

  const remove = async () => {
    setSaving(true);
    try {
      await procurementApi.deleteRequest(requestId);
      navigate('/procurement/requests', { replace: true, state: { notice: `Request ${target.request_no} deleted.` } });
    } catch (err) {
      setPageError(friendlyDeleteError(err, 'request'));
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const lines = target.lines || [];
  const estimateTotal = lines.reduce((sum, l) => sum + (l.estimated_unit_cost ? Number(l.quantity) * Number(l.estimated_unit_cost) : 0), 0);

  const lineColumns = [
    { key: 'item', header: 'Item', render: (l) => <span className="cell-title">{l.item_description}</span> },
    { key: 'qty', header: 'Quantity', render: (l) => Number(l.quantity) },
    { key: 'cost', header: 'Estimated unit cost', render: (l) => formatCurrency(l.estimated_unit_cost) },
    {
      key: 'total',
      header: 'Estimated total',
      render: (l) => (l.estimated_unit_cost ? formatCurrency(Number(l.quantity) * Number(l.estimated_unit_cost)) : '-'),
    },
  ];

  const rfqColumns = [
    {
      key: 'rfq',
      header: 'RFQ',
      render: (r) => (
        <Link to={`/procurement/rfqs/${r.id}`} className="cell-title">
          {r.rfq_no}
        </Link>
      ),
    },
    { key: 'issued', header: 'Issued', render: (r) => formatDate(r.issue_date) },
    { key: 'due', header: 'Quote deadline', render: (r) => formatDate(r.due_date, 'No deadline') },
    { key: 'status', header: 'Status', render: (r) => <RfqStatusBadge status={r.status} /> },
  ];

  const actions = (
    <>
      {canChangeStatus && (
        <button type="button" className="btn btn-secondary" onClick={() => openDialog('status')}>
          Change status
        </button>
      )}
      {hasPermission('PURCHASE_REQUEST_DELETE') && (
        <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      )}
    </>
  );

  return (
    <PageContainer title={target.request_no} subtitle={target.department || 'Purchase request'} actions={actions}>
      <p className="back-link">
        <Link to="/procurement/requests">&larr; All purchase requests</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <div className="card section">
        <h2 className="section-title">Details</h2>
        <dl className="details">
          <dt>Status</dt>
          <dd>
            <RequestStatusBadge status={target.status} />
          </dd>
          <dt>Requested on</dt>
          <dd>{formatDate(target.requested_date)}</dd>
          <dt>Department</dt>
          <dd>{target.department || '-'}</dd>
          <dt>Estimated amount</dt>
          <dd>{formatCurrency(target.estimated_amount)}</dd>
          <dt>Justification</dt>
          <dd>{target.justification || '-'}</dd>
          <dt>Created</dt>
          <dd>{formatDateTime(target.created_at)}</dd>
        </dl>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Items requested</h2>
            <p className="muted section-hint">
              {lines.length ? `Estimated total ${formatCurrency(estimateTotal)}.` : 'What the society needs to buy.'}
              {!canAddLine && hasPermission('PURCHASE_REQUEST_UPDATE') && ' Items can only be added while the request is a Draft.'}
            </p>
          </div>
          {canAddLine && (
            <button type="button" className="btn btn-primary" onClick={() => openDialog('line')}>
              Add item
            </button>
          )}
        </div>
        <DataTable columns={lineColumns} rows={lines} emptyTitle="No items yet" emptyMessage="Add each item or service this request is for." />
      </div>

      {canSeeRfqs && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Requests for quotation (RFQs)</h2>
              <p className="muted section-hint">
                {canCreateRfq || !hasPermission('RFQ_CREATE')
                  ? 'Ask vendors to quote for this request.'
                  : 'Submit the request first. RFQs can be created once it is Submitted or in Quotation.'}
              </p>
            </div>
            {canCreateRfq && (
              <button type="button" className="btn btn-primary" onClick={() => openDialog('rfq')}>
                New RFQ
              </button>
            )}
          </div>
          <DataTable
            columns={rfqColumns}
            rows={rfqs.data}
            loading={rfqs.loading}
            error={rfqs.error ? getErrorMessage(rfqs.error) : ''}
            onRetry={rfqs.reload}
            emptyTitle="No RFQs yet"
            emptyMessage="An RFQ is where you invite vendors and collect their quotations."
          />
        </div>
      )}

      {dialog === 'status' && (
        <Modal title="Change request status" onClose={() => setDialog(null)} busy={saving}>
          <StatusForm
            options={REQUEST_STATUSES.filter((o) => o.value === target.status || nextStatuses.includes(o.value))}
            currentValue={target.status}
            hint="A request moves forward step by step: Draft, Submitted, Quotation, Approval, Approved, PO issued. It can be cancelled before a PO is issued."
            onSubmit={saveStatus}
            onCancel={() => setDialog(null)}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}
      {dialog === 'line' && (
        <Modal title="Add item" onClose={() => setDialog(null)} busy={saving}>
          <RequestLineForm onSubmit={saveLine} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}
      {dialog === 'rfq' && (
        <Modal title="New RFQ" onClose={() => setDialog(null)} busy={saving}>
          <RfqForm onSubmit={saveRfq} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this request?"
        message={`Request ${target.request_no} will be deleted for good. This only works if it has no RFQs. Otherwise, cancel it instead.`}
        confirmLabel="Delete request"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageContainer>
  );
}
