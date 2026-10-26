import { Link, useSearchParams } from 'react-router-dom';
import { ChartNoAxesCombined, CircleCheck, LayoutGrid, ParkingSquare } from 'lucide-react';
import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import PageContainer from '../../../components/layout/PageContainer';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import ParkingManagementTabs from '../components/ParkingManagementTabs';
import AreaListPage from './AreaListPage';
import SlotListPage from './SlotListPage';
import AllocationListPage from './AllocationListPage';
import VehicleListPage from '../../vehicles/pages/VehicleListPage';
import GateLogPage from '../../vehicles/pages/GateLogPage';
import * as parkingApi from '../api/parking.api';
import * as vehiclesApi from '../../vehicles/api/vehicles.api';

const rows = (value, key) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (value?.data) return rows(value.data, key);
  return [];
};

const listAllVehicles = async (societyId) => {
  const firstPage = await vehiclesApi.listVehicles({ societyId, limit: 100, page: 1 });
  const totalPages = firstPage?.pagination?.totalPages || 1;
  if (totalPages <= 1) return firstPage;
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => vehiclesApi.listVehicles({ societyId, limit: 100, page: index + 2 }))
  );
  return { ...firstPage, vehicles: [...rows(firstPage, 'vehicles'), ...remainingPages.flatMap((page) => rows(page, 'vehicles'))] };
};

