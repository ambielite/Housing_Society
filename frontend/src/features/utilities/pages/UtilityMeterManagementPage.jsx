import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Droplets, Gauge, Plus, Search, Zap } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import SelectField from '../../../components/ui/SelectField';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import { getErrorMessage } from '../../../lib/axios';
import unitApi from '../../units/api/unit.api';
import floorApi from '../../floors/api/floor.api';
import towerApi from '../../towers/api/tower.api';
import * as utilityApi from '../api/utilityMeter.api';
import {
  METER_STATUSES, READING_SOURCES, READING_STATUSES, UTILITY_TYPE_STATUSES, UTILITY_UNITS,
  formatUtilityDate, formatUtilityNumber, prettyUtility,
} from '../components/utilityMeterOptions';

const TABS = [
  { key: 'meters', label: 'Meters', permission: 'METER_READ' },
  { key: 'readings', label: 'Meter readings', permission: 'METER_READING_READ' },
  { key: 'tariffs', label: 'Tariffs', permission: 'UTILITY_TARIFF_READ' },
  { key: 'bills', label: 'Utility bills', permission: 'UTILITY_BILL_READ' },
  { key: 'types', label: 'Utility types', permission: 'UTILITY_TYPE_READ' },
];
const unwrapList = (value, key) => Array.isArray(value) ? value : Array.isArray(value?.[key]) ? value[key] : [];
const unwrapRows = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const today = () => new Date().toLocaleDateString('en-CA');

function StatusPill({ value }) {
  const status = String(value || 'UNKNOWN').toLowerCase();
  return <span className={`um-status um-status-${status}`}>{prettyUtility(value || 'Unknown')}</span>;
}

function Field({ label, children, hint }) {
  return <div className="field"><label>{label}</label>{children}{hint && <p className="field-hint">{hint}</p>}</div>;
}
function TextInput({ label, value, onChange, type = 'text', required = false, placeholder, min, step, hint }) {
  return <Field label={label} hint={hint}><input className="input" type={type} value={value ?? ''} required={required} placeholder={placeholder} min={min} step={step} onChange={(e) => onChange(e.target.value)} /></Field>;
}
function Choice({ label, value, onChange, options, placeholder = 'Select…', required = false, disabled = false }) {
  return <Field label={label}><select className="input" value={value ?? ''} required={required} disabled={disabled} onChange={(e) => onChange(e.target.value)}><option value="">{placeholder}</option>{options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{prettyUtility(o)}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
}
function FormActions({ onCancel, saving, label = 'Save' }) {
  return <div className="form-actions"><button className="btn btn-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : label}</button></div>;
}

function TypeForm({ initial, societyId, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ code: initial?.code || '', name: initial?.name || '', unitOfMeasure: initial?.unit_of_measure || initial?.unitOfMeasure || 'KWH', status: initial?.status || 'ACTIVE' });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(initial ? { name: form.name, unitOfMeasure: form.unitOfMeasure, status: form.status } : { societyId, code: form.code.trim().toUpperCase(), name: form.name.trim(), unitOfMeasure: form.unitOfMeasure }); }}>
    <div className="form-grid">
      {!initial && <TextInput label="Code" value={form.code} onChange={(v) => set('code', v)} required placeholder="e.g. ELECTRICITY" />}
      <TextInput label="Display name" value={form.name} onChange={(v) => set('name', v)} required placeholder="e.g. Electricity" />
      <Choice label="Unit of measure" value={form.unitOfMeasure} onChange={(v) => set('unitOfMeasure', v)} options={UTILITY_UNITS} />
      {initial && <Choice label="Status" value={form.status} onChange={(v) => set('status', v)} options={UTILITY_TYPE_STATUSES} />}
    </div>
    <FormActions onCancel={onCancel} saving={saving} label={initial ? 'Save changes' : 'Create utility type'} />
  </form>;
}
function MeterForm({ initial, societyId, types, unitOptions, unitOptionsLoading, unitOptionsError, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({ meterNo: initial?.meter_no || initial?.meterNo || '', utilityTypeId: initial?.utility_type_id || initial?.utilityTypeId || '', unitId: initial?.unit_id || initial?.unitId || '', installationDate: String(initial?.installation_date || '').slice(0,10), status: initial?.status || 'ACTIVE' });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const meterUnitOptions = form.unitId && !unitOptions.some((option) => option.value === form.unitId)
    ? [{ value: form.unitId, label: 'Previously selected unit' }, ...unitOptions]
    : unitOptions;
  return <form onSubmit={(e) => { e.preventDefault(); const payload = initial ? { meterNo: form.meterNo.trim(), unitId: form.unitId || null, installationDate: form.installationDate || null, status: form.status } : { societyId, meterNo: form.meterNo.trim(), utilityTypeId: form.utilityTypeId, ...(form.unitId ? { unitId: form.unitId } : {}), installationDate: form.installationDate || null }; onSubmit(payload); }}>
    <div className="form-grid">
      <TextInput label="Meter number" value={form.meterNo} onChange={(v) => set('meterNo', v)} required placeholder="e.g. EM-0001" />
      {!initial && <Choice label="Utility type" value={form.utilityTypeId} onChange={(v) => set('utilityTypeId', v)} required options={types.filter((t) => t.status !== 'INACTIVE').map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))} />}
      <Choice label="Unit (optional)" value={form.unitId} onChange={(v) => set('unitId', v)} placeholder={unitOptionsLoading ? 'Loading units…' : 'Common-area meter (no unit)'} options={meterUnitOptions} disabled={unitOptionsLoading} />
      {unitOptionsError && <p className="field-hint">Could not load unit options: {unitOptionsError}</p>}
      {!unitOptionsError && <p className="field-hint">Unit options include their tower name. Leave blank for a common-area meter.</p>}
      <TextInput label="Installation date" type="date" value={form.installationDate} onChange={(v) => set('installationDate', v)} />
      {initial && <Choice label="Status" value={form.status} onChange={(v) => set('status', v)} options={METER_STATUSES} />}
    </div>
    <FormActions onCancel={onCancel} saving={saving} label={initial ? 'Save changes' : 'Register meter'} />
  </form>;
}
function TariffForm({ initial, societyId, types, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(() => ({ utilityTypeId: initial?.utility_type_id || '', effectiveFrom: String(initial?.effective_from || today()).slice(0,10), effectiveTo: String(initial?.effective_to || '').slice(0,10), mode: initial?.slab_config?.flatRate !== undefined ? 'flat' : 'slabs', flatRate: initial?.slab_config?.flatRate ?? '', slabs: initial?.slab_config?.slabs || [{ upTo: '100', rate: '5' }, { upTo: '', rate: '8' }] }));
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateSlab = (index, key, value) => set('slabs', form.slabs.map((s, i) => i === index ? { ...s, [key]: value } : s));
  const makeConfig = () => form.mode === 'flat' ? { flatRate: Number(form.flatRate) } : { slabs: form.slabs.map((s) => ({ upTo: s.upTo === '' ? null : Number(s.upTo), rate: Number(s.rate) })) };
  return <form onSubmit={(e) => { e.preventDefault(); const payload = { ...(initial ? {} : { societyId, utilityTypeId: form.utilityTypeId }), effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, slabConfig: makeConfig() }; onSubmit(payload); }}>
    <div className="form-grid">
      {!initial && <Choice label="Utility type" value={form.utilityTypeId} onChange={(v) => set('utilityTypeId', v)} options={types.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))} />}
      <TextInput label="Effective from" type="date" value={form.effectiveFrom} onChange={(v) => set('effectiveFrom', v)} required />
      <TextInput label="Effective to (optional)" type="date" value={form.effectiveTo} onChange={(v) => set('effectiveTo', v)} />
      <Choice label="Pricing model" value={form.mode} onChange={(v) => set('mode', v)} options={[{ value: 'slabs', label: 'Slab-based rates' }, { value: 'flat', label: 'Flat rate' }]} />
    </div>
    {form.mode === 'flat' ? <TextInput label="Rate per unit" type="number" min="0" step="0.01" value={form.flatRate} onChange={(v) => set('flatRate', v)} required /> : <div className="um-slab-builder"><div className="um-slab-head"><strong>Consumption slabs</strong><span className="muted">Leave upper limit blank for the final unlimited slab.</span></div>{form.slabs.map((slab, index) => <div className="um-slab-row" key={index}><TextInput label={`Slab ${index + 1} upper limit`} type="number" min="0" value={slab.upTo} onChange={(v) => updateSlab(index, 'upTo', v)} placeholder="No limit" /><TextInput label="Rate per unit" type="number" min="0" step="0.01" value={slab.rate} onChange={(v) => updateSlab(index, 'rate', v)} required /></div>)}<button className="btn btn-secondary" type="button" onClick={() => set('slabs', [...form.slabs, { upTo: '', rate: '' }])}><Plus size={15} /> Add slab</button></div>}
    <FormActions onCancel={onCancel} saving={saving} label={initial ? 'Save tariff' : 'Create tariff'} />
  </form>;
}
function typeByIdLabel(id, types) { return types.find((type) => type.id === id)?.name || 'Utility'; }

