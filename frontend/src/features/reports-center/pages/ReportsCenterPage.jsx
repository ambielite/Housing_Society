import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, CalendarDays, CarFront, CheckCircle2, ChevronRight,
  Download, FileSpreadsheet, FileText, Gauge, RefreshCw, Shield, Truck, Wallet,
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import { getErrorMessage } from '../../../lib/axios';
import * as reportsApi from '../api/reportsCenter.api';
import { REPORT_GROUPS, REPORT_BY_KEY } from '../components/reportOptions';

const REQUESTS = {
  dashboard: reportsApi.getDashboard,
  vehicles: reportsApi.getVehicleReport,
  parking: reportsApi.getParkingReport,
  visitors: reportsApi.getVisitorReport,
  'gate-activity': reportsApi.getGateActivityReport,
  overstay: reportsApi.getOverstayReport,
  deliveries: reportsApi.getDeliveryReport,
  tickets: reportsApi.getTicketReport,
  sla: reportsApi.getSlaReport,
  'category-trends': reportsApi.getCategoryTrends,
  'vendor-outstanding': reportsApi.getVendorOutstanding,
  'vendor-contracts': reportsApi.getVendorContracts,
  'vendor-spend': reportsApi.getVendorSpend,
  'vendor-sla-performance': reportsApi.getVendorSlaPerformance,
  'procurement-summary': reportsApi.getProcurementSummary,
  'quotation-comparison': reportsApi.getQuotationComparison,
  'purchase-orders': reportsApi.getPurchaseOrderReport,
  'vendor-bills': reportsApi.getVendorBillReport,
  'amenity-utilization': reportsApi.getAmenityUtilization,
  'amenity-bookings': reportsApi.getAmenityBookings,
  'utility-summary': reportsApi.getUtilitySummary,
};

const LABELS = {
  generatedAt: 'Generated at', totalVehicles: 'Total vehicles', activeVehicles: 'Active vehicles',
  twoWheelers: 'Two-wheelers', fourWheelers: 'Four-wheelers', otherVehicles: 'Other vehicles',
  totalParkingSlots: 'Total parking slots', activeSlots: 'Active slots', inactiveSlots: 'Inactive slots',
  occupiedSlots: 'Occupied slots', vacantSlots: 'Vacant slots', occupancyPercentage: 'Occupancy',
  totalPasses: 'Visitor passes', currentlyInside: 'Visitors inside', totalEntries: 'Gate entries', totalExits: 'Gate exits',
  total: 'Total', open: 'Open', acknowledged: 'Acknowledged', resolved: 'Resolved', avg_duration_minutes: 'Average overstay (min)',
  max_duration_minutes: 'Longest overstay (min)', totalDeliveries: 'Total deliveries', avgHandoverMinutes: 'Avg. handover (min)',
  parcelsStillStored: 'Parcels still stored', totalTickets: 'Total tickets', openTickets: 'Open tickets', closedTickets: 'Closed tickets',
  avgResponseHours: 'Avg. response (hours)', avgResolutionHours: 'Avg. resolution (hours)', avgRating: 'Average rating',
  totalTimers: 'SLA timers', met: 'SLA met', breached: 'Breached', running: 'Running', paused: 'Paused',
  runningButOverdue: 'Running but overdue', compliancePercentage: 'SLA compliance', totalBilled: 'Total billed',
  totalPaid: 'Total paid', totalOutstanding: 'Outstanding', totalOverdue: 'Overdue', totalContracts: 'Total contracts',
  totalValue: 'Contract value', expiringSoon: 'Expiring soon', totalPoValue: 'PO value', totalInvoiced: 'Invoiced',
  totalBookings: 'Bookings', cancellationRate: 'Cancellation rate', totalMeters: 'Total meters', totalConsumption: 'Consumption',
  totalAmount: 'Total amount',
};

const humanize = (value) => String(value ?? '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatValue = (value, key = '') => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return Array.isArray(value) ? `${value.length} records` : '[Details]';
  if (typeof value === 'number' && /(amount|value|paid|billed|outstanding|overdue|revenue|fee|spend|cost|totalpo|invoiced)/i.test(key)) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'number') return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString('en-IN');
  return String(value);
};
const displayLabel = (key) => LABELS[key] || humanize(key);
const isScalar = (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value);
const asRows = (value) => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];

