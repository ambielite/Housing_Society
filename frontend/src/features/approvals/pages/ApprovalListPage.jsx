import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as approvalsApi from '../api/approvals.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import Modal from '../../../components/ui/Modal';
import ApprovalForm from '../components/ApprovalForm';
import { ApprovalStatusBadge } from '../components/ApprovalBadges';
import { APPROVAL_STATUSES, ENTITY_TYPES } from '../components/approvalOptions';

export default function ApprovalListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const navigate = useNavigate();
  const location = useLocation();
  const [entityType, setEntityType] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const requests = useFetch(
    () => (societyId ? approvalsApi.listRequests({ societyId, entityType, status }) : Promise.resolve(null)),
    [societyId, entityType, status]
  );

  const notice = location.state?.notice;

  const raise = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      const created = await approvalsApi.raiseApproval({ ...payload, societyId });
      setDialog(false);
      navigate(`/approvals/${created.id}`, { state: { notice: 'Approval request raised successfully.' } });
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!societyId) {
    return <section className="society-dashboard purchase-orders-page approvals-page"><header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Approvals</h1><p>Raise and act on approval requests.</p></div></header><SocietyIdPrompt /></section>;
  }

  const columns = [
    { key: 'entity', header: 'Related record', render: (r) => <Link to={`/approvals/${r.id}`} className="cell-title">{r.entity_display_name || r.entity_type.replaceAll('_', ' ')}</Link> },
    { key: 'entityType', header: 'Type', render: (r) => r.entity_type.replaceAll('_', ' ') },
    { key: 'society', header: 'Society', render: (r) => r.society_display_name || 'Society' },
    { key: 'type', header: 'Approval type', render: (r) => r.approval_type },
    { key: 'level', header: 'Level', render: (r) => r.current_level },
    { key: 'status', header: 'Status', render: (r) => <ApprovalStatusBadge status={r.status} /> },
    { key: 'created', header: 'Created', render: (r) => formatDateTime(r.created_at) },
  ];

  return (
    <section className="society-dashboard purchase-orders-page approvals-page">
      <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> PROCUREMENT</div><h1>Approvals</h1><p>Raise, review and decide approval requests.</p></div><div className="purchase-orders-actions"><button type="button" className="society-workflow-action" onClick={requests.reload} disabled={requests.loading}><RefreshCw size={16} /> Refresh</button>{hasPermission('APPROVAL_CREATE') && <button className="society-add-button" onClick={() => { setSaveError(''); setDialog(true); }}><Plus size={16} /> Raise approval</button>}</div></header>
      {notice && <Alert variant="success">{notice}</Alert>}

      <section className="society-list-panel purchase-orders-panel">
        <div className="society-list-heading"><div><h2>Approval requests</h2><p>Review linked records, approval levels, and current status.</p></div><span className="society-count">{requests.loading ? 'Loading' : `${requests.data?.length || 0} requests`}</span></div>
      <div className="society-toolbar purchase-orders-toolbar">
        <select className="input toolbar-select" value={entityType} onChange={(e) => setEntityType(e.target.value)} aria-label="Filter by entity type">
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
        </select>
        <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {APPROVAL_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <div className="purchase-orders-table"><DataTable
        columns={columns}
        rows={requests.data}
        loading={requests.loading}
        error={requests.error ? getErrorMessage(requests.error) : ''}
        onRetry={requests.reload}
        emptyTitle="No approval requests"
        emptyMessage="Raise an approval request for a purchase request, purchase order or vendor invoice."
      /></div>
      </section>

      {dialog && (
        <Modal title="Raise approval request" onClose={() => !saving && setDialog(false)} busy={saving}>
          <ApprovalForm onSubmit={raise} onCancel={() => setDialog(false)} saving={saving} error={saveError} />
        </Modal>
      )}
    </section>
  );
}
