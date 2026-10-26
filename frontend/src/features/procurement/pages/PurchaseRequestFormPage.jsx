import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import PurchaseRequestForm from '../components/PurchaseRequestForm';

/** Create only: the backend has no way to edit a request's details after it is raised. */
export default function PurchaseRequestFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { societyId } = useSociety();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!societyId) {
    return <section className="society-dashboard purchase-orders-page"><header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>New Purchase Request</h1><p>Ask for something the society needs to buy.</p></div></header><SocietyIdPrompt /></section>;
  }

  const handleSubmit = async (payload) => {
    setSaving(true);
    setSubmitError('');
    try {
      // The requester is always the signed-in user.
      const created = await procurementApi.createRequest({ ...payload, societyId, requestedBy: user.id });
      navigate(`/procurement/requests/${created.id}`, { state: { notice: 'Request created as Draft. Add the items you need, then submit it.' } });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <section className="society-dashboard purchase-orders-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>New Purchase Request</h1><p>Ask for something the society needs to buy.</p></div></header>
      <p className="purchase-orders-back-link"><Link to="/procurement/requests">← All purchase requests</Link></p>
      <section className="society-list-panel purchase-orders-form-panel">
        <div className="society-list-heading"><div><h2>Request details</h2><p>Enter the request reference, date, department, estimate, and reason.</p></div></div>
        <PurchaseRequestForm onSubmit={handleSubmit} cancelTo="/procurement/requests" saving={saving} error={submitError} />
      </section>
    </section>
  );
}
