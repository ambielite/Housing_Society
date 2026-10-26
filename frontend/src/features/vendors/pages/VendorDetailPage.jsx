import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { FullPageLoader } from '../../../components/ui/Spinner';
import { VendorStatusBadge } from '../components/VendorBadges';
import StatusForm from '../components/StatusForm';
import VendorContactsSection from '../components/VendorContactsSection';
import VendorDocumentsSection from '../components/VendorDocumentsSection';
import VendorBankSection from '../components/VendorBankSection';
import VendorContractsSection from '../components/VendorContractsSection';
import VendorUsersSection from '../components/VendorUsersSection';
import { VENDOR_STATUSES, friendlyDeleteError, maskPan } from '../components/vendorOptions';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'documents', label: 'Documents' },
  { key: 'bank', label: 'Bank accounts' },
  { key: 'contracts', label: 'Contracts' },
];

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const vendor = useFetch(() => vendorsApi.getVendor(vendorId), [vendorId]);

  const [active, setActive] = useState('overview');
  const [showStatus, setShowStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [pageError, setPageError] = useState('');

  const target = vendor.data;

  if (vendor.loading && !target) return <FullPageLoader />;

  if (vendor.error && !target) {
    const status = vendor.error.response?.status;
    return (
      <div className="empty-state">
        <h1>{status === 404 ? 'Vendor not found' : status === 403 ? "You can't view this vendor" : "Couldn't load this vendor"}</h1>
        <p>{status === 404 ? 'It may have been removed, or the link is wrong.' : getErrorMessage(vendor.error)}</p>
        <p>
          <Link to="/vendors">Back to vendors</Link>
        </p>
      </div>
    );
  }

  const saveStatus = async (status) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.updateVendorStatus(vendorId, status);
      setShowStatus(false);
      setNotice('Vendor status updated.');
      setPageError('');
      vendor.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await vendorsApi.deleteVendor(vendorId);
      navigate('/vendors', { replace: true, state: { notice: `Vendor "${target.legal_name}" deleted.` } });
    } catch (err) {
      setPageError(friendlyDeleteError(err, 'vendor'));
      setNotice('');
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const actions = (
    <>
      {hasPermission('VENDOR_UPDATE') && (
        <Link to={`/vendors/${vendorId}/edit`} className="society-workflow-action">
          Edit
        </Link>
      )}
      {hasPermission('VENDOR_STATUS_UPDATE') && (
        <button
          type="button"
          className="society-workflow-action"
          onClick={() => {
            setSaveError('');
            setNotice('');
            setShowStatus(true);
          }}
        >
          Change status
        </button>
      )}
      {hasPermission('VENDOR_DELETE') && (
        <button type="button" className="society-workflow-action vendor-delete-action" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      )}
    </>
  );

  return (
    <section className="society-dashboard purchase-orders-page vendor-module-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> SUPPLIERS</div><h1>{target.legal_name}</h1><p>{target.trade_name || 'Vendor profile and supplier management.'}</p></div><div className="purchase-orders-actions">{actions}</div></header>
      <p className="purchase-orders-back-link"><Link to="/vendors">← All vendors</Link></p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}
      {target.status === 'PENDING' && (
        <Alert variant="success">This vendor is Pending. Only Active vendors can be invited to quotations or receive purchase orders.</Alert>
      )}

      <nav className="security-tabs vendor-tabs" role="tablist" aria-label="Vendor sections">
          {SECTIONS.filter((section) => section.key !== 'users' || hasPermission('USER_READ')).map((section) => (
            <button
              key={section.key}
              type="button"
              role="tab"
              aria-selected={active === section.key}
              className={active === section.key ? 'active' : ''}
              onClick={() => setActive(section.key)}
            >
              {section.label}
            </button>
          ))}
      </nav>

      {active === 'users' && hasPermission('USER_READ') && <section className="society-list-panel vendor-detail-content"><VendorUsersSection vendorId={vendorId} societyId={target.society_id} /></section>}

      {active === 'overview' && (
        <section className="society-list-panel purchase-orders-detail-panel">
          <div className="society-list-heading"><div><h2>Vendor details</h2><p>Business, contact, and account information.</p></div><VendorStatusBadge status={target.status} /></div>
          <dl className="details">
            <dt>Legal name</dt>
            <dd>{target.legal_name}</dd>
            <dt>Trade name</dt>
            <dd>{target.trade_name || '-'}</dd>
            <dt>Contact email</dt>
            <dd>{target.contact_email || '-'}</dd>
            <dt>Phone</dt>
            <dd>{target.phone || '-'}</dd>
            <dt>PAN</dt>
            <dd className="mono">{maskPan(target.pan)}</dd>
            <dt>GSTIN</dt>
            <dd className="mono">{target.gstin || '-'}</dd>
            <dt>Vendor login</dt>
            <dd>{target.user_id ? 'Legacy login linked' : 'No legacy login'}</dd>
            <dt>Added</dt>
            <dd>{formatDateTime(target.created_at)}</dd>
            <dt>Last updated</dt>
            <dd>{formatDateTime(target.updated_at)}</dd>
          </dl>
        </section>
      )}
      {active === 'contacts' && <section className="society-list-panel vendor-detail-content"><VendorContactsSection vendorId={vendorId} /></section>}
      {active === 'documents' && <section className="society-list-panel vendor-detail-content"><VendorDocumentsSection vendorId={vendorId} /></section>}
      {active === 'bank' && <section className="society-list-panel vendor-detail-content"><VendorBankSection vendorId={vendorId} /></section>}
      {active === 'contracts' && <section className="society-list-panel vendor-detail-content"><VendorContractsSection vendorId={vendorId} /></section>}

      {showStatus && (
        <Modal title="Change vendor status" onClose={() => setShowStatus(false)} busy={saving}>
          <StatusForm
            options={VENDOR_STATUSES}
            currentValue={target.status}
            hint="Only Active vendors can be invited to quotations or receive purchase orders. Suspended and blacklisted vendors are blocked."
            onSubmit={saveStatus}
            onCancel={() => setShowStatus(false)}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this vendor?"
        message={`"${target.legal_name}" will be deleted for good. This only works if nothing else uses it. Otherwise, set the status to Archived.`}
        confirmLabel="Delete vendor"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}
