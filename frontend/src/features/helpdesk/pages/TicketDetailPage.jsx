import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import apiClient, { getErrorMessage } from '../../../lib/axios';
import * as api from '../api/helpdesk.api';
import * as vaultApi from '../../document-vault/api/documentVault.api';
import unitApi from '../../units/api/unit.api';
import floorApi from '../../floors/api/floor.api';
import towerApi from '../../towers/api/tower.api';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import { TICKET_STATUSES, label } from '../components/helpdeskOptions';

const rowsFrom = (response, key) => {
  const rows = Array.isArray(response) ? response : response?.data || response?.[key] || [];
  return Array.isArray(rows) ? rows : [];
};

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assignee, setAssignee] = useState('');
  const [vendor, setVendor] = useState('');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unitNames, setUnitNames] = useState(new Map());
  const [directoryError, setDirectoryError] = useState('');
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [rating, setRating] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const ticket = useFetch(() => api.getTicket(ticketId), [ticketId]);
  const comments = useFetch(() => api.listComments(ticketId), [ticketId]);
  const attachments = useFetch(() => api.listAttachments(ticketId), [ticketId]);
  const history = useFetch(() => api.listHistory(ticketId), [ticketId]);
  const assignments = useFetch(() => api.listAssignments(ticketId), [ticketId]);
  const timer = useFetch(() => api.getTimer(ticketId), [ticketId]);
  const escalations = useFetch(() => api.listEscalations(ticketId), [ticketId]);
  const documents = useFetch(() => societyId ? vaultApi.listDocuments({ societyId, status: 'ACTIVE' }) : Promise.resolve([]), [societyId]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiClient.get('/users', { params: { limit: 100 } }),
      apiClient.get('/vendors', { params: { limit: 100 } }),
      societyId ? api.listCategories({ societyId }) : Promise.resolve([]),
      societyId ? unitApi.getAll({ headers: { 'x-society-id': societyId } }) : Promise.resolve([]),
      societyId ? floorApi.getAll({ headers: { 'x-society-id': societyId } }) : Promise.resolve([]),
      societyId ? towerApi.getAll({ headers: { 'x-society-id': societyId } }) : Promise.resolve([]),
    ]).then(([userResult, vendorResult, categoryResult, unitResult, floorResult, towerResult]) => {
      if (!active) return;
      const userData = userResult.status === 'fulfilled' ? userResult.value.data?.data : null;
      const vendorData = vendorResult.status === 'fulfilled' ? vendorResult.value.data?.data : null;
      const categoryData = categoryResult.status === 'fulfilled' ? categoryResult.value : null;
      setUsers(Array.isArray(userData) ? userData : (userData?.users || []));
      setVendors(Array.isArray(vendorData) ? vendorData : (vendorData?.vendors || []));
      const categoryRows = Array.isArray(categoryData) ? categoryData : (categoryData?.categories || categoryData?.data?.categories || []);
      setCategories(categoryRows);
      if (unitResult.status === 'fulfilled' && floorResult.status === 'fulfilled' && towerResult.status === 'fulfilled') {
        const units = rowsFrom(unitResult.value, 'units');
        const floors = rowsFrom(floorResult.value, 'floors');
        const towers = rowsFrom(towerResult.value, 'towers');
        const floorsById = new Map(floors.map(floor => [floor.id, floor]));
        const towersById = new Map(towers.map(tower => [tower.id, tower]));
        setUnitNames(new Map(units.map(unit => {
          const floor = floorsById.get(unit.floorId || unit.floor_id);
          const tower = towersById.get(floor?.towerId || floor?.tower_id);
          const unitName = unit.unitNumber || unit.unit_number || unit.name || 'Unit';
          return [String(unit.id), `${unitName}${tower?.name ? ` - ${tower.name}` : ''}`];
        })));
      } else {
        setUnitNames(new Map());
      }
      if (userResult.status === 'rejected' || vendorResult.status === 'rejected' || categoryResult.status === 'rejected') {
        setDirectoryError('Some staff, vendor, or category details could not be loaded. Check your read permissions.');
      }
    });
    return () => { active = false; };
  }, [societyId]);
  useEffect(() => () => {
    if (previewDocument?.url) URL.revokeObjectURL(previewDocument.url);
  }, [previewDocument]);

  const userNames = useMemo(() => new Map(users.map(u => [u.id, [u.full_name, u.fullName, u.name, [u.first_name, u.last_name].filter(Boolean).join(' ')].find(Boolean) || u.email || 'Staff member'])), [users]);
  const vendorNames = useMemo(() => new Map(vendors.map(v => [v.id, v.trade_name || v.tradeName || v.legal_name || v.legalName || v.name || 'Vendor'])), [vendors]);
  const categoryNames = useMemo(() => new Map(categories.map(c => [c.id, c.name || c.category_name || c.title || 'Category'])), [categories]);
  const t = ticket.data?.ticket || ticket.data;
  const run = async (fn, msg) => {
    setBusy(true); setError(''); setNotice('');
    try {
      await fn(); setNotice(msg);
      [ticket, comments, attachments, history, assignments, timer, escalations].forEach(x => x.reload?.());
      return true;
    } catch (e) { setError(getErrorMessage(e)); return false; }
    finally { setBusy(false); }
  };
  const viewDocument = async (attachment) => {
    const documentId = attachment.document_id || attachment.documentId;
    if (!documentId) return;
    setPreviewLoading(true);
    setError('');
    try {
      const response = await vaultApi.downloadDocument(documentId);
      const file = response.data;
      const url = URL.createObjectURL(file);
      setPreviewDocument({
        url,
        mimeType: file.type || attachment.mime_type || attachment.mimeType || '',
        fileName: attachment.document_file_name || attachment.file_name || attachment.fileName || 'document',
        title: attachment.document_title || attachment.title || 'Document preview',
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPreviewLoading(false);
    }
  };
  if (ticket.loading) return <PageContainer className="helpdesk-page" title="Ticket details"><p className="muted">Loading ticket…</p></PageContainer>;
  if (ticket.error) return <PageContainer className="helpdesk-page" title="Ticket details"><Alert variant="error">{getErrorMessage(ticket.error)}</Alert></PageContainer>;

  const can = p => hasPermission(p);
  const arr = (v, key) => Array.isArray(v) ? v : (v?.[key] || []);
  const documentRows = arr(documents.data, 'documents');
  const formatDate = value => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };
  const categoryId = t?.category_id || t?.categoryId || t?.category?.id;
  const unitId = t?.unit_id || t?.unitId || t?.unit?.id;
  const raisedById = t?.raised_by_user_id || t?.raisedByUserId || t?.raised_by || t?.reporter_id || t?.created_by;
  const categoryName = t?.category_name || t?.categoryName || t?.category?.name || categoryNames.get(categoryId) || (categoryId ? 'Category details unavailable' : '-');
  const raisedByName = t?.raised_by_name || t?.raisedByName || t?.raised_by_user?.full_name || t?.raised_by_user?.fullName || t?.raised_by_user?.name || t?.reporter_name || userNames.get(raisedById) || (raisedById ? 'Resident details unavailable' : '-');
  const requiresAssignment = ['ASSIGNED', 'IN_PROGRESS'].includes(String(status).toUpperCase());

  return <PageContainer className="helpdesk-page" title={t?.ticket_no || 'Ticket details'} subtitle={t?.subject || ''}>
    <div className="back-link"><Link to="/helpdesk/tickets">← All tickets</Link></div>
    {notice && <Alert variant="success">{notice}</Alert>}{error && <Alert variant="error">{error}</Alert>}
    <div className="dashboard-grid">
      <section className="dashboard-panel"><h3>Ticket information</h3><dl className="details">
        {[
          ['Subject', t?.subject], ['Description', t?.description || '-'], ['Category', categoryName], ['Priority', t?.priority], ['Status', label(t?.status)],
          ['Raised by', raisedByName], ['Unit', t?.unit_number || t?.unitNumber || t?.unit?.unit_number || t?.unit?.unitNumber || t?.unit?.unit_name || t?.unit?.label || (unitId ? unitNames.get(String(unitId)) || 'Unit details unavailable' : 'Common area')],
          ['Created', formatDate(t?.created_at)],
        ].map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || '-'}</dd></Fragment>)}
      </dl>
        {can('TICKET_UPDATE') && <form className="stack-form section" onSubmit={e => {
          e.preventDefault();
          if (requiresAssignment && !assignee && !vendor) { setError('Assign this ticket to a staff member or vendor before changing its status to Assigned or In Progress.'); return; }
          run(() => api.updateStatus(ticketId, { status, remarks }), `Ticket status updated to ${label(status)}.`);
        }}><h3>Update status</h3><select required className="input" value={status} onChange={e => { setStatus(e.target.value); setError(''); }}><option value="">Select next status</option>{TICKET_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select><input className="input" maxLength={500} placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} /><button className="btn btn-primary" disabled={busy || !status}>Update status</button></form>}
      </section>
      <section className="dashboard-panel"><h3>SLA timer</h3>{timer.error ? <p className="muted">{getErrorMessage(timer.error)}</p> : timer.loading ? <p>Loading…</p> : timer.data ? <dl className="details">{[['Status', timer.data.status], ['Response due', timer.data.response_due_at], ['Resolution due', timer.data.resolution_due_at], ['Breached at', timer.data.breached_at]].map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{k === 'Status' ? (v || '-') : formatDate(v)}</dd></Fragment>)}</dl> : <p className="muted">No SLA timer is attached to this ticket.</p>}
        {can('TICKET_ASSIGN') && <form className="stack-form section" onSubmit={e => { e.preventDefault(); if (!assignee && !vendor) { setError('Select a staff member or vendor before assigning the ticket.'); return; } run(() => api.assignTicket(ticketId, { ...(assignee ? { assignedToUserId: assignee } : {}), ...(vendor ? { assignedVendorId: vendor } : {}) }), 'Ticket assigned.'); }}><h3>Assign ticket</h3>{directoryError && <p className="field-hint">{directoryError}</p>}<label className="field">Staff member<select className="input" value={assignee} onChange={e => setAssignee(e.target.value)}><option value="">Select staff member</option>{users.map(u => <option key={u.id} value={u.id}>{userNames.get(u.id)}{u.email ? ` · ${u.email}` : ''}</option>)}</select></label><label className="field">Vendor (optional)<select className="input" value={vendor} onChange={e => setVendor(e.target.value)}><option value="">No vendor selected</option>{vendors.map(v => <option key={v.id} value={v.id}>{vendorNames.get(v.id)}</option>)}</select></label><div className="form-actions"><button className="btn btn-primary" disabled={busy || (!assignee && !vendor)}>Assign</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => run(() => api.unassignTicket(ticketId), 'Ticket unassigned.')}>Unassign</button></div></form>}
      </section>
    </div>
    <section className="card section"><h2 className="section-title">Comments</h2><div className="stack-form">{arr(comments.data, 'comments').map(c => <div key={c.id} className="perm-group" style={{ padding: 12 }}><strong>{c.is_internal ? 'Internal note' : 'Resident-visible comment'}</strong><p>{c.comment}</p><span className="cell-sub">{formatDate(c.created_at) === '-' ? '' : formatDate(c.created_at)}</span></div>)}{!arr(comments.data, 'comments').length && <p className="muted">No comments yet.</p>}</div>{can('TICKET_COMMENT_CREATE') && <form className="stack-form section" onSubmit={e => { e.preventDefault(); run(() => api.addComment(ticketId, { comment, isInternal: internal }), 'Comment added.'); setComment(''); }}><label className="field">Add comment<textarea className="input" rows={3} maxLength={3000} required value={comment} onChange={e => setComment(e.target.value)} /></label><label className="check-row"><input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} /> Internal note (staff-only)</label><button className="btn btn-primary" disabled={busy || !comment.trim()}>Add comment</button></form>}</section>
    <div className="dashboard-grid"><section className="dashboard-panel"><h3>Attachments</h3>{arr(attachments.data, 'attachments').map(a => <div key={a.id} className="perm-group" style={{ padding: 12, marginBottom: 8 }}><p>{a.document_title || a.title || a.document?.title || a.document_file_name || a.file_name || a.document?.file_name || 'Linked document'}</p>{a.created_at && <span className="cell-sub">Linked {formatDate(a.created_at)}</span>}<div className="form-actions">{(a.document_id || a.documentId) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => viewDocument(a)} disabled={previewLoading}>{previewLoading ? 'Loading document...' : 'View document'}</button>}{can('TICKET_ATTACHMENT_CREATE') && <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(() => api.removeAttachment(ticketId, a.id), 'Attachment removed.')} disabled={busy}>Remove attachment</button>}</div></div>)}{!arr(attachments.data, 'attachments').length && <p className="muted">No attachments linked.</p>}{can('TICKET_ATTACHMENT_CREATE') && <form className="stack-form section" onSubmit={e => { e.preventDefault(); if (!selectedDocumentId) return; run(() => api.addAttachment(ticketId, { documentId: selectedDocumentId }), 'Document attached to ticket.').then(ok => { if (ok) setSelectedDocumentId(''); }); }}><label className="field">Attach a Document Vault file<select className="input" required value={selectedDocumentId} onChange={e => setSelectedDocumentId(e.target.value)} disabled={documents.loading}><option value="">{documents.loading ? 'Loading documents...' : 'Select document'}</option>{documentRows.map(document => <option key={document.id} value={document.id}>{document.title || document.file_name || document.fileName || 'Untitled document'}{document.file_name || document.fileName ? ` · ${document.file_name || document.fileName}` : ''}</option>)}</select></label>{documents.error && <p className="field-hint">Could not load accessible documents from Document Vault.</p>}{!documents.loading && !documents.error && !documentRows.length && <p className="field-hint">No accessible documents are available in this society. Upload one in Document Vault first.</p>}<button className="btn btn-primary" disabled={busy || !selectedDocumentId}>Attach document</button></form>}</section>
      <section className="dashboard-panel"><h3>Escalations</h3>{arr(escalations.data, 'escalations').map(x => <div key={x.id} className="perm-group" style={{ padding: 12, marginBottom: 8 }}><p><strong>{x.status}</strong> · {formatDate(x.escalated_at) === '-' ? '' : formatDate(x.escalated_at)}</p>{can('TICKET_ESCALATION_ACKNOWLEDGE') && x.status === 'OPEN' && <button className="btn btn-secondary btn-sm" onClick={() => run(() => api.acknowledgeEscalation(x.id), 'Escalation acknowledged.')}>Acknowledge</button>}{can('TICKET_ESCALATION_ACKNOWLEDGE') && x.status !== 'RESOLVED' && <button className="btn btn-secondary btn-sm" onClick={() => run(() => api.resolveEscalation(x.id), 'Escalation resolved.')}>Resolve</button>}</div>)}{!arr(escalations.data, 'escalations').length && <p className="muted">No escalations have fired.</p>}</section></div>
    <div className="dashboard-grid"><section className="dashboard-panel"><h3>Status history</h3>{arr(history.data, 'history').map((h, i) => <p key={h.id || i}>{h.old_status || 'NEW'} → <strong>{h.new_status}</strong> · {formatDate(h.changed_at) === '-' ? '' : formatDate(h.changed_at)}{h.remarks ? ` — ${h.remarks}` : ''}</p>)}{!arr(history.data, 'history').length && <p className="muted">No status history returned.</p>}</section><section className="dashboard-panel"><h3>Assignments</h3>{arr(assignments.data, 'assignments').map((a, i) => <p key={a.id || i}>{a.assigned_to_user_id ? (userNames.get(a.assigned_to_user_id) || 'Staff member') : 'No staff user'} {a.assigned_vendor_id ? ` · ${vendorNames.get(a.assigned_vendor_id) || 'Vendor'}` : ''} · {a.unassigned_at ? 'Unassigned' : 'Current/history'}</p>)}{!arr(assignments.data, 'assignments').length && <p className="muted">No assignments returned.</p>}</section></div>
    {previewDocument && <Modal title={previewDocument.title} className="helpdesk-dialog" onClose={() => setPreviewDocument(null)}><div className="helpdesk-document-preview" style={{ minHeight: '60vh' }}>{previewDocument.mimeType === 'application/pdf' ? <iframe title={previewDocument.title} src={previewDocument.url} style={{ width: '100%', height: '70vh', border: 0 }} /> : previewDocument.mimeType.startsWith('image/') ? <img src={previewDocument.url} alt={previewDocument.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', margin: '0 auto' }} /> : <div className="table-state"><h3>Preview isn’t available for this file type.</h3><a className="btn btn-primary" href={previewDocument.url} download={previewDocument.fileName}>Download document</a></div>}</div></Modal>}
    {can('TICKET_RATING_CREATE') && t?.status === 'CLOSED' && <section className="card section"><h2 className="section-title">Rate resolution</h2><form className="stack-form" onSubmit={e => { e.preventDefault(); run(() => api.addRating(ticketId, { rating: Number(rating), comment: ratingComment || '' }), 'Ticket rating submitted.'); }}><label className="field">Rating<select className="input" value={rating} onChange={e => setRating(e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></label><label className="field">Comment<textarea className="input" rows={2} maxLength={1000} value={ratingComment} onChange={e => setRatingComment(e.target.value)} /></label><button className="btn btn-primary" disabled={busy}>Submit rating</button></form></section>}
  </PageContainer>;
}
