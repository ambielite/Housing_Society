import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { fullName } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import * as userApi from '../../users/api/user.api';
import { FullPageLoader } from '../../../components/ui/Spinner';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import VendorForm from '../components/VendorForm';

/** One page for two routes: /vendors/new (create) and /vendors/:vendorId/edit (edit). */
export default function VendorFormPage() {
  const { vendorId } = useParams();
  const isEdit = Boolean(vendorId);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const existing = useFetch(() => (isEdit ? vendorsApi.getVendor(vendorId) : Promise.resolve(null)), [vendorId]);

  // Optional "vendor login" picker - only when creating, and only if the viewer may see users.
  const canPickLogin = !isEdit && hasPermission('USER_READ');
  const users = useFetch(
    () => (canPickLogin && societyId ? userApi.listUsers({ societyId, status: 'ACTIVE', limit: 100 }) : Promise.resolve(null)),
    [canPickLogin, societyId]
  );
  const userOptions = users.data ? users.data.users.map((u) => ({ value: u.id, label: `${fullName(u)} (${u.email})` })) : [];

  if (isEdit && existing.loading && !existing.data) return <FullPageLoader />;
  if (isEdit && existing.error && !existing.data) {
    return (
      <div className="empty-state">
        <h1>Couldn't load this vendor</h1>
        <p>{getErrorMessage(existing.error)}</p>
        <p>
          <Link to="/vendors">Back to vendors</Link>
        </p>
      </div>
    );
  }

  if (!isEdit && !societyId) {
    return (
      <section className="society-dashboard purchase-orders-page vendor-module-page"><header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> SUPPLIERS</div><h1>New Vendor</h1><p>Add a service provider or supplier.</p></div></header><SocietyIdPrompt /></section>
    );
  }

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSubmitError('');
    try {
      if (isEdit) {
        await vendorsApi.updateVendor(vendorId, payload);
        navigate(`/vendors/${vendorId}`, { state: { notice: 'Vendor updated.' } });
      } else {
        const created = await vendorsApi.createVendor({ ...payload, societyId });
        navigate(`/vendors/${created.id}`, {
          state: { notice: 'Vendor created as Pending. Add and verify their documents, then set the status to Active.' },
        });
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <section className="society-dashboard purchase-orders-page vendor-module-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> SUPPLIERS</div><h1>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1><p>{isEdit ? existing.data.legal_name : 'Add a service provider or supplier.'}</p></div></header>
      <p className="purchase-orders-back-link"><Link to={isEdit ? `/vendors/${vendorId}` : '/vendors'}>← {isEdit ? 'Back to vendor' : 'All vendors'}</Link></p>
      <section className="society-list-panel purchase-orders-form-panel">
        <div className="society-list-heading"><div><h2>Vendor details</h2><p>Enter registered business and primary contact information.</p></div></div>
        <VendorForm
        mode={isEdit ? 'edit' : 'create'}
        vendor={existing.data}
        userOptions={userOptions}
        onSubmit={handleSubmit}
        cancelTo={isEdit ? `/vendors/${vendorId}` : '/vendors'}
        saving={saving}
        error={submitError}
        />
      </section>
    </section>
  );
}
