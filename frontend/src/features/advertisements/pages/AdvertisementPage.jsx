import { useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw, SquarePen, Trash2, X } from 'lucide-react';
import api from '../../../lib/axios';

const emptyForm = { title: '', description: '', startsOn: '', endsOn: '', maxViewsPerResident: '3', isActive: true };
const responseRows = (response) => response?.data?.data ?? [];
const dateLabel = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : '—';
const imageUrl = (path) => {
  if (!path) return '';
  try {
    const apiUrl = new URL(api.defaults.baseURL, window.location.origin);
    return new URL(path, apiUrl.origin).toString();
  } catch {
    return path;
  }
};

export default function AdvertisementPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    if (!image) { setImagePreviewUrl(''); return undefined; }
    const preview = URL.createObjectURL(image);
    setImagePreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [image]);

  const load = async () => {
    setLoading(true); setError('');
    try { setAds(responseRows(await api.get('/advertisements/admin'))); }
    catch (e) { setError(e.response?.data?.message || 'Could not load advertisements.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setImage(null); setError(''); setFormOpen(true); };
  const openEdit = (ad) => {
    setEditing(ad);
    setForm({ title: ad.title || '', description: ad.description || '', startsOn: String(ad.starts_on).slice(0, 10), endsOn: String(ad.ends_on).slice(0, 10), maxViewsPerResident: String(ad.max_views_per_resident), isActive: ad.is_active });
    setImage(null); setError(''); setFormOpen(true);
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      if (image) body.append('image', image);
      const config = { headers: { 'Content-Type': 'multipart/form-data' }, suppressSuccessToast: true };
      if (editing) await api.put(`/advertisements/admin/${editing.id}`, body, config);
      else await api.post('/advertisements/admin', body, config);
      setFormOpen(false);
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not save this advertisement.'); }
    finally { setBusy(false); }
  };
  const toggleActive = async (ad) => {
    setError('');
    try {
      await api.patch(`/advertisements/admin/${ad.id}/active`, { isActive: !ad.is_active }, { suppressSuccessToast: true });
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not update advertisement status.'); }
  };
  const remove = async (ad) => {
    if (!window.confirm(`Delete “${ad.title}”? This also removes its resident view history.`)) return;
    setError('');
    try { await api.delete(`/advertisements/admin/${ad.id}`, { suppressSuccessToast: true }); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not delete this advertisement.'); }
  };

  return <main className="society-dashboard assets-page notification-page advertisement-page">
    <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot"/> COMMUNICATIONS</div><h1>Advertisement</h1><p>Create and schedule banner ads for residents in your society.</p></div><button className="society-add-button" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button></header>
    {error && <div className="society-error" role="alert">{error}</div>}
    <section className="society-list-panel">
      <div className="society-list-heading"><div><h2>Advertisements</h2><p>Set each banner’s active dates and maximum views per resident.</p></div><button className="society-add-button" onClick={openCreate}><Plus size={17}/> Create advertisement</button></div>
      {loading ? <div className="society-loading">Loading advertisements…</div> : ads.length ? <div className="advertisement-table-wrap"><table className="society-table advertisement-table"><thead><tr><th>Advertisement</th><th>Active dates</th><th>Max views / resident</th><th>Total views</th><th>Status</th><th>Actions</th></tr></thead><tbody>{ads.map((ad) => <tr key={ad.id}>
        <td><div className="advertisement-title-cell"><div><strong>{ad.title}</strong>{ad.description && <><small className={`advertisement-description${expandedDescriptions[ad.id] ? ' expanded' : ''}`}>{ad.description}</small>{ad.description.length > 100 && <button type="button" className="advertisement-description-toggle" aria-expanded={Boolean(expandedDescriptions[ad.id])} onClick={() => setExpandedDescriptions((current) => ({ ...current, [ad.id]: !current[ad.id] }))}>{expandedDescriptions[ad.id] ? 'Show less' : 'Show more'}</button>}</>}</div></div></td>
        <td>{dateLabel(ad.starts_on)}<small>to {dateLabel(ad.ends_on)}</small></td>
        <td>{ad.max_views_per_resident}</td><td>{ad.total_resident_views}</td>
        <td><span className={`security-status-pill advertisement-status ${String(ad.display_status).toLowerCase()}`}>{ad.display_status}</span></td>
        <td><div className="advertisement-actions"><button type="button" className="security-table-icon-action" title="Edit" aria-label={`Edit ${ad.title}`} onClick={() => openEdit(ad)}><SquarePen size={17}/></button><button type="button" className="society-workflow-action" onClick={() => toggleActive(ad)}>{ad.is_active ? 'Deactivate' : 'Activate'}</button><button type="button" className="security-table-icon-action is-delete" title="Delete" aria-label={`Delete ${ad.title}`} onClick={() => remove(ad)}><Trash2 size={17}/></button></div></td>
      </tr>)}</tbody></table></div> : <div className="society-empty"><Megaphone size={25}/><h3>No advertisements yet</h3><p>Create a banner to display it on the resident home screen.</p><button className="society-add-button" onClick={openCreate}><Plus size={16}/> Create advertisement</button></div>}
    </section>
    {formOpen && <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && !busy && setFormOpen(false)}><section className="society-form-modal security-record-modal advertisement-modal" role="dialog" aria-modal="true" aria-labelledby="advertisement-form-title">
      <header className="society-form-header"><div><h2 id="advertisement-form-title">{editing ? 'Edit advertisement' : 'Create advertisement'}</h2><p>Residents see active ads until their view limit is reached or they dismiss them.</p></div><button className="modal-close-btn" aria-label="Close" disabled={busy} onClick={() => setFormOpen(false)}><X size={18}/></button></header>
      {error && <p className="security-form-error" role="alert">{error}</p>}
      <form onSubmit={save}><div className="society-form-body"><div className="security-form-grid advertisement-form-grid">
        <label className="advertisement-wide">Advertisement title<input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Community offer"/></label>
        <label className="advertisement-wide">Advertisement image / banner<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!editing} onChange={(e) => setImage(e.target.files?.[0] || null)}/><small>JPG, PNG, WEBP or GIF, up to 10 MB.</small></label>
        {(image || editing?.image_url) && <div className="advertisement-preview"><img src={image ? imagePreviewUrl : imageUrl(editing.image_url)} alt="Advertisement preview"/></div>}
        <label>Start date<input type="date" required value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })}/></label>
        <label>End date<input type="date" required min={form.startsOn || undefined} value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })}/></label>
        <label>Maximum displays per resident<input type="number" required min="1" max="1000" value={form.maxViewsPerResident} onChange={(e) => setForm({ ...form, maxViewsPerResident: e.target.value })}/></label>
        <label className="advertisement-wide">Description (optional)<textarea rows="3" maxLength={3000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short details about this advertisement"/></label>
        <label className="advertisement-active"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/> Active</label>
      </div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create advertisement'}</button></footer></form>
    </section></div>}
  </main>;
}
