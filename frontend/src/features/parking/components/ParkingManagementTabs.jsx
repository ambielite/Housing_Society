import { Activity, ChartNoAxesCombined, CarFront, Layers3, ParkingSquare, Warehouse } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';

const TABS = [
  { label: 'Overview', key: 'overview', permission: ['PARKING_AREA_READ', 'PARKING_SLOT_READ', 'PARKING_ALLOCATION_READ', 'VEHICLE_READ'], Icon: ChartNoAxesCombined },
  { label: 'Areas', key: 'areas', permission: 'PARKING_AREA_READ', Icon: Warehouse },
  { label: 'Slots', key: 'slots', permission: 'PARKING_SLOT_READ', Icon: ParkingSquare },
  { label: 'Allocations', key: 'allocations', permission: 'PARKING_ALLOCATION_READ', Icon: Layers3 },
  { label: 'Vehicles', key: 'vehicles', permission: 'VEHICLE_READ', Icon: CarFront },
  { label: 'Gate log', key: 'gate-log', permission: 'PARKING_VISIT_READ', Icon: Activity },
];

export default function ParkingManagementTabs({ active = 'overview', onChange = () => {} }) {
  const { hasAnyPermission } = useAuth();

  return (
    <nav className="security-tabs parking-management-tabs" aria-label="Parking management sections">
      {TABS.filter((tab) => hasAnyPermission(tab.permission)).map(({ label, key, Icon }) => (
        <button key={key} type="button" className={active === key ? 'active' : ''} onClick={() => onChange(key)} aria-current={active === key ? 'page' : undefined}>
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
