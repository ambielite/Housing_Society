import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock3, Edit2, Mail, MapPin, Phone, PhoneCall, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { legacyApi } from '../../../lib/axios';
import useAuth from '../../../app/providers/useAuth';

const CATEGORIES = ['POLICE', 'FIRE', 'AMBULANCE', 'HOSPITAL', 'SECURITY', 'ELECTRICITY', 'WATER', 'GAS', 'DISASTER_RESPONSE', 'SOCIETY_OFFICE', 'OTHER'];
const EMPTY = { name: '', category: 'POLICE', phone: '', alternatePhone: '', email: '', address: '', operatingHours: '', available24x7: false, notes: '', isActive: true };
const errorMessage = (error) => error?.response?.data?.message || 'Could not complete the emergency contact request.';
const pretty = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SocietyEmergencyContactsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('SOCIETY_EMERGENCY_CONTACT_CREATE');
  const canUpdate = hasPermission('SOCIETY_EMERGENCY_CONTACT_UPDATE');
  const canDelete = hasPermission('SOCIETY_EMERGENCY_CONTACT_DELETE');
  const [contacts, setContacts] = useState([]);
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await legacyApi.get('/society-emergency-contacts');
      setContacts(Array.isArray(response.data?.data) ? response.data.data : []);
      setSociety(response.data?.society || null);
    } catch (requestError) { setError(errorMessage(requestError)); setContacts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!formOpen) return undefined;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => { if (event.key === 'Escape') setFormOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prior; window.removeEventListener('keydown', onKey); };
  }, [formOpen]);

  const startCreate = () => { setEditing(null); setForm({ ...EMPTY }); setError(''); setFormOpen(true); };
  const startEdit = (contact) => {
    setEditing(contact);
    setForm({ ...EMPTY, ...contact });
    setError(''); setFormOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      if (editing) await legacyApi.put(`/society-emergency-contacts/${editing.id}`, form);
      else await legacyApi.post('/society-emergency-contacts', form);
      setFormOpen(false); setMessage(editing ? 'Emergency contact updated.' : 'Emergency contact added.');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from the emergency contacts?`)) return;
    setError(''); setMessage('');
    try { await legacyApi.delete(`/society-emergency-contacts/${contact.id}`); setMessage('Emergency contact removed.'); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  };
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return <section className="society-dashboard emergency-contacts-page">
    <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> MANAGE SOCIETY</div><h1>Emergency contacts</h1><p>{society?.name ? `Important services for ${society.name}.` : 'Keep important emergency and utility numbers available to your community.'}</p></div>{canCreate && <button type="button" className="society-add-button" onClick={startCreate}><Plus size={17} /> Add contact</button>}</header>
    {error && <div className="society-error" role="alert">{error}<button type="button" onClick={load}>Try again</button></div>}
    {message && <div className="society-success" role="status">{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <section className="society-list-panel"><div className="society-list-heading"><div><h2>Emergency directory</h2><p>Contacts configured for the active society.</p></div><span className="society-count">{loading ? 'Loading' : `${contacts.length} contacts`}</span></div>
      {loading ? <div className="society-loading">Loading emergency contacts…</div> : contacts.length ? <div className="society-table-wrap"><table className="society-table emergency-contacts-table"><thead><tr><th>Service</th><th>Category</th><th>Phone</th><th>Availability</th><th>Address</th><th>Status</th>{(canUpdate || canDelete) && <th>Actions</th>}</tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong>{contact.email && <small>{contact.email}</small>}</td><td>{pretty(contact.category)}</td><td><a href={`tel:${contact.phone}`} className="emergency-phone-link"><Phone size={14} />{contact.phone}</a>{contact.alternatePhone && <small>Alt: {contact.alternatePhone}</small>}</td><td><span className="emergency-hours"><Clock3 size={14} />{contact.available24x7 ? '24/7' : contact.operatingHours || 'Hours not specified'}</span></td><td>{contact.address ? <span className="emergency-address"><MapPin size={14} />{contact.address}</span> : '—'}</td><td><span className={`emergency-status${contact.isActive ? ' is-active' : ''}`}>{contact.isActive ? 'Active' : 'Inactive'}</span></td>{(canUpdate || canDelete) && <td><div className="society-row-actions">{canUpdate && <button type="button" className="society-icon-action" title="Edit contact" aria-label={`Edit ${contact.name}`} onClick={() => startEdit(contact)}><Edit2 size={15} /></button>}{canDelete && <button type="button" className="society-icon-action society-delete-action" title="Remove contact" aria-label={`Remove ${contact.name}`} onClick={() => remove(contact)}><Trash2 size={15} /></button>}</div></td>}</tr>)}</tbody></table></div> : <div className="society-empty"><span className="society-empty-icon"><PhoneCall size={22} /></span><h3>No emergency contacts added</h3><p>Add police, fire, ambulance, utilities, or society office numbers for quick access.</p>{canCreate && <button type="button" className="society-add-button" onClick={startCreate}><Plus size={16} /> Add first contact</button>}</div>}
    </section>
    {formOpen && <div className="society-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="emergency-contact-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-contact-title"><header><div><span className="notices-eyebrow"><AlertTriangle size={14} /> SOCIETY DIRECTORY</span><h2 id="emergency-contact-title">{editing ? 'Edit emergency contact' : 'Add emergency contact'}</h2><p>Enter a reliable contact for residents and staff.</p></div><button type="button" className="notice-close-button" onClick={() => setFormOpen(false)} aria-label="Close"><X size={18} /></button></header>
      <form className="emergency-contact-form" onSubmit={submit}><label>Name<input required maxLength={140} value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label><label>Category<select value={form.category} onChange={(event) => updateField('category', event.target.value)}>{CATEGORIES.map((category) => <option key={category} value={category}>{pretty(category)}</option>)}</select></label><label>Phone<input required type="tel" maxLength={30} value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label><label>Alternate phone (optional)<input type="tel" maxLength={30} value={form.alternatePhone || ''} onChange={(event) => updateField('alternatePhone', event.target.value)} /></label><label>Email (optional)<span className="emergency-input-icon"><Mail size={15} /><input type="email" maxLength={255} value={form.email || ''} onChange={(event) => updateField('email', event.target.value)} /></span></label><label>Operating hours (optional)<input maxLength={120} value={form.operatingHours || ''} onChange={(event) => updateField('operatingHours', event.target.value)} placeholder="e.g. 9:00 AM – 6:00 PM" /></label><label className="emergency-field-wide">Address (optional)<input maxLength={500} value={form.address || ''} onChange={(event) => updateField('address', event.target.value)} /></label><label className="emergency-field-wide">Notes (optional)<textarea rows={3} value={form.notes || ''} onChange={(event) => updateField('notes', event.target.value)} /></label><div className="emergency-checks"><label><input type="checkbox" checked={Boolean(form.available24x7)} onChange={(event) => updateField('available24x7', event.target.checked)} /> Available 24/7</label>{editing && <label><input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => updateField('isActive', event.target.checked)} /> Active contact</label>}</div>{error && <div className="notice-form-error emergency-field-wide">{error}</div>}<footer className="emergency-field-wide"><button type="button" className="notice-cancel-button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="society-add-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}</button></footer></form>
    </section></div>}
  </section>;
}
