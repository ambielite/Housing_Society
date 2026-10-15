import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import { getErrorMessage } from '../../../lib/axios';
import * as procurementApi from '../api/procurement.api';
import PageContainer from '../../../components/layout/PageContainer';
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
    return (
      <PageContainer title="New purchase request" subtitle="Ask for something the society needs to buy.">
        <SocietyIdPrompt />
      </PageContainer>
    );
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
    <PageContainer title="New purchase request" subtitle="Ask for something the society needs to buy.">
      <PurchaseRequestForm onSubmit={handleSubmit} cancelTo="/procurement/requests" saving={saving} error={submitError} />
    </PageContainer>
  );
}
