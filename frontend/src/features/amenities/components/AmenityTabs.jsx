import { NavLink } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Clock3, Sparkles } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';

const TABS = [
  { label: 'Overview', to: '/amenities', permissions: ['AMENITY_READ', 'AMENITY_SLOT_READ', 'AMENITY_BOOKING_READ'], Icon: Sparkles },
  { label: 'Amenities', to: '/amenities/list', permissions: ['AMENITY_READ'], Icon: CalendarDays },
  { label: 'Slots', to: '/amenities/slots', permissions: ['AMENITY_SLOT_READ'], Icon: Clock3 },
  { label: 'Bookings', to: '/amenities/bookings', permissions: ['AMENITY_BOOKING_READ'], Icon: ClipboardCheck },
];

export default function AmenityTabs() {
  const { hasAnyPermission } = useAuth();

  return (
    <nav className="security-tabs amenities-tabs" aria-label="Amenities sections">
        {TABS.filter((tab) => hasAnyPermission(tab.permissions)).map(({ Icon, ...tab }) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/amenities'}
            className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
          >
            <Icon size={16} aria-hidden="true" />
            {tab.label}
          </NavLink>
        ))}
    </nav>
  );
}
