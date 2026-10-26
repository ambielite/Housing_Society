import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as approvalsApi from '../api/approvals.api';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import DataTable from '../../../components/tables/DataTable';
import Modal from '../../../components/ui/Modal';
import ApprovalDecisionForm from '../components/ApprovalDecisionForm';
import { ApprovalStatusBadge } from '../components/ApprovalBadges';

export default function ApprovalDetailPage() {
  const { approvalRequestId } = useParams();
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pageError, setPageError] = useState('');

  const request = useFetch(() => approvalsApi.getRequest(approvalRequestId), [approvalRequestId]);
  const target = request.data;
  const notice = location.state?.notice;

  if (request.loading && !target) return <div className="table-state">Loading approval...</div>;
  if (request.error && !target) return <div className="empty-state"><h1>Couldn't load approval</h1><p>{getErrorMessage(request.error)}</p><Link to="/approvals">Back to approvals</Link></div>;

  const canDecide = hasPermission('APPROVAL_ACTION') && ['PENDING'].includes(target.status);
  const canCancel = hasPermission('APPROVAL_CREATE') && ['PENDING', 'INFO_REQUIRED'].includes(target.status);
  const entityName = target.entity_display_name || target.entity_type.replaceAll('_', ' ');
  const entityPath = target.entity_type === 'PURCHASE_REQUEST' && hasPermission('PURCHASE_REQUEST_READ')
    ? `/procurement/requests/${target.entity_id}`
    : target.entity_type === 'PURCHASE_ORDER' && hasPermission('PURCHASE_ORDER_READ')
      ? `/purchase-orders/${target.entity_id}`
      : null;
  const societyName = target.society_display_name || 'Society';

  const decide = async (payload) => {
    setSaving(true); setSaveError('');
    try { await approvalsApi.decide(approvalRequestId, payload); setDialog(false); request.reload(); }
    catch (err) { setSaveError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const cancel = async () => {
    setSaving(true); setPageError('');
    try { await approvalsApi.cancel(approvalRequestId); request.reload(); }
    catch (err) { setPageError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const actionColumns = [
    { key: 'level', header: 'Level', render: (a) => a.level },
    { key: 'decision', header: 'Decision', render: (a) => a.decision },
    { key: 'approver', header: 'Approver', render: (a) => a.approver_name || a.approver_email || 'User' },
    { key: 'remarks', header: 'Remarks', render: (a) => a.remarks || '-' },
    { key: 'at', header: 'Action time', render: (a) => formatDateTime(a.action_at) },
  ];

  return (
    <PageContainer
      className="purchase-orders-page approvals-page"
      title="Approval request"
      subtitle={`${target.entity_type} • ${target.approval_type}`}
      actions={
        <>
          {canDecide && <button className="society-add-button" onClick={() => { setSaveError(''); setDialog(true); }}>Record decision</button>}
          {canCancel && <button className="society-workflow-action approval-cancel-action" onClick={cancel} disabled={saving}>Cancel request</button>}
        </>
      }
    >
      <p className="purchase-orders-back-link"><Link to="/approvals">&larr; All approvals</Link></p>
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <section className="society-list-panel purchase-orders-detail-panel">
        <div className="society-list-heading"><div><h2>Approval details</h2><p>Current status, approval level, and related record.</p></div><ApprovalStatusBadge status={target.status} /></div>
        <dl className="details">
          <dt>Entity type</dt><dd>{target.entity_type}</dd>
          <dt>Related record</dt><dd>{entityPath ? <Link to={entityPath}>{entityName}</Link> : entityName}</dd>
          <dt>Approval type</dt><dd>{target.approval_type}</dd>
          <dt>Current level</dt><dd>{target.current_level}</dd>
          <dt>Society</dt><dd>{societyName}</dd>
          <dt>Created</dt><dd>{formatDateTime(target.created_at)}</dd>
          <dt>Updated</dt><dd>{formatDateTime(target.updated_at)}</dd>
        </dl>
      </section>

      <section className="society-list-panel purchase-orders-detail-panel"><div className="society-list-heading"><div><h2>Action history</h2><p>Every approval decision is recorded against its level.</p></div><span className="society-count">{target.actions?.length || 0} actions</span></div><div className="purchase-orders-table"><DataTable columns={actionColumns} rows={target.actions || []} emptyTitle="No actions yet" emptyMessage="This request is waiting for an approval action." /></div></section>

      {dialog && <Modal title="Record approval decision" onClose={() => !saving && setDialog(false)} busy={saving}><ApprovalDecisionForm onSubmit={decide} onCancel={() => setDialog(false)} saving={saving} error={saveError} /></Modal>}
    </PageContainer>
  );
}
