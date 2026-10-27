import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BellRing,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  DoorOpen,
  FileText,
  Gauge,
  Layers3,
  PlugZap,
  Settings2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Users,
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
      { label: 'Templates', description: 'Manage reusable message templates.', to: '/notifications/templates', icon: FileText },
      { label: 'Preferences', description: 'Manage user channel preferences.', to: '/notifications/preferences', icon: BellRing },
      { label: 'Delivery reports', description: 'Review delivery and read status.', to: '/notifications/reports', icon: BellRing },
    ],
    includes: ['Event notification defaults', 'Delivery channel preferences', 'Message template links'],
  },
  {
    id: 'security', label: 'Access & security', summary: 'Security controls and administrative activity.', icon: ShieldCheck,
    state: 'Connected', configurable: false, scope: 'Platform / role controlled', links: [
      { label: 'Users', description: 'Manage accounts and access status.', to: '/users', icon: Users },
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

function ruleText(value) {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return ruleText(parsed);
    } catch { /* Keep normal prose as entered. */ }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return String(item ?? '');
    const preferred = item.ruleText || item.rule || item.description || item.name || item.label || item.role;
    if (preferred) return String(preferred);
    return Object.entries(item).map(([key, entry]) => `${key}: ${entry && typeof entry === 'object' ? Object.values(entry).join(', ') : entry}`).join(' · ');
  }).filter(Boolean).join('\n');
  const object = asObject(value);
  if (typeof object.ruleText === 'string') return object.ruleText;
  if (typeof object.rules === 'string') return object.rules;
  if (Array.isArray(object.rules)) return ruleText(object.rules);
  return Object.entries(object).map(([key, entry]) => `${key}: ${entry && typeof entry === 'object' ? Object.values(entry).join(', ') : entry}`).join('\n');
}

function draftFromSettings(settings) {
  return {
    billingCycle: settings?.billingCycle || DEFAULT_SETTINGS.billingCycle,
    dueDate: settings?.dueDate ?? DEFAULT_SETTINGS.dueDate,
    penaltyRules: ruleText(settings?.penaltyRules),
    approvalHierarchy: ruleText(settings?.approvalHierarchy),
    visitorCategories: ruleText(settings?.visitorCategories),
    amenityRules: ruleText(settings?.amenityRules),
  };
}