function ReadingForm({ meters, types = [], initialMeterId = '', onSubmit, onCancel, saving, mode = 'reading' }) {
  const [form, setForm] = useState({ meterId: initialMeterId, readingDate: today(), readingValue: '', source: 'MANUAL', isRollover: false });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ meterId: form.meterId, readingDate: form.readingDate, readingValue: Number(form.readingValue), ...(mode === 'reading' ? { source: form.source, isRollover: form.isRollover } : {}) }); }}>
    <div className="form-grid">
      <Choice label="Meter" value={form.meterId} onChange={(v) => set('meterId', v)} options={meters.filter((m) => m.status === 'ACTIVE').map((m) => ({ value: m.id, label: `${m.meter_no} · ${m.utility_name || m.utility_type_name || typeByIdLabel(m.utility_type_id, types)}` }))} />
      <TextInput label="Reading date" type="date" value={form.readingDate} onChange={(v) => set('readingDate', v)} required />
      <TextInput label="Reading value" type="number" min="0" step="0.01" value={form.readingValue} onChange={(v) => set('readingValue', v)} required />
      {mode === 'reading' && <Choice label="Source" value={form.source} onChange={(v) => set('source', v)} options={READING_SOURCES} />}
    </div>
    {mode === 'reading' && <div className="um-rollover-option"><label className="um-check"><input type="checkbox" checked={form.isRollover} onChange={(e) => set('isRollover', e.target.checked)} /> <span>Meter reset/rollover</span></label><p className="field-hint">Check this only when the meter has legitimately restarted from a lower reading.</p></div>}
    <FormActions onCancel={onCancel} saving={saving} label={mode === 'estimate' ? 'Save estimate' : 'Submit reading'} />
  </form>;
}
function BulkReadingForm({ meters, onSubmit, onCancel, saving }) {
  const [rows, setRows] = useState([{ meterId: '', readingDate: today(), readingValue: '' }, { meterId: '', readingDate: today(), readingValue: '' }]);
  const change = (index, key, value) => setRows((prev) => prev.map((r, i) => i === index ? { ...r, [key]: value } : r));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(rows.filter((r) => r.meterId && r.readingValue !== '').map((r) => ({ ...r, readingValue: Number(r.readingValue) }))); }}>
    <p className="muted um-form-intro">Each row is processed independently. Successful and failed rows will be reported after submission.</p>
    {rows.map((row, index) => <div className="um-bulk-row" key={index}><strong>Row {index + 1}</strong><Choice label="Meter" value={row.meterId} onChange={(v) => change(index, 'meterId', v)} options={meters.filter((m) => m.status === 'ACTIVE').map((m) => ({ value: m.id, label: m.meter_no }))} /><TextInput label="Reading date" type="date" value={row.readingDate} onChange={(v) => change(index, 'readingDate', v)} required /><TextInput label="Reading value" type="number" min="0" step="0.01" value={row.readingValue} onChange={(v) => change(index, 'readingValue', v)} required /></div>)}
    <button type="button" className="btn btn-secondary" onClick={() => setRows((prev) => [...prev, { meterId: '', readingDate: today(), readingValue: '' }])}><Plus size={15} /> Add row</button>
    <FormActions onCancel={onCancel} saving={saving} label="Submit bulk readings" />
  </form>;
}
function LinkBillForm({ bill, onSubmit, onCancel, saving }) {
  const [billingCycleId, setBillingCycleId] = useState(bill.billing_cycle_id || '');
  const [invoiceLineId, setInvoiceLineId] = useState(bill.invoice_line_id || '');
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ billingCycleId: billingCycleId || undefined, invoiceLineId: invoiceLineId || undefined }); }}>
    <p className="muted um-form-intro">These IDs are accepted as UUID references by the current API; the Billing module owns their records.</p>
    <TextInput label="Billing cycle ID" value={billingCycleId} onChange={setBillingCycleId} placeholder="Billing cycle UUID" />
    <TextInput label="Invoice line ID" value={invoiceLineId} onChange={setInvoiceLineId} placeholder="Invoice line UUID" />
    <FormActions onCancel={onCancel} saving={saving} label="Link bill" />
  </form>;
}

