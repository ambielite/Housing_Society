import { useEffect, useState } from 'react';
import useFetch from '../../../utils/useFetch';
import useSociety from '../../../app/store/useSociety';
import useUnits from '../../../utils/useUnits';
import { getErrorMessage } from '../../../lib/axios';
import * as securityApi from '../api/security.api';
import SelectField from '../../../components/ui/SelectField';
import TextField from '../../../components/ui/TextField';

export function FormActions({ saving, onCancel, submitLabel = 'Save' }) {
  return <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button><button className="btn btn-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button></div>;
}

export function SocietyField({ value, onChange, error }) {
  const { societyId } = useSociety();
  return <TextField id="societyId" label="Society" value={value || societyId || ''} onChange={(e) => onChange(e.target.value)} error={error} disabled={Boolean(societyId)} hint={societyId ? 'Using the currently selected society.' : 'Select a society ID.'} />;
}

export function UnitPicker({ value, onChange, error }) {
  const { units, loading, error: loadError } = useUnits();
  if (loadError) return <TextField id="unitId" label="Unit ID" value={value} onChange={(e) => onChange(e.target.value)} error={error} hint="The existing Units API is not available, so enter the unit UUID." />;
  return <SelectField id="unitId" label="Unit" placeholder={loading ? 'Loading units...' : 'Choose unit'} options={units.filter((u) => u.status !== 'INACTIVE').map((u) => ({ value: u.id, label: `${u.unitNumber}${u.bhk ? ` - ${u.bhk}` : ''}` }))} value={value} onChange={(e) => onChange(e.target.value)} error={error} disabled={loading} />;
}

export function UserPicker({ value, onChange, label = 'User', error }) {
  const { societyId } = useSociety();

  // Guard users are regular users, so load the user directory without
  // forcing the society/status query filters. The returned records are
  // then filtered to active users on the frontend.
  const users = useFetch(
    () => securityApi.listUsers({ limit: 100 }),
    []
  );

  const response = users.data;
  const allUsers = Array.isArray(response)
    ? response
    : response?.users || response?.data || response?.records || response?.rows || response?.items || [];

  // Some user-list responses expose status as ACTIVE/active; normalize it.
  // If the endpoint does not include a status field, keep the record so an
  // existing user can still be selected.
  const activeUsers = allUsers.filter((u) => {
    const status = String(u.status ?? '').trim().toUpperCase();
    return !status || status === 'ACTIVE';
  });

  if (users.error) {
    return <TextField id="userId" label={label} placeholder="Paste the user UUID" value={value} onChange={(e) => onChange(e.target.value)} error={error} hint="The current role cannot read users, so enter an existing user UUID." />;
  }

  return <SelectField
    id="userId"
    label={label}
    placeholder={users.loading ? 'Loading users...' : activeUsers.length ? 'Choose user' : 'No active users found'}
    options={activeUsers.map((u) => ({
      value: u.id,
      label: `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || u.email || u.id
    }))}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    error={error}
    disabled={users.loading || activeUsers.length === 0}
  />;
}

export function VendorPicker({ value, onChange, error }) {
  const { societyId } = useSociety();
  const vendors = useFetch(() => securityApi.listVendors({ societyId, limit: 100 }), [societyId]);
  const list = vendors.data?.vendors || vendors.data || [];
  if (vendors.error) {
    return <TextField id="vendorId" label="Agency vendor (optional)" placeholder="Paste vendor UUID if needed" value={value || ''} onChange={(e) => onChange(e.target.value || null)} error={error} hint="Vendor lookup is unavailable for the current role; this field is optional." />;
  }
  return <SelectField id="vendorId" label="Agency vendor (optional)" placeholder={vendors.loading ? 'Loading vendors...' : 'No agency vendor'} options={list.map((v) => ({ value: v.id, label: v.legal_name || v.name || v.id }))} value={value || ''} onChange={(e) => onChange(e.target.value || null)} error={error} disabled={vendors.loading} />;
}

export function GatePicker({ gates, value, onChange, error }) {
  return <SelectField id="gateId" label="Gate" placeholder="Choose gate" options={(gates || []).map((g) => ({ value: g.id, label: `${g.name} (${g.gate_type || g.gateType || ''})` }))} value={value} onChange={(e) => onChange(e.target.value)} error={error} />;
}

export function VisitorPicker({ profiles, value, onChange, error }) {
  return <SelectField id="visitorProfileId" label="Visitor" placeholder="Choose visitor" options={(profiles || []).map((p) => ({ value: p.id, label: `${p.name}${p.phone ? ` - ${p.phone}` : ''}` }))} value={value} onChange={(e) => onChange(e.target.value)} error={error} />;
}

export function InvitePicker({ invites, value, onChange, error }) {
  return <SelectField id="inviteId" label="Approved invite (optional)" placeholder="Walk-in / no invite" options={(invites || []).filter((i) => i.status === 'APPROVED').map((i) => ({ value: i.id, label: `${i.id.slice(0, 8)} - ${i.purpose || 'Approved invite'}` }))} value={value || ''} onChange={(e) => onChange(e.target.value || null)} error={error} />;
}

export function DeliveryPicker({ deliveries, value, onChange, error }) {
  return <SelectField id="deliveryId" label="Delivery" placeholder="Choose delivery" options={(deliveries || []).map((d) => ({ value: d.id, label: `${d.delivery_type || d.deliveryType} - ${d.tracking_no || d.trackingNo || 'No tracking'}` }))} value={value} onChange={(e) => onChange(e.target.value)} error={error} />;
}

export function ErrorBox({ error }) {
  return error ? <div className="form-error">{getErrorMessage(error)}</div> : null;
}