const RULE_FIELDS = {
  penaltyRules: { label: 'Penalty rules', hint: 'Describe fees, grace periods, and exceptions in your own words.' },
  approvalHierarchy: { label: 'Approval rules', hint: 'Explain who approves requests and any conditions that apply.' },
  visitorCategories: { label: 'Visitor guidance', hint: 'Describe how visitors and service providers should be handled.' },
  amenityRules: { label: 'Amenity booking rules', hint: 'Describe booking limits, time windows, and cancellation rules in your own words.' },
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
    // Keep the admin's complete entry as free-form prose. These fields are
    // stored in structured API columns, but the editor never asks admins to
    // write JSON or follow a line-by-line format.
    const rule = (value) => value.trim() ? [{ ruleText: value.trim() }] : [];
    const values = {
      penaltyRules: draft.penaltyRules.trim() ? { ruleText: draft.penaltyRules.trim() } : {},
      approvalHierarchy: rule(draft.approvalHierarchy),
      visitorCategories: rule(draft.visitorCategories),
      amenityRules: draft.amenityRules.trim() ? { ruleText: draft.amenityRules.trim() } : {},
    };
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
      <div className="settings-connected-hero"><div className="settings-connected-orbit"><ExternalLink size={22} /></div><div><span className="settings-mini-label">CONNECTED WORKSPACE</span><h3>{category.id === 'notifications' ? 'Communication control room' : category.id === 'security' ? 'Identity and access center' : 'External data workflows'}</h3><p>{category.id === 'notifications' ? 'Manage delivery, preferences, templates, and reports in the notification workspace.' : category.id === 'security' ? 'Manage people, permissions, and operational security through their dedicated tools.' : 'Use the export tools to move finance data into external accounting workflows.'}</p></div><span className="settings-connected-count">{category.links.length}<small> tools</small></span></div>
      <div className="settings-subsection-heading"><div><span className="settings-mini-label">AVAILABLE TOOLS</span><h3>Choose where to continue</h3></div><span>Opens the existing module</span></div>
      <div className="settings-links-grid">{category.links.map((item, index) => { const Icon = item.icon; return <Link className="settings-link-card" to={item.to} key={item.to}><span className="settings-link-index">{String(index + 1).padStart(2, '0')}</span><span className="settings-link-icon"><Icon size={18} /></span><span className="settings-link-copy"><strong>{item.label}</strong><small>{item.description}</small></span><span className="settings-link-open"><ArrowUpRight size={16} /></span></Link>; })}</div>
      {category.id === 'integrations' && <div className="settings-managed-note"><ShieldCheck size={17} /><span><strong>Credentials are protected.</strong> Integration secrets are configured on the server and are not exposed in browser settings.</span></div>}
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
      <div className="settings-society-card"><div className="settings-society-card-icon"><Building2 size={21} /></div><div><span className="settings-mini-label">ACTIVE COMMUNITY</span><h3>{society.name || 'Selected society'}</h3><p>{society.address || 'Set the region and financial display conventions used across this society.'}</p></div><span className="settings-society-id">{society.reraNumber || 'SOCIETY PROFILE'}</span></div>
      <div className="settings-form-card"><div className="settings-subsection-heading"><div><span className="settings-mini-label">REGIONAL DEFAULTS</span><h3>Locale & display</h3></div><span>Applied across society workflows</span></div><div className="settings-fields-grid">
        <label className="settings-field"><span>Currency</span><select value={regionDraft.currency} onChange={(event) => setRegionDraft((current) => ({ ...current, currency: event.target.value }))} disabled={!hasPermission('SOCIETY_UPDATE') || regionSaving}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · Pound Sterling</option><option value="AED">AED · UAE Dirham</option></select><small>Used when showing financial amounts.</small></label>
        <label className="settings-field"><span>Timezone</span><select value={regionDraft.timezone} onChange={(event) => setRegionDraft((current) => ({ ...current, timezone: event.target.value }))} disabled={!hasPermission('SOCIETY_UPDATE') || regionSaving}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="Europe/Paris">Europe/Paris</option><option value="America/New_York">America/New_York</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="UTC">UTC</option></select><small>Used for dates, reminders, and activity times.</small></label>
      </div></div>
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
            <TextRuleField field="penaltyRules" value={draft.penaltyRules} onChange={change} disabled={!editable} />
          </>}

          {category.id === 'approvals' && <TextRuleField field="approvalHierarchy" value={draft.approvalHierarchy} onChange={change} disabled={!editable} />}
          {category.id === 'visitors' && <TextRuleField field="visitorCategories" value={draft.visitorCategories} onChange={change} disabled={!editable} />}
          {category.id === 'amenities' && <TextRuleField field="amenityRules" value={draft.amenityRules} onChange={change} disabled={!editable} />}

          {!canSave && societyId && <p className="settings-permission-hint">You have read access to settings but need the society settings create or update permission to save changes.</p>}
          <div className="settings-form-actions"><button className="btn btn-primary" type="submit" disabled={!editable}>{saving ? 'Saving…' : record?.id ? 'Save changes' : 'Save settings'}</button><span>Changes apply to the selected society.</span></div>
        </form>
      )}
    </div>
  );
}

function TextRuleField({ field, value, onChange, disabled }) {
  const definition = RULE_FIELDS[field];
  return <div className="settings-form-card settings-json-card"><div className="settings-subsection-heading"><div><span className="settings-mini-label">WRITE IN YOUR OWN WORDS</span><h3>{definition.label}</h3></div><span>Free-form text</span></div><label className="settings-field settings-json-field" htmlFor={`settings-${field}`}><textarea id={`settings-${field}`} rows="7" value={value} onChange={(event) => onChange(field, event.target.value)} disabled={disabled} placeholder={`Describe ${definition.label.toLowerCase()} in your own words…`} /><small>{definition.hint} No special format is needed; write naturally and use as much detail as you need.</small></label></div>;
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
                <button type="button" className="settings-back-button" onClick={() => setActiveId('overview')} aria-label="Back to settings overview">
                  <ArrowLeft size={16} /><span>Settings overview</span>
                </button>
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
              <div className="settings-overview-stats">
                <div className="settings-overview-stat"><span className="settings-stat-icon purple"><Settings2 size={17} /></span><div><strong>{GROUPS.filter((group) => group.configurable).length}</strong><small>Configurable here</small></div></div>
                <div className="settings-overview-stat"><span className="settings-stat-icon green"><Check size={17} /></span><div><strong>{GROUPS.filter((group) => group.links?.length).length}</strong><small>Connected workspaces</small></div></div>
                <div className="settings-overview-stat"><span className="settings-stat-icon blue"><Building2 size={17} /></span><div><strong>{societyId ? 'Active' : 'Select'}</strong><small>{societyId ? 'Society scope' : 'Society first'}</small></div></div>
              </div>
              <div className="settings-categories-heading"><div><span className="settings-mini-label">SETTINGS DIRECTORY</span><h3>Configuration areas</h3></div><span>Choose a section to view its controls</span></div>
              <div className="settings-card-grid">
                {GROUPS.map((group) => {
                  const Icon = group.icon;
                  const hasModel = group.configurable || Boolean(group.links?.length);
                  return (
                    <button key={group.id} type="button" className={`settings-category-card settings-category-${group.id}`} onClick={() => setActiveId(group.id)}>
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
