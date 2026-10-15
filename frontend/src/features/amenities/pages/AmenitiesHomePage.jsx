import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Building2, Clock3 } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import AmenityTabs from '../components/AmenityTabs';
import * as api from '../api/amenities.api';

export default function AmenitiesHomePage() {
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
  const bookings = useFetch(
    () => (canReadBookings ? api.listBookings({ status: 'CONFIRMED' }) : Promise.resolve(null)),
    [canReadBookings]
  );

  const amenityIds = useMemo(() => new Set((amenities.data || []).map((item) => item.id)), [amenities.data]);
  const societySlots = useMemo(
    () => (slots.data || []).filter((slot) => !canReadAmenities || amenityIds.has(slot.amenity_id)),
    [slots.data, amenityIds, canReadAmenities]
  );

  if (!societyId && canReadAmenities) {
    return (
      <PageContainer title="Amenities & Booking" subtitle="Manage society amenities, bookable slots and reservations.">
        <AmenityTabs />
        <SocietyIdPrompt />
      </PageContainer>
    );
  }

  const error = amenities.error || slots.error || bookings.error;

  return (
    <PageContainer title="Amenities & Booking" subtitle="A practical overview of amenities, availability and reservations.">
      <AmenityTabs />
      {error && <Alert>{getErrorMessage(error)}</Alert>}

      <div className="dashboard-cards">
        {canReadAmenities && (
          <div className="stat-card">
            <div className="stat-icon"><Building2 size={21} /></div>
            <div><span>Active amenities</span><h2>{(amenities.data || []).filter((a) => a.status === 'ACTIVE').length}</h2></div>
          </div>
        )}
        {canReadSlots && (
          <div className="stat-card">
            <div className="stat-icon"><Clock3 size={21} /></div>
            <div><span>Available slots</span><h2>{societySlots.length}</h2></div>
          </div>
        )}
        {canReadBookings && (
          <div className="stat-card">
            <div className="stat-icon"><CalendarDays size={21} /></div>
            <div><span>Confirmed bookings</span><h2>{(bookings.data || []).length}</h2></div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h3>Quick actions</h3>
          <div className="assign-row">
            {hasPermission('AMENITY_CREATE') && <Link className="btn btn-primary" to="/amenities/list">Manage amenities</Link>}
            {hasPermission('AMENITY_SLOT_CREATE') && <Link className="btn btn-secondary" to="/amenities/slots">Manage slots</Link>}
            {hasPermission('AMENITY_BOOKING_CREATE') && <Link className="btn btn-secondary" to="/amenities/bookings">Manage bookings</Link>}
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            Pricing rules and maintenance/event blockouts are managed from an amenity's detail page.
          </p>
        </section>

        <section className="dashboard-panel">
          <h3>Booking workflow</h3>
          <p className="muted">Choose an available slot, select the unit and guest count, then create the reservation. New bookings start as pending payment.</p>
          <p className="muted" style={{ marginTop: 10 }}>Confirmed bookings consume capacity; cancellation releases the held capacity.</p>
        </section>
      </div>
    </PageContainer>
  );
}
