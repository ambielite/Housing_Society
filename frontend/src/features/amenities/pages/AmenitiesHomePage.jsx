import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CalendarDays, Clock3, RefreshCw, Sparkles, TicketCheck,
} from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import AmenityTabs from '../components/AmenityTabs';
import * as api from '../api/amenities.api';

export default function AmenitiesHomePage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const canReadAmenities = hasPermission('AMENITY_READ');
  const canReadSlots = hasPermission('AMENITY_SLOT_READ');
  const canReadBookings = hasPermission('AMENITY_BOOKING_READ');

  const amenities = useFetch(
    () => (societyId && canReadAmenities ? api.listAmenities({ societyId }) : Promise.resolve(null)),
    [societyId, canReadAmenities]
  );
  const slots = useFetch(
    () => (canReadSlots ? api.listSlots({ status: 'AVAILABLE' }) : Promise.resolve(null)),
    [canReadSlots]
  );
  const confirmedBookings = useFetch(
    () => (societyId && canReadBookings ? api.listBookings({ societyId, status: 'CONFIRMED' }) : Promise.resolve(null)),
    [societyId, canReadBookings]
  );
  const pendingBookings = useFetch(
    () => (societyId && canReadBookings ? api.listBookings({ societyId, status: 'PENDING_PAYMENT' }) : Promise.resolve(null)),
    [societyId, canReadBookings]
  );

  const amenityIds = useMemo(() => new Set((amenities.data || []).map((item) => item.id)), [amenities.data]);
  const societySlots = useMemo(
    () => (slots.data || []).filter((slot) => !canReadAmenities || amenityIds.has(slot.amenity_id)),
    [slots.data, amenityIds, canReadAmenities]
  );
  const error = amenities.error || slots.error || confirmedBookings.error || pendingBookings.error;
  const loading = amenities.loading || slots.loading || confirmedBookings.loading || pendingBookings.loading;
  const refresh = () => {
    amenities.reload();
    slots.reload();
    confirmedBookings.reload();
    pendingBookings.reload();
  };

  if (!societyId && canReadAmenities) {
    return (
      <section className="society-dashboard security-page amenities-page">
        <header className="society-heading"><div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> COMMUNITY FACILITIES</div><h1>Amenities & booking</h1><p>Manage facilities, availability, and resident reservations.</p></div></header>
        <AmenityTabs />
        <SocietyIdPrompt />
      </section>
    );
  }

  const metrics = [
    ...(canReadAmenities ? [[
      'Active amenities', (amenities.data || []).filter((item) => item.status === 'ACTIVE').length,
      Building2, 'violet', '/amenities/list', 'Manage facilities', amenities.loading,
    ]] : []),
    ...(canReadSlots ? [[
      'Available slots', societySlots.length, Clock3, 'green', '/amenities/slots', 'View availability', slots.loading || amenities.loading,
    ]] : []),
    ...(canReadBookings ? [[
      'Confirmed bookings', (confirmedBookings.data || []).length, CalendarDays, 'blue', '/amenities/bookings', 'Open bookings', confirmedBookings.loading,
    ], [
      'Pending payments', (pendingBookings.data || []).length, TicketCheck, 'orange', '/amenities/bookings', 'Review bookings', pendingBookings.loading,
    ]] : []),
  ];

  return (
    <section className="society-dashboard security-page amenities-page">
      <header className="society-heading">
        <div><div className="society-eyebrow"><span className="society-eyebrow-dot" /> COMMUNITY FACILITIES</div><h1>Amenities & booking</h1><p>Manage facilities, availability, and resident reservations.</p></div>
        <button className="society-add-button" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </header>
      <AmenityTabs />
      {error && <div className="society-error" role="alert">{getErrorMessage(error)}<button onClick={refresh}>Try again</button></div>}

      <div className="society-stats amenities-summary-grid">
        {metrics.map(([label, count, Icon, color, path, note, isLoading]) => (
          <button type="button" className={`society-stat-card security-summary-card security-summary-${color}`} key={label} onClick={() => navigate(path)}>
            <span className={`society-stat-icon society-stat-icon-${color}`}><Icon size={19} /></span>
            <div><span className="society-stat-label">{label}</span><small className="society-stat-note security-summary-note">{note} →</small><strong>{isLoading ? '—' : count}</strong></div>
          </button>
        ))}
      </div>

    </section>
  );
}
