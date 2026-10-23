import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BellRing, Building2, CalendarDays,
  CheckCircle2, ClipboardCheck, CreditCard, FileText, LifeBuoy, RefreshCw,
  Shield, Users, Wallet, Wrench,
} from 'lucide-react';
import useSociety from '../../../app/store/useSociety';
import residentApi from '../../residents/api/resident.api';
import residentVerificationApi from '../../residents/api/residentVerification.api';
import societyApi from '../../societies/api/society.api';
import billingApi from '../../finance/api/billing.api';
import paymentApi from '../../finance/api/payment.api';
import * as approvalsApi from '../../approvals/api/approvals.api';
import * as helpdeskApi from '../../helpdesk/api/helpdesk.api';
import * as reportsCenterApi from '../../reports-center/api/reportsCenter.api';
import legacyReportsApi from '../../reports/api/reports.api';
import './housing-dashboard.css';

const REFRESH_INTERVAL_MS = 60000;
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const unwrap = (value) => value?.data?.data ?? value?.data ?? value;
const asRows = (value) => {
  const result = unwrap(value);
  if (Array.isArray(result)) return result;
  for (const key of ['rows', 'records', 'items', 'residents', 'requests', 'tickets', 'billings', 'payments', 'data']) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  return [];
};
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const countLabel = (value) => value == null ? '—' : number(value).toLocaleString('en-IN');
const localDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const residentName = (item) => item.displayName || item.residentDisplayName || item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Resident';
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently';

function DonutChart({ segments, total, caption }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  return <div className="home-donut-wrap">
    <svg className="home-donut" viewBox="0 0 180 180" role="img" aria-label={`${caption}: ${total}`}>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#edf1f6" strokeWidth="17" />
      {visibleSegments.map((segment, index) => {
        const length = total ? segment.value / total * circumference : 0;
        const offset = visibleSegments.slice(0, index).reduce((sum, row) => sum + row.value / total * circumference, 0);
        return <circle key={segment.label} cx="90" cy="90" r={radius} fill="none" stroke={segment.color} strokeWidth="17" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />;
      })}
    </svg>
    <div className="home-donut-center"><strong>{total.toLocaleString('en-IN')}</strong><span>{caption}</span></div>
  </div>;
}

const quickLinks = [
  { label: 'Residents', detail: 'People and households', to: '/residents', icon: Users, tone: 'violet' },
  { label: 'Approvals', detail: 'Review pending requests', to: '/approvals', icon: ClipboardCheck, tone: 'amber' },
  { label: 'Helpdesk', detail: 'Resolve resident issues', to: '/helpdesk/tickets', icon: LifeBuoy, tone: 'rose' },
  { label: 'Security', detail: 'Visitors and gate activity', to: '/security', icon: Shield, tone: 'teal' },
  { label: 'Finance', detail: 'Bills and payments', to: '/finance', icon: Wallet, tone: 'blue' },
  { label: 'Assets', detail: 'Property and maintenance', to: '/assets', icon: Wrench, tone: 'green' },
];