function ReportTable({ title, rows }) {
  const columns = useMemo(() => [...new Set(rows.slice(0, 40).flatMap((row) => Object.keys(row)))], [rows]);
  if (!rows.length) return null;
  return (
    <section className="rc-data-section">
      <div className="rc-section-title"><h3>{title}</h3><span>{rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'row' : 'rows'}</span></div>
      <div className="rc-table-wrap">
        <table className="table rc-table">
          <thead><tr>{columns.map((column) => <th key={column}>{displayLabel(column)}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={row.id || row.ticket_no || row.booking_no || row.vendor_id || `${title}-${index}`}>
              {columns.map((column) => <td key={column}>{formatValue(row[column], column)}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCards({ data, prefix = '' }) {
  const entries = Object.entries(data || {}).filter(([key, value]) => isScalar(value) && key !== 'period' && key !== 'responseTimeDefinition');
  if (!entries.length) return null;
  return <div className="rc-metric-grid">{entries.map(([key, value], index) => (
    <article className="rc-metric-card" key={`${prefix}${key}`}>
      <span className="rc-metric-index">{String(index + 1).padStart(2, '0')}</span>
      <p>{displayLabel(key)}</p>
      <strong>{formatValue(value, key)}</strong>
    </article>
  ))}</div>;
}

function MiniBars({ title, rows }) {
  if (!rows.length) return null;
  const getLabel = (row) => row.category ?? row.day ?? row.month ?? row.name ?? row.status ?? row.vehicle_type ?? row.delivery_type ?? row.weekday ?? row.gate ?? row.utility ?? row.amenity ?? row.priority ?? row.type ?? 'Item';
  const getNumber = (row) => {
    for (const key of ['count', 'total', 'entries', 'bookings', 'amount', 'revenue', 'utilization_pct', 'twoWheelers']) {
      if (Number.isFinite(Number(row[key]))) return Number(row[key]);
    }
    return 0;
  };
  const values = rows.map(getNumber);
  const max = Math.max(...values, 1);
  return (
    <section className="rc-chart-card">
      <div className="rc-section-title"><h3>{title}</h3><span>{rows.length} groups</span></div>
      <div className="rc-bars">{rows.slice(0, 10).map((row, index) => {
        const value = getNumber(row);
        return <div className="rc-bar-row" key={`${getLabel(row)}-${index}`}>
          <span title={String(getLabel(row))}>{humanize(getLabel(row))}</span>
          <div className="rc-bar-track"><div className="rc-bar-fill" style={{ width: `${Math.max(value > 0 ? 3 : 0, value / max * 100)}%` }} /></div>
          <b>{formatValue(value, 'count')}</b>
        </div>;
      })}</div>
    </section>
  );
}

function ReportResults({ data, report }) {
  if (!data || typeof data !== 'object') return <div className="rc-empty">No report data was returned.</div>;
  if (report.key === 'dashboard') {
    const groups = [
      { key: 'vehicles', title: 'Vehicles', icon: CarFront },
      { key: 'parking', title: 'Parking', icon: Gauge },
      { key: 'security', title: 'Security & gate', icon: Shield },
      { key: 'workflow', title: 'Helpdesk & workflow', icon: Activity },
      { key: 'vendors', title: 'Vendors', icon: Truck },
      { key: 'amenities', title: 'Amenities', icon: CalendarDays },
      { key: 'utilities', title: 'Utilities', icon: BarChart3 },
    ];
    return <>
      <div className="rc-dashboard-note"><Activity size={17} /><span>Snapshot generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString('en-IN') : 'by the reports service'}. Metrics are from your Phase 17 modules.</span></div>
      <div className="rc-dashboard-grid">{groups.filter((group) => data[group.key]).map((group) => {
        const Icon = group.icon;
        return <article className="rc-dashboard-card" key={group.key}>
          <div className="rc-dashboard-card-head"><span className="rc-icon-tile"><Icon size={19} /></span><h3>{group.title}</h3></div>
          <div className="rc-dashboard-values">{Object.entries(data[group.key]).map(([key, value]) => <div key={key}><span>{displayLabel(key)}</span><strong>{formatValue(value, key)}</strong></div>)}</div>
        </article>;
      })}</div>
    </>;
  }

  const scalarData = {};
  const nestedSections = [];
  const arrays = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'period') return;
    if (isScalar(value)) scalarData[key] = value;
    else if (Array.isArray(value)) {
      const rows = asRows(value);
      if (rows.length) arrays.push({ key, title: displayLabel(key), rows });
      else if (key === 'rows') arrays.push({ key, title: 'Detail rows', rows: [] });
    } else if (value && typeof value === 'object') {
      const scalar = Object.fromEntries(Object.entries(value).filter(([, item]) => isScalar(item)));
      const list = Object.entries(value).filter(([, item]) => Array.isArray(item) && asRows(item).length);
      if (Object.keys(scalar).length || list.length) nestedSections.push({ key, title: displayLabel(key), scalar, arrays: list.map(([name, items]) => ({ key: name, title: displayLabel(name), rows: asRows(items) })) });
    }
  });
  delete scalarData.period;
  const chartArrays = arrays.filter(({ key, rows }) => rows.length > 1 && /(status|day|trend|category|gate|area|type|weekday|utilization|priority|credential)/i.test(key));
  const chartKeys = new Set(chartArrays.map((item) => item.key));
  return <>
    {data.responseTimeDefinition && <p className="rc-explainer">{data.responseTimeDefinition}</p>}
    <MetricCards data={scalarData} />
    {nestedSections.map((section) => <section className="rc-nested-section" key={section.key}>
      {Object.keys(section.scalar).length > 0 && <><div className="rc-section-title"><h3>{section.title}</h3></div><MetricCards data={section.scalar} prefix={`${section.key}-`} /></>}
      {section.arrays.map((item) => <ReportTable key={`${section.key}-${item.key}`} title={item.title} rows={item.rows} />)}
    </section>)}
    {chartArrays.map((item) => <MiniBars key={`chart-${item.key}`} title={`${item.title} overview`} rows={item.rows} />)}
    {arrays.filter((item) => !chartKeys.has(item.key)).map((item) => <ReportTable key={item.key} title={item.title} rows={item.rows} />)}
    {!Object.keys(scalarData).length && !nestedSections.length && !arrays.some((item) => item.rows.length) && <div className="rc-empty">No records match the selected filters.</div>}
  </>;
}

export default function ReportsCenterPage() {
  const { hasPermission, hasAnyPermission, hasRole } = useAuth();
  const { societyId } = useSociety();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const visibleGroups = useMemo(() => REPORT_GROUPS.map((group) => ({
    ...group,
    reports: group.reports.filter((report) => hasPermission(report.permission)),
  })).filter((group) => group.reports.length > 0), [hasPermission]);

  const [activeGroup, setActiveGroup] = useState('dashboard');
  const [reportKey, setReportKey] = useState('dashboard');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeRows, setIncludeRows] = useState(false);
  const [limit, setLimit] = useState('500');
  const [rfqId, setRfqId] = useState('');
  const [expiringInDays, setExpiringInDays] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const currentGroup = visibleGroups.find((group) => group.key === activeGroup) || visibleGroups[0];
  const currentReport = REPORT_BY_KEY[reportKey] || currentGroup?.reports[0];
  const canExport = Boolean(currentReport?.exportKey && hasPermission('REPORT_EXPORT'));
  const needsSociety = isSuperAdmin && !societyId;

  useEffect(() => {
    if (!visibleGroups.length) return;
    const group = visibleGroups.find((item) => item.key === activeGroup) || visibleGroups[0];
    if (group.key !== activeGroup) setActiveGroup(group.key);
    if (!group.reports.some((report) => report.key === reportKey)) setReportKey(group.reports[0].key);
  }, [visibleGroups, activeGroup, reportKey]);

  const makeParams = useCallback((report) => {
    const params = {};
    if (isSuperAdmin && societyId) params.societyId = societyId;
    if (report?.dates) {
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
    }
    // The contracts and quotation-comparison schemas intentionally accept a narrower query.
    if (report?.key !== 'dashboard' && !report?.rfqId && !report?.expiringDays) {
      params.includeRows = includeRows;
      params.limit = Number(limit) || 500;
    }
    if (report?.rfqId) params.rfqId = rfqId.trim();
    if (report?.expiringDays) params.expiringInDays = Number(expiringInDays) || 30;
    return params;
  }, [isSuperAdmin, societyId, fromDate, toDate, includeRows, limit, rfqId, expiringInDays]);

  const runReport = useCallback(async (key = reportKey) => {
    const report = REPORT_BY_KEY[key];
    if (!report) return;
    if (needsSociety) { setError('Select a society before loading reports.'); return; }
    if (fromDate && toDate && fromDate > toDate) { setError('The end date cannot be earlier than the start date.'); return; }
    if (report.rfqId && !rfqId.trim()) { setError('Enter an RFQ ID to compare its quotations.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const result = await REQUESTS[key](makeParams(report));
      setData(result || {});
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [reportKey, needsSociety, fromDate, toDate, rfqId, makeParams]);

  useEffect(() => {
    if (needsSociety || !currentReport || !hasAnyPermission(currentReport.permission)) return;
    runReport(currentReport.key);
  // Run automatically when the report changes; filter changes are applied using the Run report button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey, needsSociety]);

  const chooseGroup = (group) => {
    setActiveGroup(group.key);
    setReportKey(group.reports[0].key);
    setData(null); setError(''); setNotice('');
  };

  const chooseReport = (key) => { setReportKey(key); setData(null); setError(''); setNotice(''); };

  const exportReport = async (format) => {
    if (!currentReport?.exportKey || !canExport) return;
    if (needsSociety) { setError('Select a society before exporting reports.'); return; }
    if (fromDate && toDate && fromDate > toDate) { setError('The end date cannot be earlier than the start date.'); return; }
    if (currentReport.rfqId && !rfqId.trim()) { setError('Enter an RFQ ID to compare its quotations.'); return; }
    setExporting(format); setError(''); setNotice('');
    try {
      const params = { ...makeParams(currentReport), includeRows: true, format };
      const response = await reportsApi.downloadReport(currentReport.exportKey, params, format);
      const mimeExtension = format === 'xlsx' ? 'xlsx' : format;
      const disposition = response.headers?.['content-disposition'] || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `reports-${currentReport.exportKey}.${mimeExtension}`;
      const blobUrl = window.URL.createObjectURL(response.data);
      const anchor = document.createElement('a'); anchor.href = blobUrl; anchor.download = filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.URL.revokeObjectURL(blobUrl);
      setNotice(`${format.toUpperCase()} report downloaded.`);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Your account does not have permission to export reports.' : getErrorMessage(err));
    } finally { setExporting(''); }
  };

  if (!visibleGroups.length) return <PageContainer title="Reports Center" subtitle="Reports available to your account"><div className="rc-empty">Your account does not have access to any reports in this module.</div></PageContainer>;
  if (needsSociety) return <PageContainer title="Reports Center" subtitle="Choose a society to view its reporting data"><SocietyIdPrompt /></PageContainer>;

  const selectedGroup = visibleGroups.find((group) => group.key === activeGroup) || currentGroup;
  const showFilters = Boolean(currentReport?.dates || currentReport?.rfqId || currentReport?.expiringDays);

  return (
    <PageContainer
      title="Reports Center"
      subtitle="Explore operational performance and export the reports your role is allowed to access."
      actions={<button type="button" className="btn btn-secondary" onClick={() => runReport()} disabled={loading}><RefreshCw size={15} className={loading ? 'rc-spin' : ''} /> Refresh</button>}
    >
      <div className="rc-overview-strip">
        <div><span className="rc-overview-icon"><BarChart3 size={19} /></span><div><strong>Reports & analytics</strong><p>Live data from Phase 17 report endpoints</p></div></div>
        <span className="rc-overview-caption"><Shield size={14} /> Permission-aware access</span>
      </div>

      <div className="rc-group-tabs" role="tablist" aria-label="Report categories">
        {visibleGroups.map((group) => <button type="button" key={group.key} role="tab" aria-selected={activeGroup === group.key} className={`rc-group-tab${activeGroup === group.key ? ' active' : ''}`} onClick={() => chooseGroup(group)}>{group.label}<ChevronRight size={14} /></button>)}
      </div>

      <section className="rc-workspace">
        <div className="rc-report-heading">
          <div><p className="rc-eyebrow">{selectedGroup?.label || 'Reports'}</p><h2>{currentReport?.title || 'Select a report'}</h2><p>{currentReport?.description || 'Choose a report and apply filters.'}</p></div>
          <div className="rc-report-count"><FileText size={16} /> {selectedGroup?.reports.length || 0} reports in section</div>
        </div>

        <div className="rc-controls">
          <div className="rc-control rc-report-select"><label htmlFor="rc-report">Report</label><select id="rc-report" className="input" value={reportKey} onChange={(event) => chooseReport(event.target.value)}>{selectedGroup?.reports.map((report) => <option key={report.key} value={report.key}>{report.label}</option>)}</select></div>
          {showFilters && currentReport?.dates && <>
            <div className="rc-control"><label htmlFor="rc-from">From date</label><input id="rc-from" className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></div>
            <div className="rc-control"><label htmlFor="rc-to">To date</label><input id="rc-to" className="input" type="date" min={fromDate || undefined} value={toDate} onChange={(event) => setToDate(event.target.value)} /></div>
          </>}
          {currentReport?.expiringDays && <div className="rc-control"><label htmlFor="rc-expiry">Expiring within</label><select id="rc-expiry" className="input" value={expiringInDays} onChange={(event) => setExpiringInDays(event.target.value)}>{[7, 15, 30, 60, 90, 180, 365].map((days) => <option key={days} value={days}>{days} days</option>)}</select></div>}
          {currentReport?.rfqId && <div className="rc-control rc-rfq-control"><label htmlFor="rc-rfq">RFQ ID</label><input id="rc-rfq" className="input" value={rfqId} onChange={(event) => setRfqId(event.target.value)} placeholder="Paste the existing RFQ UUID" /></div>}
          {!currentReport?.rfqId && !currentReport?.expiringDays && currentReport?.key !== 'dashboard' && <div className="rc-control rc-limit-control"><label htmlFor="rc-limit">Detail row limit</label><select id="rc-limit" className="input" value={limit} onChange={(event) => setLimit(event.target.value)}>{[100, 250, 500, 1000, 2500, 5000].map((count) => <option key={count} value={count}>{count.toLocaleString('en-IN')} rows</option>)}</select></div>}
          {currentReport?.key !== 'dashboard' && !currentReport?.rfqId && !currentReport?.expiringDays && <label className="rc-include-rows"><input type="checkbox" checked={includeRows} onChange={(event) => setIncludeRows(event.target.checked)} /> Include detail rows</label>}
          <button type="button" className="btn btn-primary rc-run-button" onClick={() => runReport()} disabled={loading || exporting !== ''}><Activity size={15} /> {loading ? 'Loading…' : 'Run report'}</button>
        </div>

        {canExport && <div className="rc-export-row"><span><Download size={15} /> Export report details</span><div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => exportReport('csv')} disabled={Boolean(exporting)}><FileText size={14} /> {exporting === 'csv' ? 'Preparing…' : 'CSV'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => exportReport('pdf')} disabled={Boolean(exporting)}><FileText size={14} /> {exporting === 'pdf' ? 'Preparing…' : 'PDF'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => exportReport('xlsx')} disabled={Boolean(exporting)}><FileSpreadsheet size={14} /> {exporting === 'xlsx' ? 'Preparing…' : 'Excel'}</button>
        </div></div>}

        {error && <div className="rc-message rc-message-error"><AlertTriangle size={17} /><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {notice && <div className="rc-message rc-message-success"><CheckCircle2 size={17} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

        <div className="rc-results-head"><div><h3>Report results</h3><p>{fromDate || toDate ? `Date range: ${fromDate || 'start'} – ${toDate || 'today'}` : 'Showing the data returned by the selected report endpoint.'}</p></div>{loading && <span className="rc-loading-label"><span className="rc-loading-dot" /> Loading report</span>}</div>
        {loading && !data ? <div className="rc-loading-state"><span className="rc-spinner" /> Loading report data…</div> : data ? <ReportResults data={data} report={currentReport} /> : <div className="rc-empty"><Wallet size={24} /><strong>No report loaded yet</strong><span>Run this report to load the latest data from the backend.</span></div>}
        {currentReport?.key === 'parking' && <p className="rc-footnote">The selected dates filter parking visits only; slot and allocation totals reflect the current state.</p>}
        {currentReport?.key === 'procurement-summary' && <p className="rc-footnote">This report provides summary counts and amounts; flat-row exports are not supported by the API.</p>}
      </section>
    </PageContainer>
  );
}
