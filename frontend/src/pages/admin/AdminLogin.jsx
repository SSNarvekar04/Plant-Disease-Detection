import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useAsyncAction } from '../../hooks/useAsyncData';
import ErrorMessage from '../../components/ErrorMessage';

/**
 * Admin sign-in (`/admin/login`).
 *
 * Kept outside the dashboard layout on purpose: an admin who lands here while
 * signed in, or whose session expired mid-session, still gets a way in without
 * the sidebar rendering.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const { execute, loading, error, clearError } = useAsyncAction(login);

  // Remembered by <AdminRoute> so a redirect lands back on the blocked page.
  const redirectTo = location.state?.from || '/admin';

  // An administrator who is already signed in has nothing to do here.
  if (isAuthenticated && isAdmin) return <Navigate to={redirectTo} replace />;

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      const account = await execute(form);
      if (account.role !== 'admin') {
        // Valid credentials, but not an administrator. The session stays, so the
        // user is simply sent to their own dashboard instead of a dead end.
        toast.error('These credentials do not belong to an administrator.');
        navigate('/dashboard', { replace: true });
        return;
      }
      toast.success('Signed in to the admin panel');
      navigate(redirectTo, { replace: true });
    } catch (thrown) {
      toast.error(thrown?.message || 'Sign in failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-leaf-50 px-4 py-12 dark:bg-leaf-950">
      <div className="w-full max-w-md">
        <div className="card p-7 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-600 text-white shadow-sm">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Admin sign in</h1>
            <p className="mt-1.5 text-sm text-leaf-600 dark:text-leaf-400">
              Restricted area. Only administrator accounts can continue.
            </p>
          </div>

          {error ? <ErrorMessage message={error} onDismiss={clearError} className="mt-6" /> : null}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                className="input"
                value={form.email}
                onChange={update('email')}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
                <input
                  id="admin-password"
                  type="password"
                  className="input pl-9"
                  value={form.password}
                  onChange={update('password')}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing in...' : 'Sign in to admin panel'}
            </button>
          </form>

          <p className="mt-6 rounded-xl bg-leaf-50 p-3 text-center text-xs text-leaf-600 dark:bg-leaf-900/50 dark:text-leaf-400">
            Demo administrator: <span className="font-semibold">admin@plantdisease.com</span> /{' '}
            <span className="font-semibold">Admin@123</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-leaf-600 dark:text-leaf-400">
          <Link to="/login" className="font-medium hover:underline dark:text-leaf-300">
            Back to user sign in
          </Link>
        </p>
      </div>
    </div>
  );
}