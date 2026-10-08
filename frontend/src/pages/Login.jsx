import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Loader2, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsyncAction } from '../hooks/useAsyncData';
import ErrorMessage from '../components/ErrorMessage';

/** Demo credentials, shown only so the seeded data can be tried out. */
const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@plantdisease.com', password: 'Admin@123' },
  { label: 'Regular user', email: 'user@plantdisease.com', password: 'User@123' },
];

/**
 * Login page.
 *
 * After a successful login the user is sent to the page they originally wanted
 * (`location.state.from`), falling back to the dashboard or the admin panel.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { execute, loading, error, clearError } = useAsyncAction(login);

  const redirectTo = location.state?.from;

  const update = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
    if (fieldErrors[key]) setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    if (error) clearError();
  };

  /** Basic client-side checks, so an obvious typo never costs a round trip. */
  const validate = () => {
    const problems = {};
    if (!form.email.trim()) problems.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      problems.email = 'Please provide a valid email address';
    }
    if (!form.password) problems.password = 'Password is required';
    setFieldErrors(problems);
    return Object.keys(problems).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      const account = await execute({
        email: form.email.trim(),
        password: form.password,
      });
      // An admin deep link wins over the role default.
      const target = redirectTo || (account.role === 'admin' ? '/admin' : '/dashboard');
      navigate(target, { replace: true });
    } catch (thrown) {
      // The interceptor already normalised the message; map field errors too.
      setFieldErrors(thrown?.fieldErrors || {});
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setFieldErrors({});
    clearError();
  };

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* ------------------------------------------------------ marketing */}
        <div className="hidden lg:block">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-600 text-white">
            <Leaf className="h-6 w-6" />
          </span>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back to your crop health dashboard
          </h1>

          <p className="mt-4 text-pretty leading-relaxed text-leaf-700 dark:text-leaf-300">
            Sign in to upload leaf images, review your prediction history and see the remedy plan for
            every disease the model has identified for you.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: Sparkles, text: 'Instant AI classification across 29 plant disease classes' },
              { icon: ShieldCheck, text: 'Remedy plans reviewed and stored with every prediction' },
              { icon: Leaf, text: 'Complete history of every scan you have made' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-leaf-700 dark:text-leaf-300">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ------------------------------------------------------------ form */}
        <div className="card p-7 sm:p-9">
          <div className="lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-600 text-white">
              <Leaf className="h-5 w-5" />
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight lg:mt-0">Log in</h2>
          <p className="mt-1.5 text-sm text-leaf-600 dark:text-leaf-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-leaf-600 hover:underline dark:text-leaf-400">
              Create a free account
            </Link>
          </p>

          {error ? (
            <ErrorMessage title="Could not log in" message={error} onDismiss={clearError} className="mt-6" />
          ) : null}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <p className="form-error">{fieldErrors.email}</p> : null}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`input pr-11 ${fieldErrors.password ? 'input-error' : ''}`}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-leaf-500 transition hover:bg-leaf-100 hover:text-leaf-700 dark:hover:bg-leaf-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="form-error">{fieldErrors.password}</p> : null}
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-block">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Log in
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-7 rounded-xl border border-dashed border-leaf-300 bg-leaf-50 p-4 dark:border-leaf-700 dark:bg-leaf-900/50">
            <p className="text-xs font-bold uppercase tracking-wide text-leaf-700 dark:text-leaf-300">
              Demo accounts
            </p>
            <p className="mt-1 text-xs text-leaf-600 dark:text-leaf-400">
              Click a row to fill the form. These accounts exist only in the seeded database.
            </p>

            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-leaf-200 bg-white px-3 py-2 text-left transition hover:border-leaf-400 hover:bg-leaf-50 dark:border-leaf-700 dark:bg-leaf-950 dark:hover:border-leaf-500"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{account.label}</span>
                    <span className="block truncate text-xs text-leaf-600 dark:text-leaf-400">
                      {account.email}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-leaf-700 dark:text-leaf-300">
                    {account.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-leaf-500 dark:text-leaf-500">
            Administrators can sign in on the{' '}
            <Link to="/admin/login" className="font-medium text-leaf-600 hover:underline dark:text-leaf-400">
              admin login page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}