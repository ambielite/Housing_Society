import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BellRing,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  DoorOpen,
  Gauge,
  Layers3,
  PlugZap,
  Settings2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import useSociety from '../../../app/store/useSociety';
import useAuth from '../../../app/providers/useAuth';
import { legacyApi, getErrorMessage } from '../../../lib/axios';
import Alert from '../../../components/ui/Alert';
import societyApi from '../../societies/api/society.api';
import './settings.css';

const DEFAULT_SETTINGS = {
  billingCycle: 'MONTHLY',
  dueDate: 10,
  penaltyRules: {},
  approvalHierarchy: [],
  visitorCategories: [],
  amenityRules: {},
};

const GROUPS = [
  {
    id: 'society', label: 'Society defaults', summary: 'Regional settings and shared operating defaults.', icon: Building2,
    state: 'Available', configurable: true, scope: 'Society-wide',
    includes: ['Society profile and contact details', 'Timezone and financial year', 'Common numbering conventions'],
  },
  {
    id: 'billing', label: 'Billing & penalties', summary: 'Billing cadence, due dates, and late-payment rules.', icon: CreditCard,
    state: 'Available', configurable: true, scope: 'Society-wide',
    includes: ['Billing cycle and due date', 'Penalty rules', 'Default billing preferences'],
  },
  {
    id: 'approvals', label: 'Approval workflow', summary: 'How requests move through society approvals.', icon: Workflow,
    state: 'Available', configurable: true, scope: 'Society-wide',
    includes: ['Approval hierarchy', 'Approval levels', 'Workflow defaults by record type'],
  },
  {
    id: 'visitors', label: 'Visitors & access', summary: 'Visitor categories and entry preferences.', icon: DoorOpen,
    state: 'Available', configurable: true, scope: 'Society-wide',
    includes: ['Visitor categories', 'Gate access defaults', 'Entry and delivery preferences'],
  },
  {
    id: 'amenities', label: 'Amenities', summary: 'Booking rules and shared facility defaults.', icon: Layers3,
    state: 'Available', configurable: true, scope: 'Society-wide',
    includes: ['Amenity booking rules', 'Booking limits and time windows', 'Cancellation defaults'],
  },
  {
    id: 'notifications', label: 'Notifications', summary: 'Default communication preferences and delivery.', icon: BellRing,
    state: 'Connected', configurable: false, scope: 'Society-wide', links: [
      { label: 'Notification queue', description: 'Review sent, queued, and failed messages.', to: '/notifications/notifications', icon: BellRing },
      { label: 'Templates', description: 'Manage reusable message templates.', to: '/notifications/templates', icon: BellRing },
      { label: 'Preferences', description: 'Manage user channel preferences.', to: '/notifications/preferences', icon: BellRing },
      { label: 'Delivery reports', description: 'Review delivery and read status.', to: '/notifications/reports', icon: BellRing },
    ],
    includes: ['Event notification defaults', 'Delivery channel preferences', 'Message template links'],
  },
  {
    id: 'security', label: 'Access & security', summary: 'Security controls and administrative activity.', icon: ShieldCheck,
    state: 'Connected', configurable: false, scope: 'Platform / role controlled', links: [
      { label: 'Users', description: 'Manage accounts and access status.', to: '/users', icon: ShieldCheck },
      { label: 'Roles & permissions', description: 'Review roles and permission grants.', to: '/roles', icon: ShieldCheck },
      { label: 'Security operations', description: 'Review staff, gates, incidents, and audits.', to: '/security-operations', icon: ShieldCheck },
    ],
    includes: ['Administrative access policy', 'Session and sign-in controls', 'Settings change history'],
  },
  {
    id: 'integrations', label: 'Integrations & data', summary: 'Connected services and data management.', icon: PlugZap,
    state: 'Connected', configurable: false, scope: 'Platform / role controlled', links: [
      { label: 'Finance exports', description: 'Export finance data for external accounting tools.', to: '/finance/exports', icon: PlugZap },
    ],
    includes: ['Connected services', 'Data export and retention', 'Integration health'],
  },
];

