import { NavLink } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';

const TABS = [
  { label: 'Vehicles', to: '/vehicles', permission: 'VEHICLE_READ', end: true },
  { label: 'Gate log', to: '/vehicles/visits', permission: 'PARKING_VISIT_READ' },
];

export default function VehiclesTabs() {
  const { hasPermission } = useAuth();

  return (
    <div className="tabs-bar">
      <nav className="tabs" aria-label="Vehicle sections">
        {TABS.filter((tab) => hasPermission(tab.permission)).map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
