import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './LoadingSpinner';

/**
 * Wraps a route that requires a signed-in user.
 *
 * While the stored token is being verified it shows a spinner instead of
 * redirecting, otherwise a page refresh would bounce the user to /login.
 * The attempted URL is remembered so login can send them back afterwards.
 */
export function ProtectedRoute() {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) return <FullPageLoader label="Checking your session..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

/**
 * Wraps a route that requires the `admin` role.
 * A signed-in non-admin user is sent to their own dashboard.
 */
export function AdminRoute() {
  const { isAuthenticated, isAdmin, checking } = useAuth();
  const location = useLocation();

  if (checking) return <FullPageLoader label="Checking your session..." />;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/**
 * Keeps signed-in users away from the login / register pages.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin, checking } = useAuth();

  if (checking) return <FullPageLoader />;

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
}

/**
 * Shows the 404 page for any unmatched URL.
 */
export function NotFoundRoute() {
  return <Navigate to="/404" replace />;
}