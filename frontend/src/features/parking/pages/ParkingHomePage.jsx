import { Navigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';

/** /parking just sends you to the first tab you are allowed to see. */
export default function ParkingHomePage() {
  const { hasPermission } = useAuth();
  let target = '/parking/allocations';
  if (hasPermission('PARKING_AREA_READ')) target = '/parking/areas';
  else if (hasPermission('PARKING_SLOT_READ')) target = '/parking/slots';
  return <Navigate to={target} replace />;
}
