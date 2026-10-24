import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ContactForm from './ContactForm';

export default function VendorContactsSection({ vendorId }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('VENDOR_UPDATE');
  const contacts = useFetch(() => vendorsApi.listContacts(vendorId), [vendorId]);

  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  const add = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.addContact(vendorId, payload);
      setShowForm(false);
      setNotice('Contact added.');
      contacts.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await vendorsApi.deleteContact(vendorId, deleting.id);
      setNotice('Contact removed.');
      contacts.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      render: (c) => (
        <>
          <span className="cell-title">{c.name}</span>
          {c.designation && <span className="cell-sub">{c.designation}</span>}
        </>
      ),
    },
    { key: 'email', header: 'Email', render: (c) => c.email || '-' },
    { key: 'phone', header: 'Phone', render: (c) => c.phone || '-' },
    { key: 'primary', header: '', render: (c) => (c.is_primary ? <span className="badge badge-system">Primary</span> : null) },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) =>
        canEdit ? (
          <div className="row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleting(c)}>
              Remove
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Contacts</h2>
          <p className="muted section-hint">The people to reach at this vendor.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSaveError('');
              setNotice('');
              setPageError('');
              setShowForm(true);
            }}
          >
            Add contact
          </button>
        )}
      </div>
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <DataTable
        columns={columns}
        rows={contacts.data}
        loading={contacts.loading}
        error={contacts.error ? getErrorMessage(contacts.error) : ''}
        onRetry={contacts.reload}
        emptyTitle="No contacts yet"
        emptyMessage="Add the people you deal with at this vendor."
      />

      {showForm && (
        <Modal title="Add contact" onClose={() => setShowForm(false)} busy={saving}>
          <ContactForm onSubmit={add} onCancel={() => setShowForm(false)} saving={saving} error={saveError} />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this contact?"
        message={`${deleting?.name || ''} will be removed from this vendor.`}
        confirmLabel="Remove contact"
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