function StatusPill({ children, ready = false }) {
  return <span className={`settings-status${ready ? ' is-ready' : ''}`}>{ready && <Check size={12} />} {children}</span>;
}

function asObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; }
    catch { return {}; }
  }
  return {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
}

function draftFromSettings(settings) {
  return {
    billingCycle: settings?.billingCycle || DEFAULT_SETTINGS.billingCycle,
    dueDate: settings?.dueDate ?? DEFAULT_SETTINGS.dueDate,
    penaltyRules: JSON.stringify(asObject(settings?.penaltyRules), null, 2),
    approvalHierarchy: JSON.stringify(asArray(settings?.approvalHierarchy), null, 2),
    visitorCategories: JSON.stringify(asArray(settings?.visitorCategories), null, 2),
    amenityRules: JSON.stringify(asObject(settings?.amenityRules), null, 2),
  };
}

const JSON_FIELDS = {
  penaltyRules: { label: 'Penalty rules', root: 'object', hint: 'Enter a JSON object. Example: {}' },
  approvalHierarchy: { label: 'Approval hierarchy', root: 'array', hint: 'Enter a JSON array. Example: []' },
  visitorCategories: { label: 'Visitor categories', root: 'array', hint: 'Enter a JSON array. Example: []' },
  amenityRules: { label: 'Amenity rules', root: 'object', hint: 'Enter a JSON object. Example: {}' },
};

