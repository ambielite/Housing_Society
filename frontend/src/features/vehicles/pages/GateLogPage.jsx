import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime, formatDuration, shortId } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vehiclesApi from '../api/vehicles.api';
import * as parkingApi from '../../parking/api/parking.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import VehiclesTabs from '../components/VehiclesTabs';
import LogEntryForm from '../components/LogEntryForm';
import { VisitStatusBadge } from '../components/VehicleBadges';

export default function GateLogPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [statusFilter, setStatusFilter] = useState('');

  const canSeeVehicles = hasPermission('VEHICLE_READ');
  const canSeeSlots = hasPermission('PARKING_SLOT_READ') && hasPermission('PARKING_AREA_READ');

  const visits = useFetch(
    () => (societyId ? vehiclesApi.listVisits({ societyId, status: statusFilter }) : Promise.resolve(null)),
    [societyId, statusFilter]
  );
  // "Who is inside" is needed to know which slots are free, whatever the filter says.
  const insideNow = useFetch(
    () => (societyId ? vehiclesApi.listVisits({ societyId, status: 'INSIDE' }) : Promise.resolve(null)),
    [societyId]
  );
  // Vehicles, slots and areas are only used to show names instead of IDs and to fill the entry form.
  const vehicles = useFetch(
    () => (societyId && canSeeVehicles ? vehiclesApi.listVehicles({ societyId, limit: 100 }) : Promise.resolve(null)),
    [societyId, canSeeVehicles]
  );
  const slots = useFetch(() => (societyId && canSeeSlots ? parkingApi.listSlots() : Promise.resolve(null)), [societyId, canSeeSlots]);
  const areas = useFetch(() => (societyId && canSeeSlots ? parkingApi.listAreas({ societyId }) : Promise.resolve(null)), [societyId, canSeeSlots]);

  const [showEntry, setShowEntry] = useState(false);
  const [exiting, setExiting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  const canLogEntry = hasPermission('PARKING_VISIT_CREATE');
  const entryButton = canLogEntry && (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => {
        setSaveError('');
        setNotice('');
        setPageError('');
        setShowEntry(true);
      }}
    >
      Log entry
    </button>
  );

  if (!societyId) {
    return (
      <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log.">
        <VehiclesTabs />
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const vehicleList = vehicles.data ? vehicles.data.vehicles : [];
  const vehicleById = new Map(vehicleList.map((v) => [v.id, v]));
  const areaById = new Map((areas.data || []).map((a) => [a.id, a]));
  const societySlots = (slots.data || []).filter((s) => areaById.has(s.parking_area_id));
  const slotById = new Map(societySlots.map((s) => [s.id, s]));

  const occupiedSlotIds = new Set((insideNow.data || []).map((v) => v.slot_id));
  const slotOptions = societySlots
    .filter((s) => s.status === 'ACTIVE' && !occupiedSlotIds.has(s.id))
    .map((s) => ({ value: s.id, label: `${s.slot_code} - ${areaById.get(s.parking_area_id)?.name || 'Unknown area'}` }));
  const vehicleOptions = vehicleList
    .filter((v) => v.status === 'ACTIVE')
    .map((v) => ({ value: v.id, label: `${v.registration_no}${v.make ? ` - ${v.make}` : ''}` }));

  const refresh = () => {
    visits.reload();
    insideNow.reload();
  };

  const saveEntry = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vehiclesApi.logEntry({ ...payload, societyId });
      setShowEntry(false);
      setNotice('Entry logged.');
      refresh();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmExit = async () => {
    setSaving(true);
    try {
      await vehiclesApi.logExit(exiting.id);
      setNotice('Exit logged. The slot is free again.');
      refresh();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setExiting(null);
    }
  };

  const whoLabel = (visit) => {
    if (visit.vehicle_id) return vehicleById.get(visit.vehicle_id)?.registration_no || `Vehicle ${shortId(visit.vehicle_id)}`;
    return `Visitor ${shortId(visit.visitor_id)}`;
  };

  const columns = [
    {
      key: 'who',
      header: 'Vehicle',
      render: (visit) => (
        <>
          <span className="cell-title">{whoLabel(visit)}</span>
          {!visit.vehicle_id && <span className="cell-sub">Visitor</span>}
        </>
      ),
    },
    {
      key: 'slot',
      header: 'Slot',
      render: (visit) => {
        const slot = slotById.get(visit.slot_id);
        return slot ? (
          <>
            <span className="cell-title">{slot.slot_code}</span>
            <span className="cell-sub">{areaById.get(slot.parking_area_id)?.name}</span>
          </>
        ) : (
          <span className="mono">{shortId(visit.slot_id)}</span>
        );
      },
    },
    { key: 'entry', header: 'Entered', render: (visit) => formatDateTime(visit.entry_at) },
    { key: 'exit', header: 'Exited', render: (visit) => formatDateTime(visit.exit_at) },
    { key: 'duration', header: 'Time inside', render: (visit) => (visit.exit_at ? formatDuration(visit.entry_at, visit.exit_at) : '-') },
    { key: 'status', header: 'Status', render: (visit) => <VisitStatusBadge status={visit.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (visit) =>
        visit.status === 'INSIDE' && hasPermission('PARKING_VISIT_UPDATE') ? (
          <div className="row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExiting(visit)}>
              Log exit
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log." actions={entryButton}>
      <VehiclesTabs />
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <div className="toolbar">
        <select className="input toolbar-select" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="INSIDE">Inside</option>
          <option value="EXITED">Exited</option>
          <option value="OVERSTAY">Overstay</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={visits.data}
        loading={visits.loading}
        error={visits.error ? getErrorMessage(visits.error) : ''}
        onRetry={visits.reload}
        emptyTitle={statusFilter ? 'No entries with this status' : 'No gate activity yet'}
        emptyMessage={statusFilter ? 'Try a different status.' : 'Log a vehicle entry to start the gate log.'}
        emptyAction={
          statusFilter ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStatusFilter('')}>
              Clear filter
            </button>
          ) : (
            entryButton || null
          )
        }
      />

      {showEntry && (
        <Modal title="Log vehicle entry" onClose={() => setShowEntry(false)} busy={saving}>
          <LogEntryForm
            vehicleOptions={vehicleOptions}
            slotOptions={slotOptions}
            onSubmit={saveEntry}
            onCancel={() => setShowEntry(false)}
            saving={saving}
            error={saveError}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(exiting)}
        title="Log this exit?"
        message={`${exiting ? whoLabel(exiting) : ''} will be marked as exited and the slot becomes free.`}
        confirmLabel="Log exit"
        busy={saving}
        onConfirm={confirmExit}
        onCancel={() => setExiting(null)}
      />
    </PageContainer>
  );
}
