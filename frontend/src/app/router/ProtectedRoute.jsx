import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../providers/useAuth';
import { FullPageLoader } from '../../components/ui/Spinner';

function AccessDenied() {
  return (
    <div className="empty-state">
      <h1>You don't have access to this page</h1>
      <p>Your role doesn't include the permission this page needs. Ask a Society Admin if you think that's a mistake.</p>
    </div>
  );
}

/**
 * Layout route that requires a signed-in user.
 * Pass `permission` (string or array, ANY of them) to also require a permission:
 *   <Route element={<ProtectedRoute permission="USER_READ" />}> ... </Route>
 */
export default function ProtectedRoute({ permission }) {
  const { isAuthenticated, isLoading, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (permission && !hasAnyPermission(permission)) return <AccessDenied />;
  return <Outlet />;
}

/** Login-type pages: signed-in users are sent on to where they were headed (or the dashboard). */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search || ''}` : '/dashboard';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