export default function UtilityMeterManagementPage() {
  const { hasPermission, hasAnyPermission } = useAuth();
  const { societyId } = useSociety();
  const [tab, setTab] = useState('meters');
  const [types, setTypes] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [unitOptionsLoading, setUnitOptionsLoading] = useState(false);
  const [unitOptionsError, setUnitOptionsError] = useState('');
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedMeter, setSelectedMeter] = useState('');
  const [readingStatus, setReadingStatus] = useState('');
  const [meterStatus, setMeterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  // Keep rollover choice for readings during this page session when the API response omits it.
  const [rolloverByReading, setRolloverByReading] = useState({});
  // Keep a synchronous copy so validation immediately after submit sees the checkbox choice.
  const rolloverByReadingRef = useRef({});

  const allowedTabs = TABS.filter((item) => hasPermission(item.permission));
  const loadSetup = useCallback(async () => {
    if (!societyId) return;
    setLoading(true); setError('');
    try {
      const tasks = [];
      tasks.push(hasPermission('UTILITY_TYPE_READ') ? utilityApi.listUtilityTypes({ societyId }) : Promise.resolve([]));
      tasks.push(hasPermission('METER_READ') ? utilityApi.listMeters({ societyId }) : Promise.resolve([]));
      tasks.push(hasPermission('METER_READING_READ') ? utilityApi.listReadings(selectedMeter ? { meterId: selectedMeter, status: readingStatus } : { status: readingStatus }) : Promise.resolve([]));
      tasks.push(hasPermission('UTILITY_BILL_READ') && selectedMeter ? utilityApi.listBillsForMeter(selectedMeter) : Promise.resolve([]));
      const [typeRows, meterRows, readingRows, billRows] = await Promise.all(tasks);
      setTypes(unwrapList(typeRows, 'types'));
      setMeters(unwrapList(meterRows, 'meters'));
      setReadings(unwrapList(readingRows, 'readings'));
      setBills(unwrapList(billRows, 'bills'));
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [societyId, hasPermission, selectedMeter, readingStatus, selectedType]);

  const loadTariffs = useCallback(async () => {
    if (!hasPermission('UTILITY_TARIFF_READ')) { setTariffs([]); return; }
    const typeIds = selectedType ? [selectedType] : types.map((type) => type.id).filter(Boolean);
    if (!typeIds.length) { setTariffs([]); return; }
    try {
      const results = await Promise.all(typeIds.map(async (typeId) => {
        try { return unwrapList(await utilityApi.listTariffs(typeId), 'tariffs'); }
        catch (err) {
          if (selectedType) throw err;
          return [];
        }
      }));
      const unique = new Map();
      results.flat().forEach((tariff) => { if (tariff?.id) unique.set(tariff.id, tariff); });
      setTariffs([...unique.values()]);
    } catch (err) { setError(getErrorMessage(err)); }
  }, [selectedType, hasPermission, types]);

  useEffect(() => { loadSetup(); }, [loadSetup]);
  useEffect(() => { loadTariffs(); }, [loadTariffs]);

  useEffect(() => {
    let isCurrent = true;
    if (!societyId) {
      setUnitOptions([]);
      setUnitOptionsLoading(false);
      setUnitOptionsError('');
      return () => { isCurrent = false; };
    }

    setUnitOptionsLoading(true);
    setUnitOptionsError('');
    const societyConfig = { headers: { 'x-society-id': societyId } };
    Promise.all([unitApi.getAll(societyConfig), floorApi.getAll(societyConfig), towerApi.getAll(societyConfig)])
      .then(([unitResponse, floorResponse, towerResponse]) => {
        if (!isCurrent) return;
        const floorsById = new Map(unwrapRows(floorResponse).map((floor) => [floor.id, floor]));
        const towersById = new Map(unwrapRows(towerResponse).map((tower) => [tower.id, tower]));
        const options = unwrapRows(unitResponse)
          .filter((unit) => unit.status !== 'INACTIVE')
          .map((unit) => {
            const floor = floorsById.get(unit.floorId);
            const tower = floor && towersById.get(floor.towerId);
            const unitName = unit.unitNumber || unit.name || 'Unit';
            return { value: unit.id, label: tower?.name ? `${unitName} — ${tower.name}` : unitName };
          });
        setUnitOptions(options);
      })
      .catch((err) => {
        if (isCurrent) setUnitOptionsError(getErrorMessage(err));
      })
      .finally(() => {
        if (isCurrent) setUnitOptionsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [societyId]);

  const refresh = () => { loadSetup(); loadTariffs(); };
  const perform = async (operation, successMessage, after = refresh) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await operation();
      setNotice(successMessage);
      setModal(null); setConfirm(null); setDetail(null);
      if (result?.results) setBulkResult(result);
      await after();
      return result;
    } catch (err) { setError(getErrorMessage(err)); return null; }
    finally { setBusy(false); }
  };
  const openModal = (kind, item = null) => { setError(''); setModal({ kind, item }); };
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const meterById = useMemo(() => new Map(meters.map((m) => [m.id, m])), [meters]);
  const activeFilters = Boolean(search || selectedType || meterStatus || selectedMeter || readingStatus);
  const filteredMeters = useMemo(() => meters.filter((m) => (!selectedType || m.utility_type_id === selectedType) && (!meterStatus || m.status === meterStatus) && (!search || `${m.meter_no} ${m.unit_id || ''} ${typeById.get(m.utility_type_id)?.name || ''}`.toLowerCase().includes(search.toLowerCase()))), [meters, selectedType, meterStatus, search, typeById]);
  const filteredTypes = useMemo(() => types.filter((t) => !search || `${t.code} ${t.name}`.toLowerCase().includes(search.toLowerCase())), [types, search]);
  const filteredReadings = useMemo(() => readings.filter((r) => {
    const matchesMeter = !selectedMeter || r.meter_id === selectedMeter;
    const matchesStatus = !readingStatus || r.status === readingStatus;
    const matchesSearch = !search || `${meterById.get(r.meter_id)?.meter_no || r.meter_id} ${r.reading_value} ${r.status} ${r.source || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesMeter && matchesStatus && matchesSearch;
  }), [readings, selectedMeter, readingStatus, search, meterById]);
  const readingKey = (row) => `${row.meter_id || row.meterId}|${String(row.reading_date || row.readingDate || '').slice(0, 10)}|${Number(row.reading_value ?? row.readingValue)}`;
  const isRolloverReading = (row) => {
    const key = readingKey(row);
    if (Object.prototype.hasOwnProperty.call(rolloverByReadingRef.current, key)) return rolloverByReadingRef.current[key];
    if (Object.prototype.hasOwnProperty.call(rolloverByReading, key)) return rolloverByReading[key];
    const id = row.id == null ? '' : String(row.id);
    if (id && Object.prototype.hasOwnProperty.call(rolloverByReadingRef.current, `id:${id}`)) return rolloverByReadingRef.current[`id:${id}`];
    return row.is_rollover === true || row.isRollover === true || row.is_roll_over === true || row.rollover === true || row.meter_reset === true;
  };
  const getPreviousValidatedReading = (row) => readings
    .filter((candidate) =>
      candidate.meter_id === row.meter_id &&
      candidate.id !== row.id &&
      ['VALIDATED', 'BILLED'].includes(String(candidate.status || '').toUpperCase()) &&
      String(candidate.reading_date || '').slice(0, 10) < String(row.reading_date || '').slice(0, 10)
    )
    .sort((a, b) => String(b.reading_date || '').localeCompare(String(a.reading_date || '')))[0];

  const getReadingConsumption = (row) => {
    const direct = row.consumption ?? row.consumption_value ?? row.consumed_units;
    if (direct !== undefined && direct !== null && direct !== '') return formatUtilityNumber(direct);
    if (!['VALIDATED', 'BILLED'].includes(String(row.status || '').toUpperCase())) return '—';

    const previous = getPreviousValidatedReading(row);
    if (!previous) return formatUtilityNumber(0);

    const currentValue = Number(row.reading_value);
    const previousValue = Number(previous.reading_value);
    if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return '—';

    if (currentValue >= previousValue) return formatUtilityNumber(currentValue - previousValue);

    // For rollover readings, prefer a configured meter limit. If none is exposed
    // by the API, infer the next power-of-ten boundary (e.g. 980 -> 1000).
    // This fallback is only an estimate; a configured meter limit is more accurate.
    if (isRolloverReading(row)) {
      const meter = meterById.get(row.meter_id) || {};
      const configuredLimit = [
        meter.max_reading, meter.maxReading, meter.max_reading_value, meter.maxReadingValue,
        meter.max_value, meter.maxValue, meter.rollover_at, meter.rolloverAt,
      ].map(Number).find((value) => Number.isFinite(value) && value > previousValue);
      const rolloverLimit = configuredLimit || (10 ** (Math.floor(Math.log10(Math.max(previousValue, 1))) + 1));
      return Number.isFinite(rolloverLimit) && rolloverLimit > previousValue
        ? formatUtilityNumber((rolloverLimit - previousValue) + currentValue)
        : '—';
    }
    return '—';
  };
  const detailEntries = useMemo(() => {
    if (!detail?.data) return [];
    const data = detail.data;
    if (detail.title === 'Meter details') {
      const utilityId = data.utility_type_id || data.utilityTypeId;
      return [
        ['Meter number', data.meter_no || data.meterNo || '—'],
        ['Utility type', typeById.get(utilityId)?.name || data.utility_type_name || data.utility_name || '—'],
        ['Unit', (data.unit_id || data.unitId)
          ? unitOptions.find((unit) => unit.value === (data.unit_id || data.unitId))?.label || 'Assigned unit (details unavailable)'
          : 'Common-area meter'],
        ['Installation date', formatUtilityDate(data.installation_date || data.installationDate)],
        ['Status', prettyUtility(data.status || 'UNKNOWN')],
      ];
    }
    return Object.entries(data).filter(([key]) => !['id', 'society_id', 'created_at', 'updated_at', 'utility_type_id', 'meter_id'].includes(key)).map(([key, value]) => {
      if (key === 'consumption' || key === 'consumption_value') return ['Consumption', value === null ? '—' : formatUtilityNumber(value)];
      if (key === 'reading_value') return ['Reading value', formatUtilityNumber(value)];
      if (key === 'unit_id') return ['Unit', value || 'Common-area meter'];
      return [prettyUtility(key), value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')];
    });
  }, [detail, typeById, unitOptions]);
  const activeMeters = meters.filter((m) => m.status === 'ACTIVE').length;
  const pendingReadings = readings.filter((r) => ['SUBMITTED', 'ESTIMATED', 'PENDING'].includes(r.status)).length;

  if (!societyId) return <PageContainer title="Utility & Meter Management" subtitle="Configure utilities, meters, readings, tariffs and consumption bills."><SocietyIdPrompt /></PageContainer>;

  const canCreateType = hasPermission('UTILITY_TYPE_CREATE');
  const canCreateMeter = hasPermission('METER_CREATE');
  const canCreateReading = hasPermission('METER_READING_CREATE');
  const canCreateTariff = hasPermission('UTILITY_TARIFF_CREATE');
  const canCreateBill = hasPermission('UTILITY_BILL_CREATE');
  const canUpdateReading = hasPermission('METER_READING_UPDATE');
  const canUpdateTariff = hasPermission('UTILITY_TARIFF_UPDATE');
  const canUpdateMeter = hasPermission('METER_UPDATE');
  const canDeleteType = hasPermission('UTILITY_TYPE_DELETE');
  const canDeleteMeter = hasPermission('METER_DELETE');
  const canDeleteTariff = hasPermission('UTILITY_TARIFF_DELETE');
  const canUpdateType = hasPermission('UTILITY_TYPE_UPDATE');

  const createOrUpdate = async (payload) => {
    const { kind, item } = modal;
    if (kind === 'reading' && !item) {
      const value = Number(payload.readingValue);
      const previous = readings
        .filter((candidate) =>
          candidate.meter_id === payload.meterId &&
          ['VALIDATED', 'BILLED'].includes(String(candidate.status || '').toUpperCase()) &&
          String(candidate.reading_date || '').slice(0, 10) < String(payload.readingDate || '').slice(0, 10)
        )
        .sort((a, b) => String(b.reading_date || '').localeCompare(String(a.reading_date || '')))[0];
      if (previous && Number.isFinite(value) && value < Number(previous.reading_value) && !payload.isRollover) {
        setError(`Reading value (${formatUtilityNumber(value)}) is lower than the previous validated reading (${formatUtilityNumber(previous.reading_value)}). Select Meter reset/rollover only if the meter has legitimately reset.`);
        return null;
      }
    }
    if (kind === 'type' && !item) {
      const code = String(payload.code || '').trim().toUpperCase();
      if (!code) { setError('Utility type code is required.'); return null; }
      if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) { setError('Use only letters, numbers, underscores, or hyphens in the utility type code.'); return null; }
      if (types.some((type) => String(type.code || '').trim().toUpperCase() === code)) {
        setError(`Utility type code "${code}" already exists. Enter a unique code.`);
        return null;
      }
    }
    if (kind === 'meter' && !item) {
      const meterNo = String(payload.meterNo || '').trim();
      if (!meterNo) { setError('Meter number is required.'); return null; }
      if (meters.some((meter) => String(meter.meter_no || meter.meterNo || '').trim().toLowerCase() === meterNo.toLowerCase())) {
        setError(`Meter number "${meterNo}" already exists. Enter a unique meter number.`);
        return null;
      }
      if (!payload.utilityTypeId) { setError('Select a utility type before registering the meter.'); return null; }
    }
    const actions = {
      type: () => item ? utilityApi.updateUtilityType(item.id, payload) : utilityApi.createUtilityType(payload),
      meter: () => item ? utilityApi.updateMeter(item.id, payload) : utilityApi.createMeter(payload),
      tariff: () => item ? utilityApi.updateTariff(item.id, payload) : utilityApi.createTariff(payload),
      reading: async () => {
        const key = readingKey({ meter_id: payload.meterId, reading_date: payload.readingDate, reading_value: payload.readingValue });
        const rolloverChoice = Boolean(payload.isRollover);
        // Record the choice before the request; the API may omit the flag from its response.
        rolloverByReadingRef.current = { ...rolloverByReadingRef.current, [key]: rolloverChoice };
        setRolloverByReading((previous) => ({ ...previous, [key]: rolloverChoice }));
        const result = await utilityApi.submitReading(payload);
        const created = result?.data?.reading || result?.reading || result?.data || result;
        if (created?.id) {
          rolloverByReadingRef.current = { ...rolloverByReadingRef.current, [`id:${created.id}`]: rolloverChoice };
          setRolloverByReading((previous) => ({ ...previous, [`id:${created.id}`]: rolloverChoice }));
        }
        return result;
      },
      estimate: () => utilityApi.submitEstimatedReading(payload),
      bulk: () => utilityApi.submitBulkReadings(payload),
      replace: () => utilityApi.replaceMeter(item.id, payload),
      adjust: () => utilityApi.adjustReading(item.id, payload.actualValue),
      linkBill: () => utilityApi.linkBill(item.id, payload),
    };
    const messages = { type: item ? 'Utility type updated.' : 'Utility type created.', meter: item ? 'Meter updated.' : 'Meter registered.', tariff: item ? 'Tariff updated.' : 'Tariff created.', reading: 'Meter reading submitted.', estimate: 'Estimated reading saved.', bulk: 'Bulk readings processed.', replace: 'Meter replacement completed.', adjust: 'Reading adjusted and resubmitted.', linkBill: 'Bill linked to billing records.' };
    return perform(actions[kind], messages[kind] || 'Changes saved.');
  };

  const remove = (kind, item) => setConfirm({ kind, item });
  const doRemove = async () => {
    const { kind, item } = confirm;
    const actions = { type: () => utilityApi.deleteUtilityType(item.id), meter: () => utilityApi.deleteMeter(item.id), tariff: () => utilityApi.deleteTariff(item.id) };
    await perform(actions[kind], `${prettyUtility(kind)} deleted.`);
  };
  const validate = (row) => {
    const previous = getPreviousValidatedReading(row);
    if (previous && Number(row.reading_value) < Number(previous.reading_value) && !isRolloverReading(row)) {
      setError(`Cannot validate reading ${formatUtilityNumber(row.reading_value)} because it is lower than the previous validated reading ${formatUtilityNumber(previous.reading_value)}. Check Meter reset/rollover only if the meter has legitimately rolled over.`);
      return;
    }
    return perform(() => utilityApi.validateReading(row.id), 'Reading validated.');
  };
  const reject = (row) => {
    const remarks = window.prompt('Reason for rejecting this reading (optional):', 'Reading requires correction');
    if (remarks === null) return;
    perform(() => utilityApi.rejectReading(row.id, remarks), 'Reading rejected.');
  };
  const makeBill = async (row) => {
    const consumption = getReadingConsumption(row);
    if (consumption === '—') {
      setError('Consumption is not available for this reading yet. Verify the previous reading and rollover settings before calculating a bill.');
      return;
    }
    setError('');
    try {
      const existingBills = unwrapList(await utilityApi.listBillsForMeter(row.meter_id), 'bills');
      const alreadyBilled = existingBills.some((bill) =>
        String(bill.reading_id || bill.readingId || bill.meter_reading_id || bill.meterReadingId || '') === String(row.id)
      );
      if (alreadyBilled) {
        setError('A utility bill already exists for this meter reading. Duplicate bill creation was prevented.');
        return;
      }
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }
    await perform(() => utilityApi.createBill(row.id), 'Utility bill calculated.');
  };
  const openReadingDetail = async (row) => {
    setError('');
    try { setDetail({ title: 'Reading details', data: await utilityApi.getReading(row.id) }); }
    catch (err) { setError(getErrorMessage(err)); }
  };
  const openBillDetail = async (bill) => {
    setError('');
    try { setDetail({ title: 'Utility bill details', data: await utilityApi.getBill(bill.id) }); }
    catch (err) { setError(getErrorMessage(err)); }
  };
  const loadBillsForSelectedMeter = async (meterId) => {
    setSelectedMeter(meterId);
    if (!meterId) { setBills([]); return; }
    if (hasPermission('UTILITY_BILL_READ')) {
      try { setBills(unwrapList(await utilityApi.listBillsForMeter(meterId), 'bills')); }
      catch (err) { setError(getErrorMessage(err)); }
    }
  };
  const clearFilters = () => { setSearch(''); setSelectedType(''); setMeterStatus(''); setSelectedMeter(''); setReadingStatus(''); setBills([]); setError(''); };
  const columnsMeters = [
    { key: 'meter_no', header: 'Meter number', render: (r) => <><button className="um-link-button" onClick={() => setDetail({ title: 'Meter details', data: r })}>{r.meter_no}</button><span className="cell-sub">{r.unit_id ? unitOptions.find((unit) => unit.value === r.unit_id)?.label || 'Unit not found in this society' : 'Common-area meter'}</span></> },
    { key: 'utility', header: 'Utility', render: (r) => typeById.get(r.utility_type_id)?.name || r.utility_type_name || '—' },
    { key: 'installed', header: 'Installed', render: (r) => formatUtilityDate(r.installation_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="um-row-actions">
      {hasPermission('METER_UPDATE') && <button className="btn btn-ghost btn-sm" onClick={() => openModal('meter', r)}>Edit</button>}
      {hasPermission('METER_UPDATE') && r.status !== 'REPLACED' && <button className="btn btn-ghost btn-sm" onClick={() => openModal('replace', r)}>Replace</button>}
      {hasPermission('METER_DELETE') && <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove('meter', r)}>Delete</button>}
      {hasPermission('METER_READING_CREATE') && <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedMeter(r.id); openModal('reading'); }}>Add reading</button>}
    </div> },
  ];
  const columnsTypes = [
    { key: 'code', header: 'Code', render: (r) => <strong>{r.code}</strong> },
    { key: 'name', header: 'Utility type', render: (r) => <><strong>{r.name}</strong><span className="cell-sub">{r.unit_of_measure}</span></> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="um-row-actions">
      {canUpdateType && <button className="btn btn-ghost btn-sm" onClick={() => openModal('type', r)}>Edit</button>}
      {canDeleteType && <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove('type', r)}>Delete</button>}
    </div> },
  ];
  const columnsReadings = [
    { key: 'meter', header: 'Meter', render: (r) => <><strong>{meterById.get(r.meter_id)?.meter_no || r.meter_id}</strong><span className="cell-sub">{formatUtilityDate(r.reading_date)}</span></> },
    { key: 'reading_value', header: 'Reading', render: (r) => formatUtilityNumber(r.reading_value) },
    { key: 'consumption', header: 'Consumption', render: (r) => getReadingConsumption(r) },
    { key: 'source', header: 'Source', render: (r) => prettyUtility(r.source) },
    { key: 'status', header: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="um-row-actions">
      <button className="btn btn-ghost btn-sm" onClick={() => openReadingDetail(r)}>Details</button>
      {canUpdateReading && ['SUBMITTED','ESTIMATED'].includes(r.status) && <button className="btn btn-ghost btn-sm" onClick={() => validate(r)}>Validate</button>}
      {canUpdateReading && ['SUBMITTED','ESTIMATED'].includes(r.status) && <button className="btn btn-ghost btn-sm text-danger" onClick={() => reject(r)}>Reject</button>}
      {canUpdateReading && r.status === 'ESTIMATED' && <button className="btn btn-ghost btn-sm" onClick={() => openModal('adjust', r)}>Adjust</button>}
      {canCreateBill && r.status === 'VALIDATED' && <button className="btn btn-secondary btn-sm" onClick={() => makeBill(r)}>Calculate bill</button>}
    </div> },
  ];
  const columnsTariffs = [
    { key: 'type', header: 'Utility type', render: (r) => typeById.get(r.utility_type_id)?.name || r.utility_type_name || 'Unknown utility type' },
    { key: 'pricing', header: 'Rate structure', render: (r) => r.slab_config?.flatRate !== undefined ? `Flat · ₹${r.slab_config.flatRate}` : `${r.slab_config?.slabs?.length || 0} pricing slabs` },
    { key: 'effective', header: 'Effective period', render: (r) => `${formatUtilityDate(r.effective_from)} – ${formatUtilityDate(r.effective_to)}` },
    { key: 'actions', header: 'Actions', render: (r) => <div className="um-row-actions">
      {canUpdateTariff && <button className="btn btn-ghost btn-sm" onClick={() => openModal('tariff', r)}>Edit</button>}
      {canDeleteTariff && <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove('tariff', r)}>Delete</button>}
    </div> },
  ];
  const columnsBills = [
    { key: 'created', header: 'Created', render: (r) => formatUtilityDate(r.created_at) },
    { key: 'meter', header: 'Meter', render: (r) => meterById.get(r.meter_id)?.meter_no || r.meter_id },
    { key: 'consumption', header: 'Consumption', render: (r) => formatUtilityNumber(r.consumption) },
    { key: 'amount', header: 'Amount', render: (r) => <strong>₹{formatUtilityNumber(r.amount)}</strong> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="um-row-actions"><button className="btn btn-ghost btn-sm" onClick={() => openBillDetail(r)}>Details</button>{hasPermission('UTILITY_BILL_UPDATE') && r.status !== 'INVOICED' && <button className="btn btn-ghost btn-sm" onClick={() => openModal('linkBill', r)}>Link to billing</button>}</div> },
  ];

  const actions = <div className="um-header-actions">
    {tab === 'meters' && canCreateMeter && <button className="btn btn-primary" onClick={() => openModal('meter')}><Plus size={16} /> Register meter</button>}
    {tab === 'types' && canCreateType && <button className="btn btn-primary" onClick={() => openModal('type')}><Plus size={16} /> New utility type</button>}
    {tab === 'readings' && canCreateReading && <><button className="btn btn-secondary" onClick={() => openModal('estimate')}>Estimate reading</button><button className="btn btn-secondary" onClick={() => openModal('bulk')}>Bulk entry</button><button className="btn btn-primary" onClick={() => openModal('reading')}><Plus size={16} /> Add reading</button></>}
    {tab === 'tariffs' && canCreateTariff && <button className="btn btn-primary" onClick={() => openModal('tariff')}><Plus size={16} /> New tariff</button>}
  </div>;

  return <PageContainer title="Utility & Meter Management" subtitle="Manage utility types, meters, readings, tariffs and consumption-based bills." actions={actions}>
    {error && <Alert variant="error">{error}</Alert>}
    {notice && <Alert variant="success">{notice}</Alert>}
    {bulkResult && <div className="um-bulk-summary"><div><strong>Bulk upload results</strong><span>{bulkResult.succeeded} succeeded · {bulkResult.failed} failed of {bulkResult.total}</span></div><button className="btn btn-ghost btn-sm" onClick={() => setBulkResult(null)}>Dismiss</button>{bulkResult.results?.map((r) => <p key={r.index} className={r.success ? 'um-result-ok' : 'um-result-fail'}>Row {r.index + 1}: {r.success ? 'Submitted' : r.error}</p>)}</div>}
    <div className="um-stats society-stats">
      <div className="um-stat society-stat-card"><span className="society-stat-icon society-stat-icon-blue"><Gauge size={19} /></span><div><span className="society-stat-label">Registered meters</span><strong>{meters.length}</strong></div></div>
      <div className="um-stat society-stat-card"><span className="society-stat-icon society-stat-icon-green"><Activity size={19} /></span><div><span className="society-stat-label">Active meters</span><strong>{activeMeters}</strong></div></div>
      <div className="um-stat society-stat-card"><span className="society-stat-icon society-stat-icon-violet"><AlertTriangle size={19} /></span><div><span className="society-stat-label">Readings to review</span><strong>{pendingReadings}</strong></div></div>
      <div className="um-stat society-stat-card"><span className="society-stat-icon society-stat-icon-blue">{types.some((t) => /water/i.test(t.name)) ? <Droplets size={19} /> : <Zap size={19} />}</span><div><span className="society-stat-label">Utility types</span><strong>{types.length}</strong></div></div>
    </div>
    <div className="tabs-bar um-tabs-bar">
      <nav className="tabs" role="tablist" aria-label="Utility management sections">
        {allowedTabs.map((item) => <button type="button" key={item.key} role="tab" aria-selected={tab === item.key} className={`tab${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </nav>
    </div>
    <section className="card section um-content-card">
      <div className="section-heading"><div><h2 className="section-title">{TABS.find((item) => item.key === tab)?.label || 'Utility management'}</h2><p className="muted">{tab === 'meters' ? 'Register meters by utility type and flat, or track common-area meters.' : tab === 'readings' ? 'Submit, validate, reject or adjust readings before calculating a bill.' : tab === 'tariffs' ? 'Set effective-dated flat rates or tiered pricing slabs.' : tab === 'bills' ? 'Review calculated consumption bills and link them to the Billing module.' : 'Configure the utility categories available to the society.'}</p></div></div>
      <div className="toolbar um-toolbar">
        <div className="um-search"><Search size={16} /><input className="input" type="search" placeholder={tab === 'readings' ? 'Search meter ID, value or status' : 'Search records'} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {(tab === 'meters' || tab === 'tariffs') && <select className="input toolbar-select" aria-label="Filter utility type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}><option value="">All utility types</option>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}
        {tab === 'meters' && <select className="input toolbar-select" aria-label="Filter meter status" value={meterStatus} onChange={(e) => setMeterStatus(e.target.value)}><option value="">All meter statuses</option>{METER_STATUSES.map((s) => <option key={s} value={s}>{prettyUtility(s)}</option>)}</select>}
        {tab === 'readings' && <><select className="input toolbar-select" aria-label="Filter meter" value={selectedMeter} onChange={(e) => loadBillsForSelectedMeter(e.target.value)}><option value="">All meters</option>{meters.map((m) => <option key={m.id} value={m.id}>{m.meter_no}</option>)}</select><select className="input toolbar-select" aria-label="Filter reading status" value={readingStatus} onChange={(e) => setReadingStatus(e.target.value)}><option value="">All reading statuses</option>{READING_STATUSES.map((s) => <option key={s} value={s}>{prettyUtility(s)}</option>)}</select></>}
        {activeFilters && <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>}
      </div>
      {tab === 'meters' && <DataTable columns={columnsMeters} rows={filteredMeters} loading={loading} emptyTitle="No meters found" emptyMessage="Register a meter to begin tracking utility consumption." />}
      {tab === 'types' && <DataTable columns={columnsTypes} rows={filteredTypes} loading={loading} emptyTitle="No utility types found" emptyMessage="Create utility types such as electricity, water or gas." />}
      {tab === 'readings' && <DataTable columns={columnsReadings} rows={filteredReadings} loading={loading} emptyTitle="No readings found" emptyMessage="Submit a meter reading to start a consumption history." />}
      {tab === 'tariffs' && <DataTable columns={columnsTariffs} rows={tariffs.filter((r) => (!selectedType || r.utility_type_id === selectedType) && (!search || JSON.stringify(r.slab_config).includes(search)))} loading={loading} emptyTitle="No tariffs found" emptyMessage="Create a tariff before calculating utility bills." />}
      {tab === 'bills' && <><div className="um-bill-meter-filter"><label htmlFor="um-bill-meter">Choose meter to view its bills</label><select id="um-bill-meter" className="input" value={selectedMeter} onChange={(e) => loadBillsForSelectedMeter(e.target.value)}><option value="">Select a meter</option>{meters.map((m) => <option key={m.id} value={m.id}>{m.meter_no}</option>)}</select></div><DataTable columns={columnsBills} rows={bills.filter((b) => !search || `${b.status} ${b.amount} ${b.consumption}`.toLowerCase().includes(search.toLowerCase()))} loading={loading} emptyTitle="Select a meter" emptyMessage="Choose a meter above to review its calculated bills." /></>}
    </section>
    {modal && <Modal title={({ type: modal.item ? 'Edit utility type' : 'New utility type', meter: modal.item ? 'Edit meter' : 'Register meter', tariff: modal.item ? 'Edit tariff' : 'Create tariff', reading: 'Submit meter reading', estimate: 'Estimated reading', bulk: 'Bulk meter readings', replace: 'Replace meter', adjust: 'Adjust estimated reading', linkBill: 'Link bill to billing' })[modal.kind]} onClose={() => !busy && setModal(null)} busy={busy}>
      {error && <Alert variant="error">{error}</Alert>}
      {modal.kind === 'type' && <TypeForm initial={modal.item} societyId={societyId} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
      {modal.kind === 'meter' && <MeterForm initial={modal.item} societyId={societyId} types={types} unitOptions={unitOptions} unitOptionsLoading={unitOptionsLoading} unitOptionsError={unitOptionsError} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
      {modal.kind === 'tariff' && <TariffForm initial={modal.item} societyId={societyId} types={types} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
      {['reading','estimate'].includes(modal.kind) && <ReadingForm meters={meters} types={types} initialMeterId={selectedMeter} mode={modal.kind} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
      {modal.kind === 'bulk' && <BulkReadingForm meters={meters} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
      {modal.kind === 'replace' && <form onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); createOrUpdate({ newMeterNo: form.get('newMeterNo'), installationDate: form.get('installationDate') || null }); }}><p className="muted um-form-intro">The current meter will be marked REPLACED and retained as history. A new meter record will be created for the same unit and utility.</p><TextInput label="New meter number" value={modal.newMeterNo || ''} onChange={(v) => setModal((p) => ({ ...p, newMeterNo: v }))} required placeholder="e.g. EM-0002-B" /><TextInput label="Installation date" type="date" value={modal.installationDate || today()} onChange={(v) => setModal((p) => ({ ...p, installationDate: v }))} /><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button type="button" className="btn btn-primary" disabled={busy || !modal.newMeterNo} onClick={() => createOrUpdate({ newMeterNo: modal.newMeterNo, installationDate: modal.installationDate || null })}>Replace meter</button></div></form>}
      {modal.kind === 'adjust' && <form onSubmit={(e) => { e.preventDefault(); createOrUpdate({ actualValue: Number(new FormData(e.currentTarget).get('actualValue')) }); }}><p className="muted um-form-intro">Adjust the estimated value to the actual meter reading. It will be resubmitted for validation.</p><Field label="Actual reading value"><input name="actualValue" className="input" type="number" min="0" step="0.01" required defaultValue={modal.item?.reading_value ?? ''} /></Field><FormActions onCancel={() => setModal(null)} saving={busy} label="Adjust reading" /></form>}
      {modal.kind === 'linkBill' && <LinkBillForm bill={modal.item} onSubmit={createOrUpdate} onCancel={() => setModal(null)} saving={busy} />}
    </Modal>}
    {confirm && <ConfirmDialog open danger title={`Delete ${confirm.kind === 'type' ? 'utility type' : confirm.kind}`} message={`Delete "${confirm.item.name || confirm.item.meter_no || 'this record'}"? This may fail if the record is referenced by other utility data.`} confirmLabel="Delete" busy={busy} onCancel={() => setConfirm(null)} onConfirm={doRemove} />}
    {detail && <Modal title={detail.title} onClose={() => setDetail(null)}><div className="um-detail-grid">{detailEntries.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</strong></div>)}</div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button></div></Modal>}
  </PageContainer>;
}