function SettingsEditor({ category, societyId }) {
  const { hasPermission } = useAuth();
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(() => draftFromSettings(null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [society, setSociety] = useState(null);
  const [regionDraft, setRegionDraft] = useState({ currency: 'INR', timezone: 'Asia/Kolkata' });
  const [regionSaving, setRegionSaving] = useState(false);
  const [regionNotice, setRegionNotice] = useState('');
  const [regionError, setRegionError] = useState('');
  const canCreate = hasPermission('SOCIETY_SETTING_CREATE');
  const canUpdate = hasPermission('SOCIETY_SETTING_UPDATE');
  const isConfigurable = category.configurable;
  const canSave = record?.id ? canUpdate : canCreate;

  useEffect(() => {
    let current = true;
    setSociety(null);
    setRegionError('');
    setRegionNotice('');
    if (!societyId || category.id !== 'society') return () => { current = false; };
    societyApi.getById(societyId).then((result) => {
      if (!current) return;
      const data = result?.data || result?.society || result;
      setSociety(data);
      setRegionDraft({ currency: data.currency || 'INR', timezone: data.timezone || 'Asia/Kolkata' });
    }).catch((requestError) => { if (current) setRegionError(getErrorMessage(requestError)); });
    return () => { current = false; };
  }, [societyId, category.id]);

  useEffect(() => {
    let current = true;
    setRecord(null);
    setDraft(draftFromSettings(null));
    setError('');
    setNotice('');
    if (!societyId || !isConfigurable) return () => { current = false; };

    setLoading(true);
    legacyApi.get(`/society-settings/society/${encodeURIComponent(societyId)}`)
      .then((response) => {
        if (!current) return;
        const settings = response.data?.data || response.data;
        setRecord(settings);
        setDraft(draftFromSettings(settings));
      })
      .catch((requestError) => {
        if (!current) return;
        if (requestError.response?.status === 404) {
          setRecord(null);
          setDraft(draftFromSettings(null));
        } else {
          setError(getErrorMessage(requestError));
        }
      })
      .finally(() => { if (current) setLoading(false); });

    return () => { current = false; };
  }, [societyId, isConfigurable]);

  const jsonValues = useMemo(() => {
    const values = {};
    for (const [key, definition] of Object.entries(JSON_FIELDS)) {
      try {
        const parsed = JSON.parse(draft[key]);
        const isArray = Array.isArray(parsed);
        if (definition.root === 'array' ? !isArray : !parsed || typeof parsed !== 'object' || isArray) {
          return { error: `${definition.label} must be a JSON ${definition.root}.` };
        }
        values[key] = parsed;
      } catch {
        return { error: `${definition.label} must contain valid JSON.` };
      }
    }
    return { values };
  }, [draft]);

  const change = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice('');
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!societyId) return setError('Select a society before saving its settings.');
    if (!canSave) return setError('Your role does not have permission to save these settings.');
    const dueDate = Number(draft.dueDate);
    if (!Number.isInteger(dueDate) || dueDate < 1 || dueDate > 31) return setError('The billing due date must be a day from 1 to 31.');
    if (jsonValues.error) return setError(jsonValues.error);

    const values = { ...jsonValues.values };
    if (category.id === 'billing') {
      values.billingCycle = draft.billingCycle;
      values.dueDate = dueDate;
    }
    const payload = record?.id ? values : { ...DEFAULT_SETTINGS, societyId, ...values };

    setSaving(true);
    try {
      const response = record?.id
        ? await legacyApi.put(`/society-settings/${encodeURIComponent(record.id)}`, payload)
        : await legacyApi.post('/society-settings', payload);
      const settings = response.data?.data || response.data;
      setRecord(settings);
      setDraft(draftFromSettings(settings));
      setNotice('Settings saved for this society.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const saveRegion = async (event) => {
    event.preventDefault();
    if (!societyId || !hasPermission('SOCIETY_UPDATE')) return setRegionError('Your role does not have permission to update society details.');
    setRegionSaving(true); setRegionError(''); setRegionNotice('');
    try {
      const result = await societyApi.update(societyId, regionDraft);
      const data = result?.data || result?.society || result;
      setSociety((current) => ({ ...current, ...data, ...regionDraft }));
      setRegionNotice('Regional defaults saved.');
    } catch (requestError) { setRegionError(getErrorMessage(requestError)); }
    finally { setRegionSaving(false); }
  };

  if (!isConfigurable) {
    if (category.links?.length) return <div className="settings-detail-body">
      <div className="settings-next-step"><div className="settings-next-step-icon"><ExternalLink size={18} /></div><div><strong>Use the existing workspace tools</strong><p>These controls are managed by their dedicated modules. Open a section below to make changes there.</p></div></div>
      <div className="settings-links-grid">{category.links.map((item) => { const Icon = item.icon; return <Link className="settings-link-card" to={item.to} key={item.to}><span className="settings-link-icon"><Icon size={17} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight size={16} /></Link>; })}</div>
      {category.id === 'integrations' && <p className="settings-implementation-note">Integration credentials are configured on the server and are intentionally not exposed in browser settings. This page links to the available user-managed export workflow.</p>}
    </div>;
    return (
      <div className="settings-detail-body">
        <div className="settings-next-step"><div className="settings-next-step-icon"><Settings2 size={18} /></div><div><strong>This area is planned for a later step</strong><p>We’ll add its data model, permissions, and save flow before exposing editable controls here.</p></div></div>
        <h3>Planned for this area</h3>
        <ul className="settings-includes-list">{category.includes.map((item) => <li key={item}><span><Check size={13} /></span>{item}</li>)}</ul>
      </div>
    );
  }

  const editable = Boolean(societyId && canSave && !loading && !saving);
  if (category.id === 'society') return <div className="settings-detail-body">
    {regionError && <Alert>{regionError}</Alert>}{regionNotice && <Alert variant="success">{regionNotice}</Alert>}
    {!societyId && <Alert>Select a society in the top bar to load its regional defaults.</Alert>}
    {!society && societyId ? <div className="settings-loading"><span className="home-loading-spinner" /> Loading society details…</div> : society && <form className="settings-form" onSubmit={saveRegion}>
      <div className="settings-form-section"><h3>{society.name || 'Selected society'}</h3><p>{society.address || 'Society profile details are managed in the Societies module.'}</p></div>
      <div className="settings-fields-grid">
        <label className="settings-field"><span>Currency</span><select value={regionDraft.currency} onChange={(event) => setRegionDraft((current) => ({ ...current, currency: event.target.value }))} disabled={!hasPermission('SOCIETY_UPDATE') || regionSaving}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option><option value="AED">AED · UAE Dirham</option></select></label>
        <label className="settings-field"><span>Timezone</span><select value={regionDraft.timezone} onChange={(event) => setRegionDraft((current) => ({ ...current, timezone: event.target.value }))} disabled={!hasPermission('SOCIETY_UPDATE') || regionSaving}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="Europe/Paris">Europe/Paris</option><option value="America/New_York">America/New_York</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="UTC">UTC</option></select></label>
      </div>
      {!hasPermission('SOCIETY_UPDATE') && <p className="settings-permission-hint">Your role can view these defaults but cannot update the society profile.</p>}
      <div className="settings-form-actions"><button className="btn btn-primary" type="submit" disabled={!societyId || !hasPermission('SOCIETY_UPDATE') || regionSaving}>{regionSaving ? 'Saving…' : 'Save regional defaults'}</button><Link className="settings-secondary-link" to="/societies">Open full society profile <ArrowUpRight size={14} /></Link></div>
    </form>}
  </div>;
  return (
    <div className="settings-detail-body">
      {error && <Alert>{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      {!societyId && <Alert>Select a society in the top bar to load or save society settings.</Alert>}
      {loading ? <div className="settings-loading"><span className="home-loading-spinner" /> Loading saved settings…</div> : (
        <form className="settings-form" onSubmit={save}>
          <div className="settings-record-state"><span className={`settings-record-indicator${record?.id ? ' saved' : ''}`} /><span>{record?.id ? 'Saved settings loaded' : 'Using defaults · settings have not been saved yet'}</span>{record?.updatedAt && <small>Last saved {new Date(record.updatedAt).toLocaleString()}</small>}</div>

          {category.id === 'billing' && <>
            <div className="settings-form-section"><div><h3>Billing schedule</h3><p>Set the default cycle and monthly due day for this society.</p></div></div>
            <div className="settings-fields-grid">
              <label className="settings-field"><span>Billing cycle</span><select value={draft.billingCycle} onChange={(event) => change('billingCycle', event.target.value)} disabled={!editable}><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="HALF_YEARLY">Half yearly</option><option value="YEARLY">Yearly</option></select></label>
              <label className="settings-field"><span>Due day of month</span><input type="number" min="1" max="31" value={draft.dueDate} onChange={(event) => change('dueDate', event.target.value)} disabled={!editable} /><small>Choose a day between 1 and 31.</small></label>
            </div>
            <JsonSettingField field="penaltyRules" value={draft.penaltyRules} onChange={change} disabled={!editable} />
          </>}

          {category.id === 'approvals' && <JsonSettingField field="approvalHierarchy" value={draft.approvalHierarchy} onChange={change} disabled={!editable} />}
          {category.id === 'visitors' && <JsonSettingField field="visitorCategories" value={draft.visitorCategories} onChange={change} disabled={!editable} />}
          {category.id === 'amenities' && <JsonSettingField field="amenityRules" value={draft.amenityRules} onChange={change} disabled={!editable} />}

          {!canSave && societyId && <p className="settings-permission-hint">You have read access to settings but need the society settings create or update permission to save changes.</p>}
          <div className="settings-form-actions"><button className="btn btn-primary" type="submit" disabled={!editable}>{saving ? 'Saving…' : record?.id ? 'Save changes' : 'Save settings'}</button><span>Changes apply to the selected society.</span></div>
        </form>
      )}
    </div>
  );
}

function JsonSettingField({ field, value, onChange, disabled }) {
  const definition = JSON_FIELDS[field];
  return <label className="settings-field settings-json-field" htmlFor={`settings-${field}`}><span>{definition.label}</span><textarea id={`settings-${field}`} rows="8" spellCheck="false" value={value} onChange={(event) => onChange(field, event.target.value)} disabled={disabled} /><small>{definition.hint} Keep the root value as a JSON {definition.root}; the backend currently does not enforce a deeper structure.</small></label>;
}

export default function SettingsPage() {
  const { societyId } = useSociety();
  const [activeId, setActiveId] = useState('overview');
  const selected = GROUPS.find((group) => group.id === activeId);

  return (
    <PageContainer
      className="settings-page"
      eyebrow="SOCIETY ADMINISTRATION"
      title="Settings & configuration"
      subtitle="A clear home for the defaults that shape how your society workspace operates."
    >
      <div className="settings-scope-banner">
        <div className="settings-scope-icon"><Building2 size={19} /></div>
        <div className="settings-scope-copy">
          <strong>{societyId ? 'Settings for the active society' : 'Choose a society to get started'}</strong>
          <span>{societyId ? 'Society-wide preferences will be managed here.' : 'Select a society in the top bar to see its configuration workspace.'}</span>
        </div>
        <span className="settings-scope-tag"><span /> {societyId ? 'Society scope' : 'No society selected'}</span>
      </div>

      <div className="settings-workspace">
        <aside className="settings-nav-panel" aria-label="Settings categories">
          <div className="settings-nav-heading">
            <span className="settings-mini-label">CONFIGURE</span>
            <strong>Workspace</strong>
          </div>
          <button type="button" className={`settings-nav-item${activeId === 'overview' ? ' active' : ''}`} onClick={() => setActiveId('overview')} aria-current={activeId === 'overview' ? 'page' : undefined}>
            <span className="settings-nav-icon"><Gauge size={17} /></span>
            <span className="settings-nav-text"><strong>Overview</strong><small>All configuration areas</small></span>
            <ChevronRight size={15} className="settings-nav-chevron" />
          </button>
          <div className="settings-nav-divider" />
          {GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <button key={group.id} type="button" className={`settings-nav-item${activeId === group.id ? ' active' : ''}`} onClick={() => setActiveId(group.id)} aria-current={activeId === group.id ? 'page' : undefined}>
                <span className="settings-nav-icon"><Icon size={17} /></span>
                <span className="settings-nav-text"><strong>{group.label}</strong><small>{group.scope}</small></span>
                <ChevronRight size={15} className="settings-nav-chevron" />
              </button>
            );
          })}
          <div className="settings-nav-note"><Sparkles size={15} /><span>Built for society-level controls. Personal account preferences stay in your profile menu.</span></div>
        </aside>

        <section className="settings-content-panel" aria-live="polite">
          {selected ? (
            <>
              <div className="settings-detail-heading">
                <div className="settings-detail-icon">{(() => { const Icon = selected.icon; return <Icon size={21} />; })()}</div>
                <div>
                  <span className="settings-mini-label">SETTINGS AREA</span>
                  <h2>{selected.label}</h2>
                  <p>{selected.summary}</p>
                </div>
                  <StatusPill ready={selected.configurable || Boolean(selected.links?.length)}>{selected.state}</StatusPill>
              </div>
              <SettingsEditor category={selected} societyId={societyId} />
            </>
          ) : (
            <>
              <div className="settings-overview-heading">
                <div>
                  <span className="settings-mini-label">CONTROL CENTER</span>
                  <h2>Everything that shapes your society workspace</h2>
                  <p>Choose a category to manage society defaults or jump to the module that owns each workflow.</p>
                </div>
                <div className="settings-overview-mark"><Settings2 size={25} /></div>
              </div>
              <div className="settings-card-grid">
                {GROUPS.map((group) => {
                  const Icon = group.icon;
                  const hasModel = group.configurable || Boolean(group.links?.length);
                  return (
                    <button key={group.id} type="button" className="settings-category-card" onClick={() => setActiveId(group.id)}>
                      <span className="settings-category-icon"><Icon size={19} /></span>
                      <span className="settings-category-copy"><strong>{group.label}</strong><small>{group.summary}</small></span>
                      <span className="settings-category-footer"><StatusPill ready={hasModel}>{group.state}</StatusPill><ArrowUpRight size={15} /></span>
                    </button>
                  );
                })}
              </div>
              <div className="settings-footnote"><span className="settings-footnote-dot" /> Society profile, billing, approvals, visitor categories, and amenity rules are configurable here. Notifications, access controls, and exports open their existing modules.</div>
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
