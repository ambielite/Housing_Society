import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const PAGE_SIZE = 10;

export default function VehicleListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [status, setStatus] = useState('');
  const [unitId, setUnitId] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    () => (societyId ? vehiclesApi.listVehicles({ societyId, status, unitId, page, limit: PAGE_SIZE }) : Promise.resolve(null)),
    [societyId, status, unitId, page]
  );

  const newButton = hasPermission('VEHICLE_CREATE') && (
    <Link to="/vehicles/new" className="btn btn-primary">
      Register vehicle
    </Link>
  );

  if (!societyId) {
    return (
      <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log.">
        <VehiclesTabs />
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const filtersActive = Boolean(status || unitId);

  const columns = [
    {
      key: 'registration',
      header: 'Vehicle',
      render: (vehicle) => (
        <>
          <Link to={`/vehicles/${vehicle.id}`} className="cell-title">
            {vehicle.registration_no}
          </Link>
          {(vehicle.make || vehicle.model) && <span className="cell-sub">{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</span>}
        </>
      ),
    },
    { key: 'type', header: 'Type', render: (vehicle) => labelOf(VEHICLE_TYPES, vehicle.vehicle_type) },
    { key: 'color', header: 'Colour', render: (vehicle) => vehicle.color || '-' },
    { key: 'unit', header: 'Unit', render: (vehicle) => <UnitLabel unitId={vehicle.unit_id} /> },
    { key: 'status', header: 'Status', render: (vehicle) => <VehicleStatusBadge status={vehicle.status} /> },
  ];

  return (
    <PageContainer title="Vehicles" subtitle="Registered vehicles, their access credentials and the gate log." actions={newButton}>
      <VehiclesTabs />

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
        rows={data ? data.vehicles : null}
        loading={loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={filtersActive ? 'No vehicles match these filters' : 'No vehicles registered yet'}
        emptyMessage={filtersActive ? 'Try a different status or unit.' : 'Register a vehicle to see it here.'}
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
        pagination={data ? { ...data.pagination, onPageChange: setPage } : null}
      />
    </PageContainer>
  );
}
