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
import { QuotationStatusBadge, ResponseStatusBadge, RfqStatusBadge } from '../components/ProcurementBadges';
import InviteVendorForm from '../components/InviteVendorForm';
import QuotationForm from '../components/QuotationForm';
import ComparisonForm from '../components/ComparisonForm';
import useVendorDirectory from '../components/useVendorDirectory';

// The RFQ plus the request it belongs to (for the society and the back link).
const load = async (rfqId) => {
  const rfq = await procurementApi.getRfq(rfqId);
  let request = null;
  try {
    request = await procurementApi.getRequest(rfq.purchase_request_id);
  } catch {
    request = null;
  }
  return { rfq, request };
};

export default function RfqDetailPage() {
  const { rfqId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canSeeQuotes = hasPermission('QUOTATION_READ');
  const canCompare = hasPermission('QUOTATION_COMPARISON_MANAGE');

  const page = useFetch(() => load(rfqId), [rfqId]);
  const quotations = useFetch(() => (canSeeQuotes ? procurementApi.listQuotations(rfqId) : Promise.resolve(null)), [rfqId, canSeeQuotes]);
  const comparisons = useFetch(() => (canCompare ? procurementApi.listComparisons(rfqId) : Promise.resolve(null)), [rfqId, canCompare]);
  const directory = useVendorDirectory(page.data?.request?.society_id);

  const [dialog, setDialog] = useState(null); // 'invite' | 'quote' | 'score'
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [pageError, setPageError] = useState('');

  if (page.loading && !page.data) return <FullPageLoader />;

  if (page.error && !page.data) {
    const notFound = page.error.response?.status === 404;
    return (
      <div className="empty-state">
        <h1>{notFound ? 'RFQ not found' : "Couldn't load this RFQ"}</h1>
        <p>{notFound ? 'It may have been removed, or the link is wrong.' : getErrorMessage(page.error)}</p>
        <p>
          <Link to="/procurement/requests">Back to purchase requests</Link>
        </p>
      </div>
    );
  }

  const { rfq, request } = page.data;
  const invited = rfq.invitedVendors || [];
  const isOpen = rfq.status === 'OPEN';
  const quoteList = quotations.data || [];
  const scoreList = comparisons.data || [];

  const invitedIds = new Set(invited.map((i) => i.vendor_id));
  const quotedIds = new Set(quoteList.map((q) => q.vendor_id));
  const inviteOptions = directory.vendors
    .filter((v) => v.status === 'ACTIVE' && !invitedIds.has(v.id))
    .map((v) => ({ value: v.id, label: v.legal_name }));
  const quoteOptions = invited.filter((i) => !quotedIds.has(i.vendor_id)).map((i) => ({ value: i.vendor_id, label: directory.nameOf(i.vendor_id) }));
  const scoreOptions = invited.map((i) => ({ value: i.vendor_id, label: directory.nameOf(i.vendor_id) }));

  // Cheapest live quotation gets a "Lowest" tag.
  const live = quoteList.filter((q) => q.status !== 'REJECTED' && Number(q.total) > 0);
  const lowestTotal = live.length ? Math.min(...live.map((q) => Number(q.total))) : null;

  const openDialog = (name) => {
    setSaveError('');
    setNotice('');
    setPageError('');
    setDialog(name);
  };

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

  const invite = (vendorId) => run(() => procurementApi.inviteVendor(rfqId, vendorId), 'Vendor invited.', () => page.reload());
  const recordQuote = (payload) =>
    run(() => procurementApi.submitQuotation({ ...payload, rfqId }), '', (q) =>
      navigate(`/procurement/quotations/${q.id}`, { state: { notice: 'Quotation recorded. Add its line items so the total is calculated.' } })
    );
  const addScore = (payload) => run(() => procurementApi.addComparison(rfqId, payload), 'Score added.', () => comparisons.reload());

  const close = async () => {
    setSaving(true);
    try {
      await procurementApi.closeRfq(rfqId);
      setNotice('RFQ closed. No more quotations can be recorded.');
      page.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setConfirmClose(false);
    }
  };

  const inviteColumns = [
    { key: 'vendor', header: 'Vendor', render: (i) => <span className="cell-title">{directory.nameOf(i.vendor_id)}</span> },
    { key: 'invited', header: 'Invited', render: (i) => formatDateTime(i.invited_at) },
    { key: 'response', header: 'Response', render: (i) => <ResponseStatusBadge status={i.response_status} /> },
  ];

  const quoteColumns = [
    { key: 'vendor', header: 'Vendor', render: (q) => <span className="cell-title">{directory.nameOf(q.vendor_id)}</span> },
    {
      key: 'no',
      header: 'Quotation',
      render: (q) => (
        <Link to={`/procurement/quotations/${q.id}`} className="cell-title">
          {q.quotation_no}
        </Link>
      ),
    },
    { key: 'date', header: 'Date', render: (q) => formatDate(q.quotation_date) },
    { key: 'valid', header: 'Valid until', render: (q) => formatDate(q.valid_until) },
    {
      key: 'total',
      header: 'Total',
      render: (q) => (
        <>
          {formatCurrency(q.total)}
          {lowestTotal !== null && q.status !== 'REJECTED' && Number(q.total) === lowestTotal && live.length > 1 && (
            <span className="badge badge-active tag-gap">Lowest</span>
          )}
        </>
      ),
    },
    { key: 'status', header: 'Status', render: (q) => <QuotationStatusBadge status={q.status} /> },
  ];

  // Comparison summary: one row per invited vendor, with their quote and average score.
  const summaryRows = invited.map((i) => {
    const quote = quoteList.find((q) => q.vendor_id === i.vendor_id);
    const scores = scoreList.filter((s) => s.vendor_id === i.vendor_id && s.score !== null);
    const average = scores.length ? scores.reduce((sum, s) => sum + Number(s.score), 0) / scores.length : null;
    return { id: i.vendor_id, vendorId: i.vendor_id, total: quote ? quote.total : null, count: scores.length, average };
  });
  const summaryColumns = [
    { key: 'vendor', header: 'Vendor', render: (r) => <span className="cell-title">{directory.nameOf(r.vendorId)}</span> },
    { key: 'total', header: 'Quotation total', render: (r) => (r.total !== null ? formatCurrency(r.total) : 'No quotation') },
    { key: 'count', header: 'Scores recorded', render: (r) => r.count },
    { key: 'average', header: 'Average score', render: (r) => (r.average !== null ? r.average.toFixed(1) : '-') },
  ];
  const scoreColumns = [
    { key: 'vendor', header: 'Vendor', render: (s) => directory.nameOf(s.vendor_id) },
    { key: 'criterion', header: 'Criterion', render: (s) => <span className="cell-title">{s.criterion}</span> },
    { key: 'score', header: 'Score', render: (s) => (s.score !== null ? Number(s.score) : '-') },
    { key: 'remarks', header: 'Remarks', render: (s) => s.remarks || '-' },
  ];

  const actions =
    isOpen && hasPermission('RFQ_UPDATE') ? (
      <button type="button" className="btn btn-secondary" onClick={() => setConfirmClose(true)}>
        Close RFQ
      </button>
    ) : null;

  return (
    <PageContainer title={rfq.rfq_no} subtitle={request ? `For request ${request.request_no}` : 'Request for quotation'} actions={actions}>
      <p className="back-link">
        <Link to={`/procurement/requests/${rfq.purchase_request_id}`}>&larr; {request ? `Request ${request.request_no}` : 'Back to the request'}</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}
      {directory.error && <Alert>Vendor names couldn't be loaded, so short IDs are shown instead.</Alert>}

      <div className="card section">
        <h2 className="section-title">Details</h2>
        <dl className="details">
          <dt>Status</dt>
          <dd>
            <RfqStatusBadge status={rfq.status} />
          </dd>
          <dt>Issued</dt>
          <dd>{formatDate(rfq.issue_date)}</dd>
          <dt>Quote deadline</dt>
          <dd>{formatDate(rfq.due_date, 'No deadline')}</dd>
        </dl>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Invited vendors</h2>
            <p className="muted section-hint">Only invited vendors can send a quotation.</p>
          </div>
          {isOpen && hasPermission('RFQ_UPDATE') && (
            <button type="button" className="btn btn-primary" onClick={() => openDialog('invite')}>
              Invite vendor
            </button>
          )}
        </div>
        <DataTable columns={inviteColumns} rows={invited} emptyTitle="No vendors invited yet" emptyMessage="Invite at least two Active vendors so you can compare their quotes." />
      </div>

      {canSeeQuotes && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Quotations</h2>
              <p className="muted section-hint">One quotation per vendor. Open one to add its items and accept or reject it.</p>
            </div>
            {isOpen && hasPermission('QUOTATION_CREATE') && (
              <button type="button" className="btn btn-primary" onClick={() => openDialog('quote')}>
                Record quotation
              </button>
            )}
          </div>
          <DataTable
            columns={quoteColumns}
            rows={quotations.data}
            loading={quotations.loading}
            error={quotations.error ? getErrorMessage(quotations.error) : ''}
            onRetry={quotations.reload}
            emptyTitle="No quotations yet"
            emptyMessage="Record the quotations vendors send you."
          />
        </div>
      )}

      {canCompare && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Comparison</h2>
              <p className="muted section-hint">Score each vendor (0 to 100) on price, delivery, warranty and so on, then compare.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => openDialog('score')} disabled={!scoreOptions.length}>
              Add score
            </button>
          </div>
          <DataTable columns={summaryColumns} rows={summaryRows} emptyTitle="Nothing to compare yet" emptyMessage="Invite vendors and record their quotations first." />
          {scoreList.length > 0 && (
            <div className="table-gap">
              <DataTable
                columns={scoreColumns}
                rows={scoreList}
                loading={comparisons.loading}
                error={comparisons.error ? getErrorMessage(comparisons.error) : ''}
                onRetry={comparisons.reload}
              />
            </div>
          )}
        </div>
      )}

      {dialog === 'invite' && (
        <Modal title="Invite vendor" onClose={() => setDialog(null)} busy={saving}>
          <InviteVendorForm vendorOptions={inviteOptions} onSubmit={invite} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}
      {dialog === 'quote' && (
        <Modal title="Record quotation" onClose={() => setDialog(null)} busy={saving}>
          <QuotationForm vendorOptions={quoteOptions} onSubmit={recordQuote} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}
      {dialog === 'score' && (
        <Modal title="Add comparison score" onClose={() => setDialog(null)} busy={saving}>
          <ComparisonForm vendorOptions={scoreOptions} onSubmit={addScore} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmClose}
        title="Close this RFQ?"
        message="Vendors will no longer be able to send quotations. This can't be undone."
        confirmLabel="Close RFQ"
        busy={saving}
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </PageContainer>
  );
}