export default function HousingDashboardPage() {
  const navigate = useNavigate();
  const { societyId } = useSociety();
  const [view, setView] = useState('society');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loadIssue, setLoadIssue] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('visitors');
  const requestSequence = useRef(0);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    const requestId = ++requestSequence.current;
    if (!societyId) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      setLoadIssue('');
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const today = localDate();
    const results = await Promise.allSettled([
      residentApi.getAll({ societyId, limit: 500 }),
      residentVerificationApi.getPendingQueue(societyId),
      approvalsApi.listRequests({ societyId, status: 'PENDING' }),
      helpdeskApi.listTickets({ societyId }),
      reportsCenterApi.getDashboard({ societyId }),
      legacyReportsApi.occupancy({ societyId }),
      billingApi.getAll({ societyId }),
      paymentApi.getAll(societyId),
      societyApi.getById(societyId),
      reportsCenterApi.getVisitorReport({ societyId, fromDate: today, toDate: today, includeRows: true, limit: 500 }),
      legacyReportsApi.staff({ societyId, fromDate: today, toDate: today }),
    ]);

    if (requestId !== requestSequence.current) return;
    const valueAt = (index) => results[index].status === 'fulfilled' ? unwrap(results[index].value) : null;
    const residents = asRows(valueAt(0));
    const verifications = asRows(valueAt(1));
    const approvals = asRows(valueAt(2));
    const tickets = asRows(valueAt(3));
    const financeBills = asRows(valueAt(6));
    const payments = asRows(valueAt(7));
    const society = valueAt(8);
    const occupancy = valueAt(5) || {};
    const reportDashboard = valueAt(4) || {};
    const visitorReport = valueAt(9) || {};
    const staffReport = valueAt(10) || {};

    const openTickets = tickets.filter((ticket) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(String(ticket.status || '').toUpperCase()));
    const outstanding = financeBills.reduce((total, bill) => {
      if (String(bill.status || '').toUpperCase() === 'CANCELLED') return total;
      const due = bill.outstandingAmount ?? bill.outstanding_amount ?? (number(bill.totalAmount ?? bill.total_amount) - number(bill.paidAmount ?? bill.paid_amount));
      return total + Math.max(number(due), 0);
    }, 0);
    const overdue = financeBills.filter((bill) => {
      const due = bill.outstandingAmount ?? bill.outstanding_amount ?? (number(bill.totalAmount ?? bill.total_amount) - number(bill.paidAmount ?? bill.paid_amount));
      const dueDate = bill.dueDate ?? bill.due_date;
      return number(due) > 0 && dueDate && String(dueDate).slice(0, 10) < today;
    }).length;
    const received = payments.reduce((total, payment) => (
      ['SUCCESS', 'VERIFIED'].includes(String(payment.status || '').toUpperCase()) ? total + number(payment.amount ?? payment.amount_paid) : total
    ), 0);

    const activity = [
      ...residents.slice(0, 5).map((resident) => ({
        title: residentName(resident),
        detail: resident.status ? `Resident record · ${String(resident.status).replaceAll('_', ' ').toLowerCase()}` : 'Resident record updated',
        date: resident.createdAt || resident.created_at,
        icon: Users,
        tone: 'violet',
        to: '/residents',
      })),
      ...verifications.slice(0, 4).map((item) => ({
        title: residentName(item),
        detail: `${String(item.verificationType || 'Resident verification').replaceAll('_', ' ')} · pending review`,
        date: item.createdAt || item.submittedAt || item.submitted_at || item.created_at,
        icon: ClipboardCheck,
        tone: 'amber',
        to: '/residents/verification',
      })),
      ...openTickets.slice(0, 4).map((ticket) => ({
        title: ticket.subject || ticket.title || 'Helpdesk request',
        detail: `Helpdesk · ${String(ticket.status || 'open').replaceAll('_', ' ').toLowerCase()}`,
        date: ticket.createdAt || ticket.openedAt || ticket.opened_at,
        icon: LifeBuoy,
        tone: 'rose',
        to: '/helpdesk/tickets',
      })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 6);

    const visitorStatusBreakdown = asRows(visitorReport.passesByStatus).map((row) => ({
      label: String(row.status || 'Unknown').replaceAll('_', ' '), value: number(row.count),
    }));
    const attendanceRecords = asRows(staffReport.records);
    const staffOnDuty = attendanceRecords.filter((record) => {
      const checkIn = record.checkInTime ?? record.check_in_time;
      const checkOut = record.checkOutTime ?? record.check_out_time;
      const status = String(record.status || '').toUpperCase();
      return (Boolean(checkIn) && !checkOut) || ['PRESENT', 'ON_DUTY'].includes(status);
    }).length;
    const attendanceBreakdown = Object.entries(staffReport.attendance?.statusSummary || {}).map(([label, value]) => ({
      label: label.replaceAll('_', ' '), value: number(value),
    }));
    const unitBreakdown = [
      { label: 'Occupied', value: number(occupancy.occupiedUnits) },
      { label: 'Vacant', value: number(occupancy.vacantUnits) },
      { label: 'Move-in pending', value: number(occupancy.underMoveInUnits) },
      { label: 'Move-out pending', value: number(occupancy.underMoveOutUnits) },
      { label: 'Inactive', value: number(occupancy.inactiveUnits) },
    ].filter((item) => item.value > 0);
    const ticketBreakdown = Object.entries(openTickets.reduce((counts, ticket) => {
      const status = String(ticket.status || 'OPEN').replaceAll('_', ' ');
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {})).map(([label, value]) => ({ label, value }));
    const approvalBreakdown = [
      { label: 'Resident verification', value: verifications.length },
      { label: 'Approval requests', value: approvals.length },
    ];

    const sourceNames = ['residents', 'resident verification', 'approvals', 'helpdesk', 'dashboard', 'occupancy', 'billing', 'payments', 'society details', 'visitor report', 'staff attendance'];
    const failedSources = results.flatMap((result, index) => result.status === 'rejected' ? [sourceNames[index]] : []);
    setLoadIssue(failedSources.length ? `Could not load ${failedSources.join(', ')}. Values for those sections may be incomplete; retry or check access to the related module.` : '');
    const failed = (index) => results[index].status === 'rejected';
    const visitorUnavailable = failed(4) && failed(9);
    setData({
      societyId,
      societyName: society?.name || society?.society?.name || society?.data?.name || 'Your society',
      residents: failed(0) ? null : residents.length,
      occupiedUnits: failed(5) ? null : number(occupancy.occupiedUnits),
      totalUnits: failed(5) ? null : number(occupancy.totalUnits),
      pendingVerifications: failed(1) ? null : verifications.length,
      pendingApprovals: failed(2) ? null : approvals.length,
      openTickets: failed(3) ? null : openTickets.length,
      activeVehicles: failed(4) ? null : number(reportDashboard.vehicles?.activeVehicles),
      visitorsInside: visitorUnavailable ? null : number(visitorReport.currentlyInside ?? reportDashboard.security?.visitorsInside ?? reportDashboard.security?.visitors_inside),
      visitorStatusBreakdown: failed(9) ? [] : visitorStatusBreakdown,
      staffOnDuty: failed(10) ? null : staffOnDuty,
      attendanceBreakdown: failed(10) ? [] : attendanceBreakdown,
      unitBreakdown: failed(5) ? [] : unitBreakdown,
      ticketBreakdown: failed(3) ? [] : ticketBreakdown,
      approvalBreakdown: failed(1) || failed(2) ? [] : approvalBreakdown,
      outstanding: failed(6) ? null : outstanding,
      overdue: failed(6) ? null : overdue,
      received: failed(7) ? null : received,
      billCount: failed(6) ? null : financeBills.length,
      paymentCount: failed(7) ? null : payments.length,
      activity,
      failedSources,
    });
    setUpdatedAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [societyId]);

  useEffect(() => {
    requestSequence.current += 1;
    const initialLoad = window.setTimeout(() => loadDashboard(), 0);
    const timer = window.setInterval(() => loadDashboard(true), REFRESH_INTERVAL_MS);
    return () => {
      requestSequence.current += 1;
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadDashboard]);

  const pendingTotal = useMemo(() => {
    if (!data) return 0;
    const known = [data.pendingVerifications, data.pendingApprovals, data.openTickets].filter((value) => value != null);
    return known.length ? known.reduce((total, value) => total + value, 0) : null;
  }, [data]);
  const dashboardDataReady = data?.societyId === societyId;
  const currentSocietyLoading = Boolean(societyId) && (loading || !dashboardDataReady);

  const societyMetrics = data ? [
    { key: 'visitors', label: 'Currently in', value: data.visitorsInside, note: 'Visitors on the premises now', icon: Shield, tone: 'violet', to: '/security', panelTitle: 'Visitor pass distribution', panelDescription: 'Passes created today, grouped by current status.', segments: data.visitorStatusBreakdown },
    { key: 'staff', label: 'Staff on duty', value: data.staffOnDuty, note: 'Checked in, not checked out', icon: Users, tone: 'green', to: '/security-operations/attendance', panelTitle: "Today's staff attendance", panelDescription: 'Attendance records for the selected society today.', segments: data.attendanceBreakdown },
    { key: 'homes', label: 'Total flats', value: data.totalUnits, note: `${countLabel(data.occupiedUnits)} currently occupied`, icon: Building2, tone: 'blue', to: '/units', panelTitle: 'Home occupancy', panelDescription: 'Current unit status across the society.', segments: data.unitBreakdown },
    { key: 'approvals', label: 'Pending approval', value: data.pendingApprovals == null || data.pendingVerifications == null ? null : data.pendingApprovals + data.pendingVerifications, note: 'Requests awaiting review', icon: ClipboardCheck, tone: 'amber', to: '/approvals', panelTitle: 'Approval queue', panelDescription: 'Items waiting across resident verification and approvals.', segments: data.approvalBreakdown },
    { key: 'complaints', label: 'Open complaints', value: data.openTickets, note: 'Helpdesk tickets still in progress', icon: LifeBuoy, tone: 'rose', to: '/helpdesk/tickets', panelTitle: 'Open helpdesk tickets', panelDescription: 'Open tickets grouped by status.', segments: data.ticketBreakdown },
  ] : [];

  const activeMetric = societyMetrics.find((metric) => metric.key === selectedMetric) || societyMetrics[0];
  const metricSegments = (activeMetric?.segments || []).map((segment, index) => ({
    ...segment,
    color: ['#3879c9', '#29a58b', '#8059cf', '#e59a36', '#dc5872'][index % 5],
  })).filter((segment) => segment.value > 0);
  const graphTotal = metricSegments.reduce((total, segment) => total + segment.value, 0);

  const financialMetrics = data ? [
    { label: 'Outstanding balance', value: data.outstanding == null ? '—' : money.format(data.outstanding), note: 'Open dues across billing records', icon: Wallet, tone: 'violet', to: '/finance/billing' },
    { label: 'Past due bills', value: countLabel(data.overdue), note: 'Bills with balance past the due date', icon: CalendarDays, tone: 'rose', to: '/finance/billing' },
    { label: 'Payments received', value: data.received == null ? '—' : money.format(data.received), note: 'Verified or successful payments', icon: CreditCard, tone: 'teal', to: '/finance/payments' },
    { label: 'Billing records', value: countLabel(data.billCount), note: `${countLabel(data.paymentCount)} payment records`, icon: FileText, tone: 'blue', to: '/finance/billing' },
  ] : [];

  const actions = data ? [
    { label: 'Resident verification', count: data.pendingVerifications, detail: 'New resident requests to review', icon: Users, to: '/residents/verification', tone: 'amber' },
    { label: 'Approval requests', count: data.pendingApprovals, detail: 'Requests waiting for a decision', icon: ClipboardCheck, to: '/approvals', tone: 'blue' },
    { label: 'Open helpdesk tickets', count: data.openTickets, detail: 'Resident issues still in progress', icon: LifeBuoy, to: '/helpdesk/tickets', tone: 'rose' },
  ] : [];

  return (
    <main className="home-overview-page">
      <header className="home-overview-header">
        <div>
          <span className="home-overview-eyebrow"><Building2 size={15} /> SOCIETY WORKSPACE</span>
          <h1>{data?.societyName || 'Home'}</h1>
          <p>Your live overview for residents, daily operations, and finances.</p>
        </div>
        <button type="button" className="home-refresh" onClick={() => loadDashboard(true)} disabled={refreshing || loading}>
          <RefreshCw size={16} className={refreshing ? 'home-spin' : ''} /> {refreshing ? 'Updating' : 'Refresh'}
        </button>
      </header>

      <nav className="home-view-switch" aria-label="Home dashboard views">
        <button type="button" className={view === 'society' ? 'active' : ''} onClick={() => setView('society')}><Building2 size={17} /> Society overview</button>
        <button type="button" className={view === 'finance' ? 'active' : ''} onClick={() => setView('finance')}><Wallet size={17} /> Financial overview</button>
        {updatedAt && <span><CheckCircle2 size={14} /> Updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
      </nav>

      {loadIssue && <div className="home-load-note"><BellRing size={16} />{loadIssue}</div>}
      {!societyId && <div className="home-empty-notice">Choose an active society to view its dashboard.</div>}
      {currentSocietyLoading ? <div className="home-loading"><span className="home-loading-spinner" /> Loading your society overview…</div> : dashboardDataReady && (view === 'society' ? (
        <>
          <section className="home-attention-layout">
            <article className="home-surface home-attention-card">
              <div className="home-section-heading">
                <div><span className="home-section-kicker">TODAY'S WORK</span><h2>Needs your attention</h2><p>{pendingTotal == null ? 'Queue totals are unavailable until their modules respond.' : pendingTotal ? `${pendingTotal} items are waiting across your workspace.` : 'Your queues are clear. Check back here for new requests.'}</p></div>
                <span className={`home-count-badge${pendingTotal ? ' has-items' : ''}`}>{countLabel(pendingTotal)} open</span>
              </div>
              <div className="home-action-list">
                {actions.map((item) => {
                  const Icon = item.icon;
                  return <button type="button" className="home-action-row" key={item.label} onClick={() => navigate(item.to)}>
                    <span className={`home-action-icon ${item.tone}`}><Icon size={17} /></span>
                    <span className="home-action-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                    <b className={item.count ? 'has-count' : ''}>{countLabel(item.count)}</b><ArrowRight size={16} className="home-action-arrow" />
                  </button>;
                })}
              </div>
            </article>

            <article className="home-surface home-activity-card">
              <div className="home-section-heading compact"><div><span className="home-section-kicker">LATEST</span><h2>Recent activity</h2><p>Updates from your society workspace.</p></div><span className="home-activity-pulse" /></div>
              {data.activity.length ? <div className="home-activity-list">
                {data.activity.slice(0, 4).map((item, index) => {
                  const Icon = item.icon;
                  return <button type="button" className="home-activity-item" key={`${item.title}-${index}`} onClick={() => navigate(item.to)}>
                    <span className={`home-activity-icon ${item.tone}`}><Icon size={15} /></span>
                    <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                    <time>{dateLabel(item.date)}</time>
                  </button>;
                })}
              </div> : <div className="home-activity-empty">No recent resident, verification, or ticket activity was returned.</div>}
            </article>
          </section>

          <section className="home-quick-section">
            <div className="home-section-heading quick-heading"><div><span className="home-section-kicker">JUMP BACK IN</span><h2>Quick access</h2><p>Go directly to the tools you use most.</p></div></div>
            <div className="home-quick-grid">{quickLinks.map((item) => {
              const Icon = item.icon;
              return <button type="button" className="home-quick-link" key={item.to} onClick={() => navigate(item.to)}>
                <span className={`home-quick-icon ${item.tone}`}><Icon size={18} /></span><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight size={16} />
              </button>;
            })}</div>
          </section>

          <section className="home-metrics-section">
            <div className="home-section-heading quick-heading"><div><span className="home-section-kicker">LIVE SNAPSHOT</span><h2>Key metrics</h2><p>Choose a metric to explore its live breakdown.</p></div><button type="button" className="home-text-link" onClick={() => navigate('/reports')} >Explore reports <ArrowRight size={15} /></button></div>
            {activeMetric && <div className="home-metrics-layout">
              <div className="home-metric-rail" role="tablist" aria-label="Society key metrics">
                {societyMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return <button type="button" role="tab" aria-selected={selectedMetric === metric.key} className={`home-metric-select ${metric.tone}${selectedMetric === metric.key ? ' selected' : ''}`} key={metric.key} onClick={() => setSelectedMetric(metric.key)}>
                    <span className="home-metric-icon"><Icon size={17} /></span><span className="home-metric-select-copy"><strong>{metric.label}</strong><small>{metric.note}</small></span><b>{countLabel(metric.value)}</b>
                  </button>;
                })}
              </div>
              <article className="home-surface home-chart-panel">
                <div className="home-chart-heading"><div><span className="home-section-kicker">{activeMetric.label.toUpperCase()}</span><h3>{activeMetric.panelTitle}</h3><p>{activeMetric.panelDescription}</p></div><button type="button" className="home-text-link" onClick={() => navigate(activeMetric.to)}>Open section <ArrowRight size={15} /></button></div>
                {metricSegments.length ? <div className="home-chart-content">
                  <div className="home-chart-visual"><DonutChart segments={metricSegments} total={graphTotal} caption={activeMetric.key === 'homes' ? 'homes' : activeMetric.key === 'staff' ? 'records' : activeMetric.key === 'complaints' ? 'tickets' : activeMetric.key === 'approvals' ? 'pending' : 'passes'} /><span className="home-chart-hint">Live distribution</span></div>
                  <div className="home-chart-breakdown"><div className="home-breakdown-label"><span>Breakdown</span><small>{graphTotal.toLocaleString('en-IN')} records</small></div>
                    {metricSegments.map((segment) => {
                      const percent = graphTotal ? Math.round(segment.value / graphTotal * 100) : 0;
                      return <button type="button" className="home-breakdown-row" key={segment.label} onClick={() => navigate(activeMetric.to)}>
                        <span className="home-breakdown-title"><i style={{ background: segment.color }} /><strong>{segment.label}</strong><small>{percent}%</small></span>
                        <span className="home-breakdown-track"><i style={{ width: `${percent}%`, background: segment.color }} /></span>
                        <b>{segment.value.toLocaleString('en-IN')}</b>
                      </button>;
                    })}
                    {!metricSegments.length && <p className="home-no-breakdown">No matching records were returned for this metric.</p>}
                  </div>
                </div> : <div className="home-chart-empty"><span className="home-chart-empty-icon"><CalendarDays size={20} /></span><strong>No breakdown data yet</strong><p>This chart will populate when this society has matching records.</p><button type="button" className="home-text-link" onClick={() => navigate(activeMetric.to)}>Open {activeMetric.label.toLowerCase()} <ArrowRight size={14} /></button></div>}
              </article>
            </div>}
          </section>
        </>
      ) : (
        <>
          <section className="home-finance-banner">
            <span className="home-finance-banner-icon"><Wallet size={21} /></span>
            <div><span className="home-section-kicker">FINANCIAL SNAPSHOT</span><h2>{data.outstanding == null ? '—' : money.format(data.outstanding)} <small>outstanding</small></h2><p>Live totals from billing and payment records for {data.societyName}.</p></div>
            <button type="button" className="home-finance-open" onClick={() => navigate('/finance')} >Open Finance <ArrowRight size={16} /></button>
          </section>
          <section className="home-metrics-section home-finance-metrics">
            <div className="home-section-heading quick-heading"><div><span className="home-section-kicker">COLLECTIONS & DUES</span><h2>Key financial metrics</h2><p>Open a card to continue in the relevant finance register.</p></div></div>
            <div className="home-metric-grid">{financialMetrics.map((metric) => {
              const Icon = metric.icon;
              return <button type="button" className={`home-metric-card ${metric.tone}`} key={metric.label} onClick={() => navigate(metric.to)}>
                <span className="home-metric-top"><span className="home-metric-icon"><Icon size={18} /></span><ArrowUpRight size={16} /></span>
                <strong>{metric.value}</strong><span className="home-metric-label">{metric.label}</span><small>{metric.note}</small>
              </button>;
            })}</div>
          </section>
          <section className="home-surface home-finance-cta">
            <div><span className="home-section-kicker">FINANCE SHORTCUTS</span><h2>Continue where you need to</h2><p>View billing records, review payment activity, or open your finance reports.</p></div>
            <div><button type="button" onClick={() => navigate('/finance/billing')}><FileText size={16} /> Billing register</button><button type="button" onClick={() => navigate('/finance/payments')}><CreditCard size={16} /> Payment register</button><button type="button" onClick={() => navigate('/finance/reports')}><ArrowDownRight size={16} /> Finance reports</button></div>
          </section>
        </>
      ))}
    </main>
  );
}
