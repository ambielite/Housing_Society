import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSociety from '../../../app/store/useSociety';
import useVendorDirectory from '../../procurement/components/useVendorDirectory';
import * as procurementApi from '../../procurement/api/procurement.api';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as poApi from '../api/purchase-orders.api';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import PurchaseOrderForm from '../components/PurchaseOrderForm';

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const { societyId } = useSociety();
  const { vendors, loading: vendorsLoading, error: vendorsError } = useVendorDirectory(societyId);
  const purchaseRequests = useFetch(
    () => (societyId ? procurementApi.listRequests({ societyId }) : Promise.resolve([])),
    [societyId]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!societyId) return <section className="society-dashboard purchase-orders-page"><header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>New Purchase Order</h1></div></header><SocietyIdPrompt /></section>;

  const submit = async (payload) => {
    setSaving(true); setError('');
    try {
      const po = await poApi.createPurchaseOrder({ societyId, ...payload });
      navigate(`/purchase-orders/${po.id}`, { replace: true, state: { notice: `Purchase order ${po.po_no} created.` } });
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <section className="society-dashboard purchase-orders-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>New Purchase Order</h1><p>Create an issued purchase order for an active vendor.</p></div></header>
      <p className="purchase-orders-back-link"><Link to="/purchase-orders">← All purchase orders</Link></p>
      {vendorsError && <Alert>{getErrorMessage(vendorsError)}</Alert>}
      <section className="society-list-panel purchase-orders-form-panel">
        <div className="society-list-heading"><div><h2>Order details</h2><p>Set the supplier, order number, dates, and linked purchase request.</p></div></div>
        {vendorsLoading ? <p className="purchase-orders-loading">Loading vendors...</p> : purchaseRequests.loading ? <p className="purchase-orders-loading">Loading purchase requests...</p> : <PurchaseOrderForm vendors={vendors} purchaseRequests={purchaseRequests.data || []} purchaseRequestsLoading={purchaseRequests.loading} saving={saving} error={error || (purchaseRequests.error ? getErrorMessage(purchaseRequests.error) : '')} onSubmit={submit} onCancel={() => navigate('/purchase-orders')} />}
      </section>
    </section>
  );
}
