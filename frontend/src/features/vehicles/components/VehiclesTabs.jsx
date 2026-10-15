import { NavLink } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import { shortId } from '../../../utils/format';

const TABS = [
  { label: 'Vehicles', to: '/vehicles', permission: 'VEHICLE_READ', end: true },
  { label: 'Gate log', to: '/vehicles/visits', permission: 'PARKING_VISIT_READ' },
];

export default function VehiclesTabs() {
  const { user, hasPermission } = useAuth();
  const { societyId, setSocietyId } = useSociety();
  // Only accounts without their own society pick one by hand (see SocietyIdPrompt).
  const pickedByHand = Boolean(societyId) && !user?.society_id;

  return (
    <div className="tabs-bar">
      <nav className="tabs" aria-label="Vehicle sections">
        {TABS.filter((tab) => hasPermission(tab.permission)).map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {pickedByHand && (
        <span className="muted tabs-note">
          Society <span className="mono">{shortId(societyId)}</span>{' '}
          <button type="button" className="link-button" onClick={() => setSocietyId(null)}>
            Change
          </button>
        </span>
      )}
    </div>
  );
}
