import { useDashboardFeedback } from '../../../lib/useDashboardFeedback.js';
import { confirmDashboardAction } from '../../../lib/dashboardConfirmation.js';
import { dispatchActionToast } from '../../../lib/actionToastEvents.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, Check, ChevronDown, CircleAlert, Clock3, Eye, FileText, Megaphone, Plus, Printer, RefreshCw, Search, Send, UserRound, X } from 'lucide-react';
import noticesApi from '../api/notices.api';
import notificationsApi from '../../notifications/api/notifications.api';
import useAuth from '../../../app/providers/useAuth';
import './noticeboard.css';

const TABS = [
  { key: 'current', label: 'Current', icon: Megaphone },
  { key: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { key: 'expired', label: 'Expired', icon: Clock3 },
];
const NOTICE_CARD_ACCENTS = [
  '#c43d4b', // red
  '#292d35', // black
  '#c08a00', // yellow
  '#3678cc', // blue
  '#697586', // grey
  '#7752c9', // violet
  '#30845b', // green
  '#c45c94', // pink
];
const noticeCardAccent = (index) => NOTICE_CARD_ACCENTS[index % NOTICE_CARD_ACCENTS.length];
const EMPTY_FORM = { title: '', description: '', scheduledAt: '', expiresAt: '', templateId: '' };
const value = (row, snake, camel = snake) => row?.[snake] ?? row?.[camel];
const isExpiredNotice = (notice, activeTab) => {
  const status = String(value(notice, 'status') || '').trim().toUpperCase();
  const expiry = value(notice, 'expires_at', 'expiresAt')
    || value(notice, 'expired_at', 'expiredAt');
  const expiryTime = expiry ? new Date(expiry).getTime() : Number.NaN;
  return activeTab === 'expired' || status === 'EXPIRED'
    || (Number.isFinite(expiryTime) && expiryTime <= Date.now());
};
const dateTime = (raw) => raw ? new Date(raw).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const dateOnly = (raw) => raw ? new Date(raw).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const localInput = (raw) => {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const parseDateTimeParts = (raw) => {
  if (!raw) return { date: '', hour: '', minute: '', period: '' };
  if (raw.includes('|')) {
    const [date = '', hour = '', minute = '', period = ''] = raw.split('|');
    return { date, hour, minute, period };
  }
  const [date = '', time = ''] = raw.split('T');
  if (!date || !time) return { date: '', hour: '', minute: '', period: '' };
  const [rawHour, minute = ''] = time.split(':');
  const hour24 = Number(rawHour);
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) return { date: '', hour: '', minute: '', period: '' };
  return {
    date,
    hour: String(hour24 % 12 || 12),
    minute,
    period: hour24 >= 12 ? 'PM' : 'AM',
  };
};
const toIso = (raw) => {
  if (!raw) return null;
  let localValue = raw;
  if (raw.includes('|')) {
    const { date, hour, minute, period } = parseDateTimeParts(raw);
    const hourNumber = Number(hour);
    const minuteNumber = Number(minute);
    if (!date || !hour || !minute || !['AM', 'PM'].includes(period) || hourNumber < 1 || hourNumber > 12 || minuteNumber < 0 || minuteNumber > 59) return null;
    const hour24 = (hourNumber % 12) + (period === 'PM' ? 12 : 0);
    localValue = `${date}T${String(hour24).padStart(2, '0')}:${String(minuteNumber).padStart(2, '0')}`;
  }
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const rowsFrom = (result) => {
  const payload = result?.data ?? result;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};
const errorMessage = (error) => error?.response?.data?.message || error?.message || 'Could not complete that request.';

function NoticeDateTimeField({ label, value, onChange }) {
  const parts = parseDateTimeParts(value);
  const update = (key, next) => {
    const updated = { ...parts, [key]: next };
    const values = [updated.date, updated.hour, updated.minute, updated.period];
    onChange(values.every((part) => !part) ? '' : values.join('|'));
  };
  return (
    <div className="notice-field">
      <span>{label}</span>
      <div className="notice-datetime-control">
        <input aria-label={`${label} date`} type="date" value={parts.date} onChange={(event) => update('date', event.target.value)} />
        <div className="notice-time-control">
          <select aria-label={`${label} hour`} value={parts.hour} onChange={(event) => update('hour', event.target.value)}>
            <option value="">Hour</option>
            {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
          </select>
          <span>:</span>
          <select aria-label={`${label} minute`} value={parts.minute} onChange={(event) => update('minute', event.target.value)}>
            <option value="">Min</option>
            {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')).map((minute) => <option key={minute} value={minute}>{minute}</option>)}
          </select>
          <select aria-label={`${label} AM or PM`} value={parts.period} onChange={(event) => update('period', event.target.value)}>
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('NOTICE_CREATE');
  const canUpdate = hasPermission('NOTICE_UPDATE');
  const [tab, setTab] = useState('current');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useDashboardFeedback('', 'error');
  const [message, setMessage] = useDashboardFeedback('', 'success');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMenu, setOpenMenu] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await noticesApi.list({ tab, search, page, limit });
      setRows(rowsFrom(result));
      setTotal(Number(result?.total || 0));
    } catch (requestError) {
      setError(errorMessage(requestError));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, search, page, limit]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    Promise.allSettled([noticesApi.templates(), notificationsApi.getTemplates({ status: 'ACTIVE' })]).then(([noticeResult, notificationResult]) => {
      setTemplates(noticeResult.status === 'fulfilled' ? rowsFrom(noticeResult.value) : []);
      setNotificationTemplates(notificationResult.status === 'fulfilled' ? rowsFrom(notificationResult.value).filter((item) => item.status === 'ACTIVE') : []);
    });
  }, []);
  useEffect(() => {
    if (!formOpen && !viewing) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setFormOpen(false); setViewing(null); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [formOpen, viewing]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, total);
  const selectedTab = useMemo(() => TABS.find((item) => item.key === tab), [tab]);
  const availableTemplates = useMemo(() => [
    ...templates.map((template) => ({
      id: `notice:${template.id}`,
      label: `${template.title} · Notice template`,
      title: template.title,
      description: template.description,
    })),
    ...notificationTemplates.map((template) => ({
      id: `notification:${template.id}`,
      label: `${template.templateName} · ${template.channel}`,
      title: template.title || template.templateName,
      description: template.messageTemplate,
    })),
  ], [templates, notificationTemplates]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setFormOpen(true);
  };
  const openEdit = (notice) => {
    setError('');
    setMessage('');
    if (isExpiredNotice(notice, tab)) {
      setViewing(null);
      setOpenMenu('');
      setFormOpen(false);
      setEditing(null);
      dispatchActionToast('error', 'Expired notices cannot be edited.');
      return;
    }
    setViewing(null);
    setEditing(notice);
    setForm({
      title: value(notice, 'title') || '',
      description: value(notice, 'description') || '',
      scheduledAt: localInput(value(notice, 'scheduled_at', 'scheduledAt')),
      expiresAt: localInput(value(notice, 'expires_at', 'expiresAt')),
      templateId: '',
    });
    setError('');
    setFormOpen(true);
    setOpenMenu('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editing && isExpiredNotice(editing, tab)) {
      setFormOpen(false);
      setEditing(null);
      dispatchActionToast('error', 'Expired notices cannot be edited.');
      return;
    }
    const scheduledAt = toIso(form.scheduledAt);
    const expiresAt = toIso(form.expiresAt);
    if ((form.scheduledAt && !scheduledAt) || (form.expiresAt && !expiresAt)) {
      setError('Choose a date, hour, minute, and AM/PM for each time you enter.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      scheduledAt,
      expiresAt,
    };
    try {
      if (editing) await noticesApi.update(value(editing, 'id'), body);
      else if (form.templateId.startsWith('notice:')) await noticesApi.createFromTemplate(form.templateId.slice('notice:'.length), body);
      else await noticesApi.create(body);
      setFormOpen(false); setEditing(null); setForm({ ...EMPTY_FORM });
      setMessage(editing ? 'Notice updated.' : 'Notice published or scheduled.');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const viewNotice = async (notice) => {
    setOpenMenu('');
    setViewing(notice);
    if (isExpiredNotice(notice, tab)) return;
    try {
      await noticesApi.markRead(value(notice, 'id'));
      await load();
    } catch { /* Viewing remains available if the reader receipt cannot be recorded. */ }
  };

  const runAction = async (action, notice) => {
    setOpenMenu(''); setBusy(true); setError(''); setMessage('');
    const id = value(notice, 'id');
    try {
      if (action === 'template') {
        await noticesApi.saveTemplate(id);
        const list = await noticesApi.templates(); setTemplates(rowsFrom(list));
        setMessage('Saved as a notice template.');
      } else if (action === 'expire') {
        if (!await confirmDashboardAction(`Expire “${value(notice, 'title')}”?`)) return;
        await noticesApi.expire(id); setMessage('Notice expired.');
      } else if (action === 'renotify') {
        if (!await confirmDashboardAction(`Send this notice again to society members?`)) return;
        const result = await noticesApi.renotify(id);
        setMessage(`Notice reminder queued for ${result?.queued_count ?? 'society'} recipients.`);
      }
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const renderManageMenu = (notice) => {
    const id = value(notice, 'id');
    const menuOpen = openMenu === id;
    const status = value(notice, 'status');
    return (
      <div className="notice-manage-wrap">
        <button type="button" className="notice-manage-trigger" aria-expanded={menuOpen} onClick={() => setOpenMenu(menuOpen ? '' : id)}>
          Manage <ChevronDown size={14} />
        </button>
        {menuOpen && <div className="notice-manage-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => viewNotice(notice)}><Eye size={15} /> View</button>
          <button type="button" role="menuitem" onClick={() => { setOpenMenu(''); window.print(); }}><Printer size={15} /> Print</button>
          {canUpdate && <>
            {status !== 'EXPIRED' && <button type="button" role="menuitem" onClick={() => openEdit(notice)}><FileText size={15} /> Edit</button>}
            <button type="button" role="menuitem" onClick={() => runAction('template', notice)}><FileText size={15} /> Save as template</button>
            {tab === 'current' && <>
              <button type="button" role="menuitem" onClick={() => runAction('expire', notice)}><CircleAlert size={15} /> Expire</button>
              <button type="button" role="menuitem" onClick={() => runAction('renotify', notice)}><BellRing size={15} /> Re-notify</button>
            </>}
          </>}
        </div>}
      </div>
    );
  };

  return (
    <section className="society-dashboard notices-page">
      <header className="society-heading notices-heading">
        <div className="notices-title-block">
          <span className="notices-eyebrow"><span className="society-eyebrow-dot" /> MANAGE SOCIETY <span className="noticeboard-breadcrumb">/ NOTICEBOARD</span></span>
          <h1>Noticeboard</h1>
          <p>Publish society updates, meeting notices, and important reminders.</p>
        </div>
        <div className="noticeboard-heading-actions"><button type="button" className="notices-refresh" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'notices-spinning' : ''}/>Refresh</button>{canCreate && <button type="button" className="notices-add-button" onClick={openCreate}><Plus size={17} /> Add new notice</button>}</div>
      </header>

      <section className="noticeboard-banner"><span className="noticeboard-banner-icon"><Megaphone size={21}/></span><div><span>COMMUNITY UPDATES</span><h2>Keep everyone informed</h2><p>Share important announcements, meeting minutes, and reminders with your society.</p></div><span className="noticeboard-banner-art"><BellRing size={21}/></span></section>

      <nav className="notices-tabs" aria-label="Notice status">
        {TABS.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setPage(1); setMessage(''); }}><Icon size={16} />{label}</button>)}
      </nav>

      {message && <div className="notices-alert notices-alert-success" role="status"><Check size={16} />{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
      {error && <div className="notices-alert notices-alert-error" role="alert">{error}<button type="button" onClick={() => { setError(''); void load(); }}>Try again</button></div>}

      <section className="notices-list-panel noticeboard-panel">
        <div className="noticeboard-section-heading"><div><span className="noticeboard-section-kicker">SOCIETY COMMUNICATIONS</span><h2>{selectedTab?.label} notices</h2><p>Browse announcements and see who has read each update.</p></div><span className="noticeboard-total">{loading ? 'Loading…' : `${total} ${total === 1 ? 'notice' : 'notices'}`}</span></div>
        <div className="notices-toolbar">
          <label className="notices-search"><Search size={17} /><input aria-label="Search notices" placeholder="Search by title and description" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />{searchInput && <button type="button" onClick={() => setSearchInput('')} aria-label="Clear search"><X size={15} /></button>}</label>
          <div className="notices-toolbar-actions"><span>{loading ? 'Loading notices…' : `${total} ${total === 1 ? 'notice' : 'notices'}`}</span></div>
        </div>
        {loading ? <div className="notices-empty"><span className="notices-loader" />Loading {selectedTab?.label.toLowerCase()} notices…</div> : rows.length ? <>
          <div className="noticeboard-grid">{rows.map((notice, index) => {
            const postedAt = value(notice, 'posted_at', 'postedAt');
            const scheduledAt = value(notice, 'scheduled_at', 'scheduledAt');
            const expiresAt = value(notice, 'expires_at', 'expiresAt');
            const expiredAt = value(notice, 'expired_at', 'expiredAt') || expiresAt;
            const author = value(notice, 'posted_by', 'postedBy') || 'Society management';
            return <article className={`noticeboard-card noticeboard-card-${tab}${openMenu === value(notice, 'id') ? ' noticeboard-card-menu-open' : ''}`} style={{ '--notice-card-accent': noticeCardAccent(index) }} key={`card-${value(notice, 'id')}`}>
              <div className="noticeboard-card-top"><span className={`noticeboard-card-icon noticeboard-icon-${tab}`}><Megaphone size={18}/></span><span className={`noticeboard-status noticeboard-status-${tab}`}>{tab === 'current' ? 'Published' : selectedTab?.label}</span></div>
              <button type="button" className="noticeboard-card-title" onClick={() => viewNotice(notice)}>{value(notice, 'title')}</button>
              <div className="noticeboard-card-meta">
                <span><CalendarClock size={14}/>{tab === 'upcoming' ? `Scheduled ${dateTime(scheduledAt)}` : tab === 'expired' ? `Expired ${dateTime(expiredAt)}` : `Posted ${dateTime(postedAt || value(notice, 'created_at', 'createdAt'))}`}</span>
                <span><UserRound size={14}/>{tab === 'expired' ? `Expired by ${value(notice, 'expired_by_name', 'expiredByName') || 'System'}` : `${tab === 'upcoming' ? 'Created' : 'Posted'} by ${author}`}</span>
                {tab === 'upcoming' && expiresAt && <span><Clock3 size={14}/>Expires {dateTime(expiresAt)}</span>}
                {tab === 'current' && expiresAt && <span><Clock3 size={14}/>Expires {dateTime(expiresAt)}</span>}
                {tab === 'current' && value(notice, 'renotified_at', 'renotifiedAt') && <span><BellRing size={14}/>Reminder sent {dateTime(value(notice, 'renotified_at', 'renotifiedAt'))}</span>}
              </div>
              <p className="noticeboard-card-description">{value(notice, 'description')}</p>
              <footer className="noticeboard-card-footer"><button type="button" className="noticeboard-read-more" onClick={() => viewNotice(notice)}>Read full notice <span>→</span></button><div className="noticeboard-card-menu">{renderManageMenu(notice)}</div></footer>
            </article>;
          })}</div>
          <div className="notices-table-wrap"><table className="notices-table">
            <thead><tr><th>Title</th><th>Description</th>{tab === 'upcoming' ? <><th>Created on</th><th>Created by</th><th>Scheduled for</th><th>Expiring on</th></> : <><th>Posted on</th>{tab === 'expired' && <th>Expired by</th>}<th>{tab === 'expired' ? 'Expired on' : 'Posted by'}</th><th>{tab === 'current' ? 'Expiring on' : 'Renotified on'}</th>{tab === 'current' && <th>Renotified on</th>}</>}<th>Read by</th><th>Options</th></tr></thead>
            <tbody>{rows.map((notice) => {
              const postedAt = value(notice, 'posted_at', 'postedAt');
              const scheduledAt = value(notice, 'scheduled_at', 'scheduledAt');
              const expiresAt = value(notice, 'expires_at', 'expiresAt');
              const expiredAt = value(notice, 'expired_at', 'expiredAt') || expiresAt;
              const readCount = Number(value(notice, 'read_count', 'readCount') || 0);
              const recipientCount = Number(value(notice, 'recipient_count', 'recipientCount') || total);
              return <tr key={value(notice, 'id')}>
                <td><button type="button" className="notice-title-link" onClick={() => viewNotice(notice)}>{value(notice, 'title')}</button></td>
                <td><p className="notice-description-cell">{value(notice, 'description')}</p><button type="button" className="notice-show-more" onClick={() => viewNotice(notice)}>Show more</button></td>
                {tab === 'upcoming' ? <><td>{dateOnly(value(notice, 'created_at', 'createdAt'))}</td><td>{value(notice, 'posted_by', 'postedBy') || '—'}</td><td>{dateTime(scheduledAt)}</td><td>{dateOnly(expiresAt)}</td></> : <><td>{dateOnly(postedAt || value(notice, 'created_at', 'createdAt'))}</td>{tab === 'expired' && <td>{value(notice, 'expired_by_name', 'expiredByName') || 'System'}</td>}<td>{tab === 'expired' ? dateOnly(expiredAt) : (value(notice, 'posted_by', 'postedBy') || '—')}</td><td>{tab === 'current' ? dateOnly(expiresAt) : dateOnly(value(notice, 'renotified_at', 'renotifiedAt'))}</td>{tab === 'current' && <td>{dateOnly(value(notice, 'renotified_at', 'renotifiedAt'))}</td>}</>}
                <td><span className="notice-read-count">{readCount} / {recipientCount}</span></td>
                <td>{renderManageMenu(notice)}</td>
              </tr>;
            })}</tbody>
          </table></div>
          <footer className="notices-pagination"><label>Show <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select> entries</label><div><span>{start}–{end} of {total}</span><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="notices-page-number">{page}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></div></footer>
        </> : <div className="notices-empty"><span className="notices-empty-icon"><Megaphone size={23} /></span><h2>{search ? 'No matching notices' : `No ${selectedTab?.label.toLowerCase()} notices`}</h2><p>{search ? 'Try a different search phrase.' : tab === 'upcoming' ? 'Scheduled notices will appear here.' : tab === 'expired' ? 'Notices that have expired will appear here.' : 'Publish a notice to share an update with your society.'}</p>{!search && tab === 'current' && canCreate && <button type="button" className="notices-add-button" onClick={openCreate}><Plus size={16} /> Add a notice</button>}</div>}
      </section>

      {formOpen && <div className="notice-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-form-title">
        <header><div><span className="notices-eyebrow"><Megaphone size={14} /> NOTICEBOARD</span><h2 id="notice-form-title">{editing ? 'Edit notice' : 'Add new Notice / MoM'}</h2><p>Share an update with members of the active society.</p></div><button type="button" className="notice-close-button" onClick={() => setFormOpen(false)} aria-label="Close"><X size={18} /></button></header>
        <form onSubmit={submit}>
          {!editing && availableTemplates.length > 0 && <label className="notice-field notice-template-field">Use saved template <select value={form.templateId} onChange={(event) => { const next = availableTemplates.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, templateId: event.target.value, title: next?.title || current.title, description: next?.description || current.description })); }}><option value="">Start from scratch</option>{availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>}
          <label className="notice-field">Title <input maxLength={255} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Annual General Meeting notice" /></label>
          <label className="notice-field">Description <textarea required rows={6} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Write the notice details for residents…" /></label>
          <div className="notice-date-grid"><NoticeDateTimeField label="Schedule for (optional)" value={form.scheduledAt} onChange={(scheduledAt) => setForm((current) => ({ ...current, scheduledAt }))} /><NoticeDateTimeField label="Expires on (optional)" value={form.expiresAt} onChange={(expiresAt) => setForm((current) => ({ ...current, expiresAt }))} /></div>
          {error && <div className="notice-form-error" role="alert">{error}</div>}
          <footer><button type="button" className="notice-cancel-button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="notices-add-button" disabled={busy}>{busy ? 'Saving…' : <><Send size={15} />{editing ? 'Save changes' : form.scheduledAt ? 'Schedule notice' : 'Publish notice'}</>}</button></footer>
        </form>
      </section></div>}

      {viewing && <div className="notice-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null); }}><article className="notice-modal notice-detail-modal" role="dialog" aria-modal="true" aria-labelledby="notice-view-title">
        <header><div><span className="notices-eyebrow"><Eye size={14} /> NOTICE DETAILS</span><h2 id="notice-view-title">{value(viewing, 'title')}</h2><p>Posted {dateTime(value(viewing, 'posted_at', 'postedAt') || value(viewing, 'created_at', 'createdAt'))} by {value(viewing, 'posted_by', 'postedBy') || 'System'}</p></div><button type="button" className="notice-close-button" onClick={() => setViewing(null)} aria-label="Close"><X size={18} /></button></header>
        <div className="notice-detail-body"><p>{value(viewing, 'description')}</p><div><span><Clock3 size={15} /> Expires {dateTime(value(viewing, 'expires_at', 'expiresAt'))}</span></div></div>
        <footer><button type="button" className="notice-cancel-button" onClick={() => setViewing(null)}>Close</button>{canUpdate && <button type="button" className="notices-add-button" onClick={() => openEdit(viewing)}>Edit notice</button>}</footer>
      </article></div>}
    </section>
  );
}
