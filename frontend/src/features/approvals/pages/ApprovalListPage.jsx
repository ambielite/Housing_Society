import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as approvalsApi from '../api/approvals.api';
import PageContainer from '../../../components/layout/PageContainer';
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
    return <PageContainer title="Approvals" subtitle="Raise and act on approval requests."><SocietyIdPrompt /></PageContainer>;
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
    <PageContainer
      title="Approvals"
      subtitle="Raise, review and decide generic approval requests."
      actions={hasPermission('APPROVAL_CREATE') && <button className="btn btn-primary" onClick={() => { setSaveError(''); setDialog(true); }}><span className="button-plus" aria-hidden="true">+</span> Raise approval</button>}
    >
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="toolbar">
        <select className="input toolbar-select" value={entityType} onChange={(e) => setEntityType(e.target.value)} aria-label="Filter by entity type">
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
        </select>
        <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {APPROVAL_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={requests.data}
        loading={requests.loading}
        error={requests.error ? getErrorMessage(requests.error) : ''}
        onRetry={requests.reload}
        emptyTitle="No approval requests"
        emptyMessage="Raise an approval request for a purchase request, purchase order or vendor invoice."
      />

      {dialog && (
        <Modal title="Raise approval request" onClose={() => !saving && setDialog(false)} busy={saving}>
          <ApprovalForm onSubmit={raise} onCancel={() => setDialog(false)} saving={saving} error={saveError} />
        </Modal>
      )}
    </PageContainer>
  );
}
