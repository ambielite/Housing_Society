import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import api, { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { FullPageLoader } from '../../../components/ui/Spinner';
import * as vaultApi from '../api/documentVault.api';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES, ENTITY_TYPES, LINK_TYPES, PERMISSION_TYPES, SENSITIVITIES, VISIBILITIES, formatBytes, formatDate, pretty } from '../components/documentVaultOptions';

const rows = (data, key) => Array.isArray(data) ? data : (data?.[key] || []);
const dateOnly = (value) => value ? String(value).slice(0, 10) : '';

export default function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const doc = useFetch(() => vaultApi.getDocument(documentId), [documentId]);
  const [active, setActive] = useState('details');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [file, setFile] = useState(null);
  const [changeNote, setChangeNote] = useState('');
  const [edit, setEdit] = useState({});
  const [permissions, setPermissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [versions, setVersions] = useState([]);
  const [links, setLinks] = useState([]);
  const [detailError, setDetailError] = useState('');
  const [userList, setUserList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [refreshedTarget, setRefreshedTarget] = useState(null);
  const [grant, setGrant] = useState({ targetType: 'user', targetId: '', permissionType: 'READ', expiresAt: '' });
  const [link, setLink] = useState({ entityType: 'OTHER', entityId: '', linkType: 'ATTACHMENT' });

  const target = refreshedTarget || doc.data?.document || doc.data;
  const refreshDetails = async () => {
    const requests = await Promise.allSettled([
      vaultApi.listVersions(documentId),
      vaultApi.listDownloadHistory(documentId),
      vaultApi.listPermissions(documentId),
      vaultApi.listDocumentLinks(documentId),
    ]);
    const setters = [setVersions, setHistory, setPermissions, setLinks];
    requests.forEach((result, index) => {
      if (result.status === 'fulfilled') setters[index](result.value);
    });
    const failed = requests.some((result) => result.status === 'rejected');
    setDetailError(failed ? 'Some history or access information could not be loaded. Check your permissions.' : '');
  };
  useEffect(() => {
    setRefreshedTarget(null);
    refreshDetails();
  }, [documentId]);
  useEffect(() => {
    if (!showEdit || !target) return;
    setEdit({ title: target.title || '', documentType: target.document_type || 'OTHER', sensitivity: target.sensitivity || 'INTERNAL', visibility: target.visibility || 'COMMITTEE_ONLY', effectiveDate: dateOnly(target.effective_date), expiryDate: dateOnly(target.expiry_date), status: target.status || 'ACTIVE' });
  }, [showEdit, target]);
  useEffect(() => {
    if (!['access', 'downloads'].includes(active)) return;
    Promise.allSettled([
      api.get('/users', { params: { limit: 100 } }),
      api.get('/rbac/roles'),
    ]).then(([usersResult, rolesResult]) => {
      if (usersResult.status === 'fulfilled') {
        const data = usersResult.value.data?.data;
        setUserList(Array.isArray(data) ? data : (data?.users || []));
      }
      if (rolesResult.status === 'fulfilled') {
        const data = rolesResult.value.data?.data;
        setRoleList(Array.isArray(data) ? data : (data?.roles || []));
      }
    });
  }, [active]);

  if (doc.loading && !target) return <FullPageLoader />;
  if (doc.error && !target) return <PageContainer title="Document details"><Alert variant="error">{getErrorMessage(doc.error)}</Alert><p className="back-link"><Link to="/document-vault">← Document Vault</Link></p></PageContainer>;
  if (!target) return null;

  const run = async (fn, message) => {
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await fn();
      setNotice(message);
      await doc.reload();
      // Fetch the persisted document after edits so the detail view reflects server values immediately.
      const latest = await vaultApi.getDocument(documentId);
      setRefreshedTarget(latest?.document || latest);
      await refreshDetails();
      return true;
    }
    catch (err) { setError(getErrorMessage(err)); return false; }
    finally { setSaving(false); }
  };
  const download = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await vaultApi.downloadDocument(documentId);
      const url = URL.createObjectURL(response.data);
      const anchor = window.document.createElement('a');
      anchor.href = url; anchor.download = target.file_name || `${target.title || 'document'}`; anchor.click();
      URL.revokeObjectURL(url);
      setNotice('Download started.');
      await refreshDetails();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };
  const saveEdit = async (event) => {
    event.preventDefault();
    if (await run(() => vaultApi.updateDocument(documentId, { ...edit, effectiveDate: edit.effectiveDate || null, expiryDate: edit.expiryDate || null }), 'Document details updated.')) setShowEdit(false);
  };
  const uploadVersion = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (await run(() => vaultApi.addVersion(documentId, file, changeNote), 'New version uploaded.')) { setShowVersion(false); setFile(null); setChangeNote(''); }
  };
  const removeDocument = async () => {
    if (await run(() => vaultApi.deleteDocument(documentId), 'Document deleted.')) navigate('/document-vault', { replace: true, state: { notice: 'Document deleted successfully.' } });
  };
  const grantAccess = async (event) => {
    event.preventDefault();
    const payload = { documentId, permissionType: grant.permissionType, expiresAt: grant.expiresAt ? new Date(grant.expiresAt).toISOString() : null, ...(grant.targetType === 'user' ? { userId: grant.targetId } : { roleId: grant.targetId }) };
    if (await run(() => vaultApi.grantPermission(payload), 'Access permission granted.')) setGrant({ targetType: 'user', targetId: '', permissionType: 'READ', expiresAt: '' });
  };
  const createLink = async (event) => {
    event.preventDefault();
    if (await run(() => vaultApi.createDocumentLink({ documentId, entityType: link.entityType, entityId: link.entityId.trim(), linkType: link.linkType }), 'Document linked successfully.')) setLink({ entityType: 'OTHER', entityId: '', linkType: 'ATTACHMENT' });
  };
  const sections = [
    ['details', 'Details'],
    ...(hasPermission('DOCUMENT_VERSION_READ') ? [['versions', 'Versions']] : []),
    ...(hasPermission('DOCUMENT_READ') ? [['downloads', 'Download history']] : []),
    ...(hasPermission('DOCUMENT_PERMISSION_READ') || hasPermission('DOCUMENT_PERMISSION_MANAGE') ? [['access', 'Access permissions']] : []),
    ...(hasPermission('DOCUMENT_LINK_READ') || hasPermission('DOCUMENT_LINK_CREATE') ? [['links', 'Linked records']] : []),
  ];
  const userName = (id) => {
    if (!id) return 'Unknown user';
    const u = userList.find((item) => item.id === id || item.user_id === id);
    return u ? (u.full_name || u.name || u.email || 'User') : id;
  };
  const roleName = (id) => { const r = roleList.find((item) => item.id === id); return r ? (r.name || r.code || 'Role') : id; };

  return (
    <PageContainer title={target.title || 'Document details'} subtitle={target.file_name || ''} actions={
      <>
        {hasPermission('DOCUMENT_DOWNLOAD') && <button className="btn btn-primary" disabled={saving} onClick={download}>Download file</button>}
        {hasPermission('DOCUMENT_UPDATE') && <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>Edit details</button>}
        {hasPermission('DOCUMENT_VERSION_CREATE') && <button className="btn btn-secondary" onClick={() => setShowVersion(true)}>Upload new version</button>}
        {hasPermission('DOCUMENT_DELETE') && <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>}
      </>
    }>
      <p className="back-link"><Link to="/document-vault">← Document Vault</Link></p>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {detailError && <Alert>{detailError}</Alert>}
      <div className="tabs-bar"><div className="tabs" role="tablist" aria-label="Document sections">{sections.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={active === key} className={`tab${active === key ? ' active' : ''}`} onClick={() => setActive(key)}>{label}</button>)}</div></div>

      {active === 'details' && <section className="card section"><h2 className="section-title">Document information</h2><dl className="details">
        <dt>Title</dt><dd>{target.title}</dd><dt>File name</dt><dd>{target.file_name}</dd><dt>Document type</dt><dd>{pretty(target.document_type)}</dd><dt>Size</dt><dd>{formatBytes(target.size_bytes)}</dd><dt>MIME type</dt><dd>{target.mime_type || '-'}</dd><dt>Sensitivity</dt><dd>{pretty(target.sensitivity)}</dd><dt>Visibility</dt><dd>{pretty(target.visibility)}</dd><dt>Status</dt><dd>{pretty(target.status)}</dd><dt>Effective date</dt><dd>{target.effective_date ? dateOnly(target.effective_date) : '-'}</dd><dt>Expiry date</dt><dd>{target.expiry_date ? dateOnly(target.expiry_date) : '-'}</dd><dt>Checksum (SHA-256)</dt><dd className="mono break-word">{target.checksum || '-'}</dd><dt>Uploaded</dt><dd>{formatDate(target.created_at)}</dd><dt>Last updated</dt><dd>{formatDate(target.updated_at)}</dd>
      </dl></section>}

      {active === 'versions' && <section className="card section"><h2 className="section-title">Version history</h2>{rows(versions, 'versions').length ? <div className="stack-form">{rows(versions, 'versions').map((v) => <div className="perm-group" key={v.id}><strong>Version {v.version_no}</strong><p>{v.change_note || 'No change note provided'}</p><span className="cell-sub">Uploaded {formatDate(v.uploaded_at)} · Checksum: <span className="mono">{v.checksum}</span></span></div>)}</div> : <p className="muted">No version history available.</p>}</section>}

      {active === 'downloads' && <section className="card section"><h2 className="section-title">Download history</h2>{rows(history, 'history').length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Downloaded by</th><th>Date and time</th><th>IP address</th></tr></thead><tbody>{rows(history, 'history').map((item) => <tr key={item.id}><td>{userName(item.downloaded_by || item.user_id || item.downloaded_by_user_id)}</td><td>{formatDate(item.downloaded_at || item.created_at)}</td><td>{item.ip_address || '-'}</td></tr>)}</tbody></table></div> : <p className="muted">No downloads recorded yet.</p>}</section>}

      {active === 'access' && <section className="card section"><h2 className="section-title">Access permissions</h2>{hasPermission('DOCUMENT_PERMISSION_MANAGE') && <form className="stack-form section" onSubmit={grantAccess}>
        <h3>Grant access</h3>
        <div className="form-grid">
          <label className="field">Grant to<select className="input" value={grant.targetType} onChange={(e) => setGrant({ ...grant, targetType: e.target.value, targetId: '' })}><option value="user">Specific user</option><option value="role">Role</option></select></label>
          <label className="field">{grant.targetType === 'user' ? 'User' : 'Role'}<select className="input" required value={grant.targetId} onChange={(e) => setGrant({ ...grant, targetId: e.target.value })}><option value="">Select {grant.targetType}</option>{(grant.targetType === 'user' ? userList : roleList).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.name || item.code || item.email || item.id}</option>)}</select></label>
          <label className="field">Permission<select className="input" value={grant.permissionType} onChange={(e) => setGrant({ ...grant, permissionType: e.target.value })}>{PERMISSION_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label className="field">Expires at (optional)<input className="input" type="datetime-local" value={grant.expiresAt} onChange={(e) => setGrant({ ...grant, expiresAt: e.target.value })} /></label>
        </div><button className="btn btn-primary" disabled={saving || !grant.targetId}>Grant permission</button>
      </form>}
      {rows(permissions, 'permissions').length ? <div className="stack-form section">{rows(permissions, 'permissions').map((p) => <div className="perm-group" key={p.id}><strong>{p.user_id ? userName(p.user_id) : p.role_id ? roleName(p.role_id) : 'Unassigned target'}</strong><p>{p.permission_type} · Expires {p.expires_at ? formatDate(p.expires_at) : 'Never'}</p>{hasPermission('DOCUMENT_PERMISSION_MANAGE') && <button className="btn btn-secondary btn-sm" disabled={saving} onClick={() => run(() => vaultApi.revokePermission(p.id), 'Access permission revoked.')}>Revoke</button>}</div>)}</div> : <p className="muted">No explicit permissions granted.</p>}</section>}

      {active === 'links' && <section className="card section"><h2 className="section-title">Linked records</h2>{hasPermission('DOCUMENT_LINK_CREATE') && <form className="stack-form section" onSubmit={createLink}><h3>Link to a record</h3><div className="form-grid"><label className="field">Record type<select className="input" value={link.entityType} onChange={(e) => setLink({ ...link, entityType: e.target.value })}>{ENTITY_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label><label className="field">Record ID<input className="input" required value={link.entityId} onChange={(e) => setLink({ ...link, entityId: e.target.value.trim() })} placeholder="Paste an existing record ID" /></label><label className="field">Link type<select className="input" value={link.linkType} onChange={(e) => setLink({ ...link, linkType: e.target.value })}>{LINK_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label></div><p className="field-hint">Choose an existing record ID from the related module. The API requires a valid UUID.</p><button className="btn btn-primary" disabled={saving || !link.entityId}>Create link</button></form>}
      {rows(links, 'links').length ? <div className="stack-form section">{rows(links, 'links').map((item) => <div className="perm-group" key={item.id}><strong>{pretty(item.entity_type)} · {pretty(item.link_type)}</strong><p className="mono break-word">{item.entity_id}</p>{hasPermission('DOCUMENT_LINK_CREATE') && <button className="btn btn-secondary btn-sm" disabled={saving} onClick={() => run(() => vaultApi.deleteDocumentLink(item.id), 'Document link removed.')}>Remove link</button>}</div>)}</div> : <p className="muted">No records linked to this document.</p>}</section>}

      {showEdit && <Modal title="Edit document details" onClose={() => !saving && setShowEdit(false)} busy={saving}><form className="stack-form" onSubmit={saveEdit}>
        {error && <Alert variant="error">{error}</Alert>}
        <label className="field">Title<input className="input" required maxLength={255} value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
        <div className="form-grid"><label className="field">Document type<select className="input" value={edit.documentType} onChange={(e) => setEdit({ ...edit, documentType: e.target.value })}>{DOCUMENT_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label><label className="field">Sensitivity<select className="input" value={edit.sensitivity} onChange={(e) => setEdit({ ...edit, sensitivity: e.target.value })}>{SENSITIVITIES.map((v) => <option key={v}>{v}</option>)}</select></label><label className="field">Visibility<select className="input" value={edit.visibility} onChange={(e) => setEdit({ ...edit, visibility: e.target.value })}>{VISIBILITIES.map((v) => <option key={v}>{v}</option>)}</select></label><label className="field">Status<select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{DOCUMENT_STATUSES.map((v) => <option key={v}>{v}</option>)}</select></label><label className="field">Effective date<input className="input" type="date" value={edit.effectiveDate || ''} onChange={(e) => setEdit({ ...edit, effectiveDate: e.target.value })} /></label><label className="field">Expiry date<input className="input" type="date" min={edit.effectiveDate || undefined} value={edit.expiryDate || ''} onChange={(e) => setEdit({ ...edit, expiryDate: e.target.value })} /></label></div>
        <div className="form-actions"><button className="btn btn-primary" disabled={saving || !edit.title?.trim()}>Save changes</button><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button></div>
      </form></Modal>}
      {showVersion && <Modal title="Upload new version" onClose={() => !saving && setShowVersion(false)} busy={saving}><form className="stack-form" onSubmit={uploadVersion}>
        {error && <Alert variant="error">{error}</Alert>}
        <label className="field">Replacement file<input className="input" type="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} /><span className="field-hint">PDF, PNG, JPEG, Word or Excel; maximum 20 MB.</span></label>
        <label className="field">Change note (optional)<textarea className="input" rows={3} maxLength={500} value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="Describe what changed in this version" /></label>
        <div className="form-actions"><button className="btn btn-primary" disabled={saving || !file}>Upload version</button><button type="button" className="btn btn-secondary" onClick={() => setShowVersion(false)}>Cancel</button></div>
      </form></Modal>}
      {confirmDelete && <ConfirmDialog open={confirmDelete} danger title="Delete document" message={`Delete "${target.title}" and all stored versions? This cannot be undone.`} confirmLabel="Delete document" busy={saving} onCancel={() => setConfirmDelete(false)} onConfirm={removeDocument} />}
    </PageContainer>
  );
}
