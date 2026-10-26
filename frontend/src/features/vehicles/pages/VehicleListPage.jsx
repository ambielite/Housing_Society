import { useEffect, useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as vehiclesApi from '../api/vehicles.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import UnitLabel from '../../../components/ui/UnitLabel';
import UnitFilter from '../../../components/ui/UnitFilter';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import VehiclesTabs from '../components/VehiclesTabs';
import { VehicleStatusBadge } from '../components/VehicleBadges';
import { VEHICLE_STATUSES, VEHICLE_TYPES, labelOf } from '../components/vehicleOptions';
import Modal from '../../../components/ui/Modal';
import VehicleForm from '../components/VehicleForm';
import { Pencil, Plus } from 'lucide-react';
import { filterRecords } from '../../parking/utils/searchRecords';
import ParkingSearchToolbar from '../../parking/components/ParkingSearchToolbar';

const PAGE_SIZE = 10;

export default function VehicleListPage({ embedded = false, searchTerm = '', searchValue = '', onSearchChange, records = null, recordsLoading = false, onDataChange, openCreateRequest = false, onCreateRequestHandled }) {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [status, setStatus] = useState('');
  const [unitId, setUnitId] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (openCreateRequest) {
      setSubmitError('');
      setShowCreate(true);
      onCreateRequestHandled?.();
    }
  }, [openCreateRequest, onCreateRequestHandled]);

  const { data, loading, error, reload } = useFetch(
    () => (societyId && !records ? vehiclesApi.listVehicles({ societyId, status, unitId, page, limit: PAGE_SIZE }) : Promise.resolve(null)),
    [societyId, status, unitId, page, records]
  );

  const newButton = hasPermission('VEHICLE_CREATE') && (
    <button type="button" className="btn btn-primary" onClick={() => { setSubmitError(''); setShowCreate(true); }}>
      <Plus size={16} aria-hidden="true" /> Register vehicle
    </button>
  );

  const createVehicle = async (payload) => {
    setSaving(true);
    setSubmitError('');
    try {
      await vehiclesApi.createVehicle({ ...payload, societyId });
      setShowCreate(false);
      setSaving(false);
      if (onDataChange) onDataChange();
      else reload();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const updateVehicle = async (payload) => {
    setSaving(true);
    setSubmitError('');
    try {
      await vehiclesApi.updateVehicle(editingVehicle.id, payload);
      setEditingVehicle(null);
      if (onDataChange) onDataChange();
      else reload();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!societyId) {
    return (
      <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log." hideHeader={embedded}>
        {!embedded && <VehiclesTabs />}
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const filtersActive = Boolean(status || unitId);
  const visibleVehicles = filterRecords(
    (records || data?.vehicles || []).filter((vehicle) => (!status || vehicle.status === status) && (!unitId || vehicle.unit_id === unitId)),
    searchTerm,
    (vehicle) => `${vehicle.registration_no || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.vehicle_type || ''} ${vehicle.color || ''} ${vehicle.unit_id || ''} ${vehicle.status || ''}`
  );

  const columns = [
    {
      key: 'registration',
      header: 'Vehicle',
      render: (vehicle) => (
        <>
          <span className="cell-title">{vehicle.registration_no}</span>
          {(vehicle.make || vehicle.model) && <span className="cell-sub">{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</span>}
        </>
      ),
    },
    { key: 'type', header: 'Type', render: (vehicle) => labelOf(VEHICLE_TYPES, vehicle.vehicle_type) },
    { key: 'color', header: 'Colour', render: (vehicle) => vehicle.color || '-' },
    { key: 'unit', header: 'Unit', render: (vehicle) => <UnitLabel unitId={vehicle.unit_id} /> },
    { key: 'status', header: 'Status', render: (vehicle) => <VehicleStatusBadge status={vehicle.status} /> },
    ...(hasPermission('VEHICLE_UPDATE') ? [{
      key: 'actions',
      header: 'Actions',
      render: (vehicle) => (
        <div className="row-actions">
          <button type="button" className="table-action-button" aria-label={`Edit ${vehicle.registration_no}`} title="Edit" onClick={() => { setSubmitError(''); setEditingVehicle(vehicle); }}>
            <Pencil size={17} aria-hidden="true" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log." actions={embedded ? null : newButton} hideHeader={embedded}>
      {!embedded && <VehiclesTabs />}
      {embedded && <ParkingSearchToolbar value={searchValue} onChange={onSearchChange} placeholder="Search registration, make, model, unit, and status…" action={newButton} />}

      <div className="toolbar">
        <select
          className="input toolbar-select"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {VEHICLE_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <UnitFilter
          value={unitId}
          onChange={(value) => {
            setUnitId(value);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        tableClassName="parking-vehicle-table"
        rows={records || data ? visibleVehicles : null}
        loading={records ? recordsLoading : loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={searchTerm ? 'No matching vehicles' : filtersActive ? 'No vehicles match these filters' : 'No vehicles registered yet'}
        emptyMessage={searchTerm ? 'Try a registration number, make, model, vehicle type, unit, or status.' : filtersActive ? 'Try a different status or unit.' : 'Register a vehicle to see it here.'}
        emptyAction={
          filtersActive ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStatus('');
                setUnitId('');
                setPage(1);
              }}
            >
              Clear filters
            </button>
          ) : (
            newButton || null
          )
        }
        pagination={!records && data ? { ...data.pagination, onPageChange: setPage } : null}
      />
      {showCreate && (
        <Modal title="Register vehicle" onClose={() => !saving && setShowCreate(false)} busy={saving}>
          <VehicleForm
            mode="create"
            onSubmit={createVehicle}
            onCancel={() => setShowCreate(false)}
            saving={saving}
            error={submitError}
          />
        </Modal>
      )}
      {editingVehicle && (
        <Modal title={`Edit ${editingVehicle.registration_no}`} onClose={() => !saving && setEditingVehicle(null)} busy={saving}>
          <VehicleForm
            mode="edit"
            vehicle={editingVehicle}
            onSubmit={updateVehicle}
            onCancel={() => setEditingVehicle(null)}
            saving={saving}
            error={submitError}
          />
        </Modal>
      )}
    </PageContainer>
  );
}
