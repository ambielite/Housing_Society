import { Fragment, useEffect, useState } from 'react';
import { Baby, ChevronDown, Plus, RefreshCw, SquarePen, Trash2, Users, X } from 'lucide-react';
import communityApi from '../api/community.api';
import { confirmDashboardAction } from '../../../lib/dashboardConfirmation.js';

const rowsFrom = (response) => response?.data?.data ?? response?.data ?? [];
const dateLabel = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : '—';
const timeLabel = (value) => value ? new Date(`2000-01-01T${value}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';

export default function KidsActivitiesPanel() {
  const deadlineLabel = (value) => value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const localDateTimeValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [activities, setActivities] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { name: '', description: '', date: '', timeHour: '', timeMinute: '', timePeriod: '', endTimeHour: '', endTimeMinute: '', endTimePeriod: '', minimumAge: '', maximumAge: '', winnerPrize: '', registrationRequired: true, registrationDeadlineDate: '', registrationDeadlineHour: '', registrationDeadlineMinute: '00', registrationDeadlinePeriod: 'AM' };
  const [form, setForm] = useState(emptyForm);
  const [editActivity, setEditActivity] = useState(null);

  const load = async () => {
    setLoading(true); setError(''); setRegistrations({}); setExpanded(null);
    try { setActivities(rowsFrom(await communityApi.get('/kids-activities/activities'))); }
    catch (e) { setError(e.response?.data?.message || 'Could not load kids activities.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const loadRegistrations = async (activity) => {
    const id = activity.id ?? activity.uuid;
    setExpanded(expanded === id ? null : id);
    if (registrations[id]) return;
    try { const rows = rowsFrom(await communityApi.get(`/kids-activities/activities/${id}/registrations`)); setRegistrations((current) => ({ ...current, [id]: rows })); }
    catch (e) { setError(e.response?.data?.message || 'Could not load registrations.'); }
  };

  const saveActivity = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const hour12 = Number(form.timeHour);
      const hour24 = (hour12 % 12) + (form.timePeriod === 'PM' ? 12 : 0);
      const time = `${String(hour24).padStart(2, '0')}:${form.timeMinute}`;
      const endHour12 = Number(form.endTimeHour);
      const endHour24 = (endHour12 % 12) + (form.endTimePeriod === 'PM' ? 12 : 0);
      const endTime = `${String(endHour24).padStart(2, '0')}:${form.endTimeMinute}`;
      const deadlineHour12 = Number(form.registrationDeadlineHour);
      const deadlineHour24 = (deadlineHour12 % 12) + (form.registrationDeadlinePeriod === 'PM' ? 12 : 0);
      const deadlineLocal = `${form.registrationDeadlineDate}T${String(deadlineHour24).padStart(2, '0')}:${form.registrationDeadlineMinute}:00`;
      const payload = { ...form, time, endTime, registrationRequired: form.registrationRequired === true, registrationDeadline: form.registrationRequired ? new Date(deadlineLocal).toISOString() : null };
      if (editActivity) await communityApi.put(`/kids-activities/activities/${editActivity.id}`, payload);
      else await communityApi.post('/kids-activities/activities', payload);
      setShowForm(false); setEditActivity(null); setForm(emptyForm);
      await load();
    } catch (e) { setError(e.response?.data?.message || `Could not ${editActivity ? 'update' : 'create'} the kids activity.`); }
    finally { setBusy(false); }
  };

  const openCreate = () => { setError(''); setEditActivity(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (activity) => {
    const [hourRaw = '00', minute = '00'] = String(activity.activity_time || '').split(':');
    const hour24 = Number(hourRaw);
    const [endHourRaw = hourRaw, endMinute = minute] = String(activity.activity_end_time || activity.activity_time || '').split(':');
    const endHour24 = Number(endHourRaw);
    const deadlineLocal = localDateTimeValue(activity.registration_deadline);
    const deadlineHour24 = Number(deadlineLocal.slice(11, 13));
    setError(''); setEditActivity(activity);
    setForm({ name: activity.name || '', description: activity.description || '', date: String(activity.activity_date || '').slice(0, 10), timeHour: String(hour24 % 12 || 12), timeMinute: minute, timePeriod: hour24 >= 12 ? 'PM' : 'AM', endTimeHour: String(endHour24 % 12 || 12), endTimeMinute: endMinute, endTimePeriod: endHour24 >= 12 ? 'PM' : 'AM', minimumAge: String(activity.minimum_age ?? ''), maximumAge: String(activity.maximum_age ?? ''), winnerPrize: activity.winner_prize || '', registrationRequired: activity.registration_required !== false, registrationDeadlineDate: deadlineLocal.slice(0, 10), registrationDeadlineHour: deadlineLocal ? String(deadlineHour24 % 12 || 12) : '', registrationDeadlineMinute: deadlineLocal ? deadlineLocal.slice(14, 16) : '00', registrationDeadlinePeriod: deadlineHour24 >= 12 ? 'PM' : 'AM' });
    setShowForm(true);
  };

  const deleteActivity = async (activity) => {
    if (!await confirmDashboardAction(`Delete "${activity.name}" and its registrations? This cannot be undone.`, { confirmLabel: 'Delete activity', danger: true })) return;
    setDeletingId(activity.id); setError('');
    try {
      await communityApi.delete(`/kids-activities/activities/${activity.id}`);
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not delete the kids activity.'); }
    finally { setDeletingId(null); }
  };

  return <section className="society-list-panel kids-activities-panel">
    <div className="society-list-heading">
      <div><span className="society-eyebrow">COMMUNITY</span><h2>Kids Activities</h2><p>Create activities for children in the society and review family registrations.</p></div>
      <div className="society-row-actions"><button className="society-workflow-action" onClick={load}><RefreshCw size={15}/> Refresh</button><button className="society-add-button" onClick={openCreate}><Plus size={17}/> Create activity</button></div>
    </div>
    {error && <div className="society-error" role="alert">{error}</div>}
    {loading ? <div className="society-loading">Loading kids activities…</div> : activities.length ? <div className="society-table-wrap">
      <table className="society-table kids-activities-table"><thead><tr><th>Activity</th><th>Date</th><th>Time</th><th>Age range</th><th>Winner prize</th><th>Registration</th><th>Children</th><th>Actions</th></tr></thead>
        <tbody>{activities.map((activity) => <Fragment key={activity.id}>
          <tr key={activity.id}>
            <td className="kids-activity-cell"><span className={`security-status-pill kids-activity-status ${String(activity.status || '').toLowerCase().replaceAll('_', '-')}`}>{activity.status}</span><strong>{activity.name}</strong><small>{expandedDescriptions[activity.id] || (activity.description || '').length <= 150 ? activity.description : `${activity.description.slice(0, 150).trimEnd()}...`}</small>{(activity.description || '').length > 150 && <button type="button" className="kids-activity-description-toggle" onClick={() => setExpandedDescriptions((current) => ({ ...current, [activity.id]: !current[activity.id] }))}>{expandedDescriptions[activity.id] ? 'Show less' : 'Show more'}</button>}</td>
            <td>{dateLabel(activity.activity_date)}</td><td><small>From {timeLabel(activity.activity_time)}</small><small>To {timeLabel(activity.activity_end_time || activity.activity_time)}</small></td>
            <td>{activity.minimum_age} to {activity.maximum_age} years</td><td>{activity.winner_prize || 'Not specified'}</td>
            <td>{activity.registration_required === false ? 'Not required' : <>Required{activity.registration_deadline && <small className="kids-activity-deadline">By {deadlineLabel(activity.registration_deadline)}</small>}</>}</td>
            <td>{activity.child_count || 0}</td>
            <td><div className="kids-activity-actions"><button type="button" className="security-table-icon-action" onClick={() => openEdit(activity)} title="Edit" aria-label={`Edit ${activity.name}`}><SquarePen size={18} aria-hidden="true"/></button><button type="button" className="security-table-icon-action is-delete" onClick={() => deleteActivity(activity)} disabled={deletingId === activity.id} title="Delete" aria-label={`Delete ${activity.name}`}><Trash2 size={18} aria-hidden="true"/></button><button className="society-workflow-action" onClick={() => loadRegistrations(activity)}><Users size={14}/>{expanded === activity.id ? 'Hide' : 'Participants'} <ChevronDown size={14}/></button></div></td>
          </tr>
          {expanded === activity.id && <tr key={`${activity.id}-registrations`}><td colSpan="8"><div className="kids-registration-table-wrap">
            {registrations[activity.id] ? registrations[activity.id].length ? <table className="society-table"><thead><tr><th>Resident</th><th>Tower</th><th>Unit</th><th>Child name</th><th>Age</th><th>Submitted</th></tr></thead><tbody>
              {registrations[activity.id].map((row, index) => <tr key={`${row.registration_id}-${index}`}><td>{row.resident_name || 'Resident'}</td><td>{row.tower_name || '—'}</td><td>{row.unit_number || '—'}</td><td>{row.child_name}</td><td>{row.child_age}</td><td>{new Date(row.created_at).toLocaleString()}</td></tr>)}
            </tbody></table> : <div className="society-empty">No children registered yet.</div> : <div className="society-loading">Loading registrations…</div>}
          </div></td></tr>}
        </Fragment>)}</tbody>
      </table>
    </div> : <div className="society-empty"><Baby size={24}/><h3>No kids activities yet</h3><p>Create an activity to notify residents and collect registrations.</p><button className="society-add-button" onClick={openCreate}><Plus size={16}/> Create first activity</button></div>}
    {showForm && <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && !busy && setShowForm(false)}><section className="society-form-modal security-record-modal community-record-modal kids-activity-modal" role="dialog" aria-modal="true" aria-labelledby="kids-activity-title">
      <header className="society-form-header"><div><span className="society-eyebrow">COMMUNITY · KIDS ACTIVITIES</span><h2 id="kids-activity-title">{editActivity ? 'Edit kids activity' : 'Create kids activity'}</h2><p>Residents of this society will receive an in-app notification.</p></div><button className="modal-close-btn" aria-label="Close" disabled={busy} onClick={() => setShowForm(false)}><X size={18}/></button></header>
      {error && <p className="security-form-error" role="alert">{error}</p>}
      <form onSubmit={saveActivity}><div className="society-form-body community-record-body"><div className="security-form-grid community-form-grid kids-activity-form-grid">
        <label className="kids-activity-wide">Activity name<input required maxLength="200" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Drawing competition"/></label>
        <label>Date<input required type="date" {...(editActivity ? {} : { min: new Date().toISOString().slice(0, 10) })} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label>
        <label className="kids-activity-wide">Activity time<div className="kids-activity-time-range">
          <div><span>From</span><div className="kids-activity-time-controls">
            <select required aria-label="Start hour" value={form.timeHour} onChange={(event) => setForm({ ...form, timeHour: event.target.value })}><option value="">Hour</option>{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select>
            <span>:</span>
            <select required aria-label="Start minute" value={form.timeMinute} onChange={(event) => setForm({ ...form, timeMinute: event.target.value })}><option value="">Minute</option>{Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select>
            <select required aria-label="Start AM or PM" value={form.timePeriod} onChange={(event) => setForm({ ...form, timePeriod: event.target.value })}><option value="">AM/PM</option><option>AM</option><option>PM</option></select>
          </div></div>
          <div><span>To</span><div className="kids-activity-time-controls">
            <select required aria-label="End hour" value={form.endTimeHour} onChange={(event) => setForm({ ...form, endTimeHour: event.target.value })}><option value="">Hour</option>{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select>
            <span>:</span>
            <select required aria-label="End minute" value={form.endTimeMinute} onChange={(event) => setForm({ ...form, endTimeMinute: event.target.value })}><option value="">Minute</option>{Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select>
            <select required aria-label="End AM or PM" value={form.endTimePeriod} onChange={(event) => setForm({ ...form, endTimePeriod: event.target.value })}><option value="">AM/PM</option><option>AM</option><option>PM</option></select>
          </div></div>
        </div></label>
        <label>From age<input required type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2" value={form.minimumAge} onChange={(event) => setForm({ ...form, minimumAge: event.target.value.replace(/\D/g, '') })} placeholder="0"/></label>
        <label>To age<input required type="text" inputMode="numeric" pattern="[0-9]*" maxLength="2" value={form.maximumAge} onChange={(event) => setForm({ ...form, maximumAge: event.target.value.replace(/\D/g, '') })} placeholder="12"/></label>
        <label>Resident registration required<select value={form.registrationRequired ? "yes" : "no"} onChange={(event) => setForm({ ...form, registrationRequired: event.target.value === "yes", registrationDeadlineDate: event.target.value === "yes" ? form.registrationDeadlineDate : '', registrationDeadlineHour: event.target.value === "yes" ? form.registrationDeadlineHour : '' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
        {form.registrationRequired && <label className="kids-activity-wide">Registration deadline<div className="kids-activity-deadline-controls"><input required type="date" min={localToday()} value={form.registrationDeadlineDate} onChange={(event) => setForm({ ...form, registrationDeadlineDate: event.target.value })}/><select required aria-label="Deadline hour" value={form.registrationDeadlineHour} onChange={(event) => setForm({ ...form, registrationDeadlineHour: event.target.value })}><option value="">Hour</option>{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select><span>:</span><select required aria-label="Deadline minute" value={form.registrationDeadlineMinute} onChange={(event) => setForm({ ...form, registrationDeadlineMinute: event.target.value })}>{Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select><select required aria-label="Deadline AM or PM" value={form.registrationDeadlinePeriod} onChange={(event) => setForm({ ...form, registrationDeadlinePeriod: event.target.value })}><option>AM</option><option>PM</option></select></div></label>}
        <label>Winner prize (optional)<input maxLength="255" value={form.winnerPrize} onChange={(event) => setForm({ ...form, winnerPrize: event.target.value })} placeholder="Prize details"/></label>
        <label className="kids-activity-wide">Activity description<textarea required maxLength="3000" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the activity and what children will do"/></label>
      </div></div><footer className="society-form-footer"><button type="button" className="btn-secondary" disabled={busy} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? (editActivity ? 'Saving...' : 'Creating...') : (editActivity ? 'Save changes' : 'Create activity')}</button></footer></form>
    </section></div>}
  </section>;
}