export default function ParkingHomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const vehicleAction = searchParams.get('action');
  const activeSection = ['overview', 'areas', 'slots', 'allocations', 'vehicles', 'gate-log'].includes(requestedTab) ? requestedTab : 'overview';
  const setActiveSection = (tab) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    return next;
  });
  const clearVehicleAction = () => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    next.delete('action');
    return next;
  }, { replace: true });
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const canSeeAreas = hasPermission('PARKING_AREA_READ');
  const canSeeSlots = hasPermission('PARKING_SLOT_READ');
  const canSeeAllocations = hasPermission('PARKING_ALLOCATION_READ');
  const canSeeVehicles = hasPermission('VEHICLE_READ');

  const areas = useFetch(
    () => (societyId && canSeeAreas ? parkingApi.listAreas({ societyId }) : Promise.resolve([])),
    [societyId, canSeeAreas]
  );
  const slots = useFetch(
    () => (societyId && canSeeSlots && canSeeAreas ? parkingApi.listSlots() : Promise.resolve([])),
    [societyId, canSeeSlots, canSeeAreas]
  );
  const allocations = useFetch(
    () => (societyId && canSeeAllocations ? parkingApi.listAllocations({ status: 'ACTIVE' }) : Promise.resolve([])),
    [societyId, canSeeAllocations]
  );
  const vehicles = useFetch(
    () => (societyId && canSeeVehicles ? listAllVehicles(societyId) : Promise.resolve([])),
    [societyId, canSeeVehicles]
  );

  if (!societyId) {
    return (
      <PageContainer className="parking-management-page" eyebrow="PARKING OPERATIONS" title="Parking Management" subtitle="Manage parking areas, spaces, and occupancy.">
        <ParkingManagementTabs active={activeSection} onChange={setActiveSection} />
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const areaRows = rows(areas.data, 'areas');
  const areaIds = new Set(areaRows.map((area) => area.id));
  const slotRows = rows(slots.data, 'slots').filter((slot) => areaIds.has(slot.parking_area_id));
  const activeSlots = slotRows.filter((slot) => slot.status === 'ACTIVE');
  const activeAllocations = rows(allocations.data, 'allocations').filter((allocation) => allocation.status === 'ACTIVE');
  const vehicleRows = rows(vehicles.data, 'vehicles');
  const occupiedIds = new Set(activeAllocations.map((allocation) => allocation.slot_id));
  const total = slotRows.length;
  const occupied = activeSlots.filter((slot) => occupiedIds.has(slot.id)).length;
  const available = activeSlots.length - occupied;
  const loading = areas.loading || (canSeeSlots && slots.loading) || (canSeeAllocations && allocations.loading) || (canSeeVehicles && vehicles.loading);
  const occupancy = activeSlots.length ? Math.round((occupied / activeSlots.length) * 100) : 0;
  const occupiedAngle = occupancy * 3.6;
  const areaBreakdown = areaRows.map((area) => {
    const areaSlots = slotRows.filter((slot) => slot.parking_area_id === area.id && slot.status === 'ACTIVE');
    const areaOccupied = areaSlots.filter((slot) => occupiedIds.has(slot.id)).length;
    return { id: area.id, name: area.name, total: areaSlots.length, occupied: areaOccupied, available: areaSlots.length - areaOccupied };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const vehicleBreakdown = [
    { label: 'Two-wheelers', type: 'TWO_WHEELER', color: '#6854e8' },
    { label: 'Four-wheelers', type: 'FOUR_WHEELER', color: '#269c69' },
    { label: 'EVs', type: 'EV', color: '#e09a24' },
    { label: 'Other', type: 'OTHER', color: '#3182ce' },
  ].map((type) => ({ ...type, count: vehicleRows.filter((vehicle) => vehicle.vehicle_type === type.type).length }));
  const vehicleTotal = vehicleRows.length;

  const cards = [
    { label: 'Total slots', value: total, note: `In ${areaRows.length} parking areas`, tab: 'slots', Icon: LayoutGrid },
    { label: 'Slots available', value: available, note: 'Active spaces not currently allocated', tab: 'slots', Icon: CircleCheck },
    { label: 'Slots occupied', value: occupied, note: 'Currently allocated spaces', tab: 'allocations', Icon: ParkingSquare },
    { label: 'Occupancy', value: `${occupancy}%`, note: `${occupied} of ${activeSlots.length} active slots`, tab: 'allocations', Icon: ChartNoAxesCombined },
  ];

  return (
    <PageContainer className="parking-management-page" eyebrow="PARKING OPERATIONS" title="Parking Management" subtitle="Manage parking areas, spaces, and occupancy.">
      <ParkingManagementTabs active={activeSection} onChange={setActiveSection} />
      {activeSection === 'overview' && <div className="parking-overview">
        <div className="society-stats parking-overview-stats">
          {cards.map(({ label, value, note, tab, Icon }) => (
            <Link to={`/parking?tab=${tab}`} className="society-stat-card parking-overview-card" key={label}>
              <span className="society-stat-icon"><Icon size={19} /></span>
              <div>
                <span className="society-stat-label">{label}</span>
                <strong>{loading ? '—' : value}</strong>
                <small className="parking-overview-note">{note}</small>
              </div>
            </Link>
          ))}
        </div>
        <div className="parking-analytics-grid">
          <section className="parking-analytics-panel parking-occupancy-panel" aria-labelledby="parking-occupancy-title">
            <div className="parking-analytics-heading">
              <div><span className="parking-analytics-kicker">LIVE CAPACITY</span><h2 id="parking-occupancy-title">Space utilization</h2><p>Occupied and available active slots.</p></div>
              <span className="parking-live-indicator"><i /> Current data</span>
            </div>
            <div className="parking-occupancy-content">
              <div
                className="parking-donut-chart"
                role="img"
                aria-label={`${occupied} of ${activeSlots.length} active parking slots are occupied`}
                style={{ background: activeSlots.length ? `conic-gradient(#6854e8 0deg ${occupiedAngle}deg, #28a66a ${occupiedAngle}deg 360deg)` : 'conic-gradient(#e5eaf2 0deg 360deg)' }}
              >
                <div className="parking-donut-center"><strong>{loading ? '—' : `${occupancy}%`}</strong><span>occupied</span></div>
              </div>
              <div className="parking-chart-legend">
                <div><span className="parking-legend-dot is-occupied"/><span>Occupied</span><strong>{loading ? '—' : occupied}</strong></div>
                <div><span className="parking-legend-dot is-available"/><span>Available</span><strong>{loading ? '—' : available}</strong></div>
                <small>Based on {loading ? '—' : activeSlots.length} active slots</small>
              </div>
            </div>
          </section>

          <section className="parking-analytics-panel parking-area-panel" aria-labelledby="parking-area-title">
            <div className="parking-analytics-heading">
              <div><span className="parking-analytics-kicker">AREA BREAKDOWN</span><h2 id="parking-area-title">Capacity by parking area</h2><p>Live active-slot availability in each area.</p></div>
              <Link to="/parking?tab=areas" className="parking-chart-link">Manage areas <span aria-hidden="true">→</span></Link>
            </div>
            <div className="parking-area-chart">
              {areaBreakdown.length ? areaBreakdown.slice(0, 5).map((area) => (
                <div className="parking-area-row" key={area.id}>
                  <div className="parking-area-row-label"><strong>{area.name}</strong><span>{area.occupied} / {area.total} occupied</span></div>
                  <div className="parking-area-track" role="img" aria-label={`${area.name}: ${area.occupied} occupied, ${area.available} available`}>
                    <span className="parking-area-occupied" style={{ width: `${area.total ? (area.occupied / area.total) * 100 : 0}%` }} />
                    <span className="parking-area-available" style={{ width: `${area.total ? (area.available / area.total) * 100 : 0}%` }} />
                  </div>
                </div>
              )) : <div className="parking-chart-empty">{loading ? 'Loading parking areas…' : 'Add a parking area and active slots to see the breakdown.'}</div>}
            </div>
            <div className="parking-area-legend"><span><i className="is-occupied"/>Occupied</span><span><i className="is-available"/>Available</span></div>
          </section>

          {canSeeVehicles && <section className="parking-analytics-panel parking-vehicle-panel" aria-labelledby="parking-vehicle-title">
            <div className="parking-analytics-heading">
              <div><span className="parking-analytics-kicker">VEHICLE REGISTER · LIVE</span><h2 id="parking-vehicle-title">Registered vehicle mix</h2><p>Live count of vehicles registered in this society.</p></div>
              <Link to="/parking?tab=vehicles" className="parking-chart-link">View vehicles <span aria-hidden="true">→</span></Link>
            </div>
            <div className="parking-vehicle-chart">
              <div className="parking-vehicle-total"><strong>{vehicles.loading ? '—' : vehicleTotal}</strong><span>registered vehicles</span></div>
              <div className="parking-vehicle-distribution" role="img" aria-label={vehicleBreakdown.map((item) => `${item.label}: ${item.count}`).join(', ')}>
                {vehicleTotal ? vehicleBreakdown.filter((item) => item.count > 0).map((item) => (
                  <span key={item.type} title={`${item.label}: ${item.count}`} style={{ width: `${(item.count / vehicleTotal) * 100}%`, background: item.color }} />
                )) : <span className="parking-vehicle-empty-segment" />}
              </div>
              <div className="parking-vehicle-legend">
                {vehicleBreakdown.map((item) => <div key={item.type}><span style={{ background: item.color }} /><span>{item.label}</span><strong>{vehicles.loading ? '—' : item.count}</strong></div>)}
              </div>
            </div>
          </section>}
        </div>
      </div>}
      {activeSection !== 'overview' && <section className="parking-tab-content">
        <header className="parking-tab-content-heading">
          <div>
            <h2>{({ areas: 'Parking areas', slots: 'Parking slots', allocations: 'Parking allocations', vehicles: 'Vehicles', 'gate-log': 'Vehicle gate log' })[activeSection]}</h2>
            <p>{({ areas: 'Manage parking zones and their capacity.', slots: 'Review available, occupied, and visitor parking slots.', allocations: 'Review active and historical parking allocations.', vehicles: 'Manage registered vehicles and their access details.', 'gate-log': 'Track vehicle and visitor entries and exits.' })[activeSection]}</p>
          </div>
        </header>
        <div className="parking-tab-content-body">
          {activeSection === 'areas' && <AreaListPage embedded searchTerm={searchInput} searchValue={searchInput} onSearchChange={setSearchInput} />}
          {activeSection === 'slots' && <SlotListPage embedded searchTerm={searchInput} searchValue={searchInput} onSearchChange={setSearchInput} />}
          {activeSection === 'allocations' && <AllocationListPage embedded searchTerm={searchInput} searchValue={searchInput} onSearchChange={setSearchInput} />}
          {activeSection === 'vehicles' && <VehicleListPage embedded searchTerm={searchInput} searchValue={searchInput} onSearchChange={setSearchInput} records={vehicleRows} recordsLoading={vehicles.loading} onDataChange={vehicles.reload} openCreateRequest={vehicleAction === 'new'} onCreateRequestHandled={clearVehicleAction} />}
          {activeSection === 'gate-log' && <GateLogPage embedded searchTerm={searchInput} searchValue={searchInput} onSearchChange={setSearchInput} />}
        </div>
      </section>}
    </PageContainer>
  );
}
