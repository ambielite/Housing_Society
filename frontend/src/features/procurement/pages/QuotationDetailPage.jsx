import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import * as vendorsApi from '../../vendors/api/vendors.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { FullPageLoader } from '../../../components/ui/Spinner';
import { QuotationStatusBadge } from '../components/ProcurementBadges';
import QuotationLineForm from '../components/QuotationLineForm';

// The quotation, plus the vendor's name and the RFQ number (both optional extras for display).
const load = async (quotationId) => {
  const quotation = await procurementApi.getQuotation(quotationId);
  const [vendor, rfq] = await Promise.all([
    vendorsApi.getVendor(quotation.vendor_id).catch(() => null),
    procurementApi.getRfq(quotation.rfq_id).catch(() => null),
  ]);
  return { quotation, vendor, rfq };
};

export default function QuotationDetailPage() {
  const { quotationId } = useParams();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const page = useFetch(() => load(quotationId), [quotationId]);

  const [showLine, setShowLine] = useState(false);
  const [deciding, setDeciding] = useState(null); // 'ACCEPTED' | 'REJECTED'
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [pageError, setPageError] = useState('');

  if (page.loading && !page.data) return <FullPageLoader />;

  if (page.error && !page.data) {
    const notFound = page.error.response?.status === 404;
    return (
      <div className="empty-state">
        <h1>{notFound ? 'Quotation not found' : "Couldn't load this quotation"}</h1>
        <p>{notFound ? 'It may have been removed, or the link is wrong.' : getErrorMessage(page.error)}</p>
        <p>
          <Link to="/procurement/requests">Back to purchase requests</Link>
        </p>
      </div>
    );
  }

  const { quotation, vendor, rfq } = page.data;
  const lines = quotation.lines || [];
  const isSubmitted = quotation.status === 'SUBMITTED';
  const rfqClosed = rfq?.status === 'CLOSED';
  const vendorName = vendor?.legal_name || `Vendor ${String(quotation.vendor_id).slice(0, 8)}`;

  const addLine = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await procurementApi.addQuotationLine(quotationId, payload);
      setShowLine(false);
      setNotice('Line added. The totals have been recalculated.');
      page.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const decide = async () => {
    setSaving(true);
    try {
      await procurementApi.decideQuotation(quotationId, deciding);
      setNotice(deciding === 'ACCEPTED' ? 'Quotation accepted.' : 'Quotation rejected.');
      setPageError('');
      page.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
      setNotice('');
    } finally {
      setSaving(false);
      setDeciding(null);
    }
  };

  const lineColumns = [
    { key: 'description', header: 'Item', render: (l) => <span className="cell-title">{l.description}</span> },
    { key: 'qty', header: 'Quantity', render: (l) => Number(l.quantity) },
    { key: 'price', header: 'Unit price', render: (l) => formatCurrency(l.unit_price) },
    { key: 'tax', header: 'Tax', render: (l) => formatCurrency(l.tax) },
    { key: 'total', header: 'Line total', render: (l) => formatCurrency(l.total) },
  ];

  const actions =
    isSubmitted && hasPermission('QUOTATION_UPDATE') ? (
      <>
        <button type="button" className="btn btn-danger" onClick={() => setDeciding('REJECTED')}>
          Reject
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setDeciding('ACCEPTED')} disabled={!rfqClosed} title={!rfqClosed ? 'Close the RFQ before selecting a vendor.' : undefined}>
          Select vendor
        </button>
      </>
    ) : null;

  return (
    <PageContainer title={quotation.quotation_no} subtitle={vendorName} actions={actions}>
      <p className="back-link">
        <Link to={`/procurement/rfqs/${quotation.rfq_id}`}>&larr; {rfq ? `RFQ ${rfq.rfq_no}` : 'Back to the RFQ'}</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}
      {isSubmitted && !rfqClosed && <Alert>Close the RFQ after collecting vendor quotations. You can select one winning vendor after it is closed.</Alert>}

      <div className="card section">
        <h2 className="section-title">Details</h2>
        <dl className="details">
          <dt>Status</dt>
          <dd>
            <QuotationStatusBadge status={quotation.status} />
          </dd>
          <dt>Vendor</dt>
          <dd>{vendorName}</dd>
          <dt>Quotation date</dt>
          <dd>{formatDate(quotation.quotation_date)}</dd>
          <dt>Valid until</dt>
          <dd>{formatDate(quotation.valid_until, 'Not stated')}</dd>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(quotation.subtotal)}</dd>
          <dt>Tax</dt>
          <dd>{formatCurrency(quotation.tax)}</dd>
          <dt>Total</dt>
          <dd>
            <strong>{formatCurrency(quotation.total)}</strong>
          </dd>
        </dl>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Line items</h2>
            <p className="muted section-hint">
              {isSubmitted ? 'The totals above update each time you add a line.' : 'This quotation has been decided, so its lines are locked.'}
            </p>
          </div>
          {isSubmitted && hasPermission('QUOTATION_CREATE') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSaveError('');
                setNotice('');
                setShowLine(true);
              }}
            >
              Add line
            </button>
          )}
        </div>
        <DataTable columns={lineColumns} rows={lines} emptyTitle="No line items yet" emptyMessage="Add what the vendor is quoting for, so the total can be worked out." />
      </div>

      {showLine && (
        <Modal title="Add quotation line" onClose={() => setShowLine(false)} busy={saving}>
          <QuotationLineForm onSubmit={addLine} onCancel={() => setShowLine(false)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deciding)}
        title={deciding === 'ACCEPTED' ? 'Accept this quotation?' : 'Reject this quotation?'}
        message={
          deciding === 'ACCEPTED'
            ? `${vendorName}'s quotation of ${formatCurrency(quotation.total)} will be selected as the winning quote for this RFQ. Only one quotation can be selected. This decision can't be undone.`
            : `${vendorName}'s quotation will be marked Rejected. A decision can't be undone.`
        }
        confirmLabel={deciding === 'ACCEPTED' ? 'Accept quotation' : 'Reject quotation'}
        danger={deciding === 'REJECTED'}
        busy={saving}
        onConfirm={decide}
        onCancel={() => setDeciding(null)}
      />
    </PageContainer>
  );
}
