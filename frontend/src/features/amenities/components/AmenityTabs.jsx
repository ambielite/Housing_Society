import { NavLink } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';

const TABS = [
  { label: 'Overview', to: '/amenities', permissions: ['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ'] },
  { label: 'Amenities', to: '/amenities/list', permissions: ['AMENITY_READ'] },
  { label: 'Slots', to: '/amenities/slots', permissions: ['AMENITY_SLOT_READ'] },
  { label: 'Bookings', to: '/amenities/bookings', permissions: ['AMENITY_BOOKING_READ'] },
];

export default function AmenityTabs() {
  const { hasAnyPermission } = useAuth();

  return (
    <div className="tabs-bar">
      <nav className="tabs" aria-label="Amenities sections">
        {TABS.filter((tab) => hasAnyPermission(tab.permissions)).map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/amenities'}
            className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
