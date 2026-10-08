import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, Leaf, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsyncAction } from '../hooks/useAsyncData';
import ErrorMessage from '../components/ErrorMessage';

/** Client-side password rules, mirrored from the backend validators. */
const RULES = [
  { id: 'length', label: 'At least 6 characters', test: (value) => value.length >= 6 },
  { id: 'letter', label: 'Contains a letter', test: (value) => /[a-z]/i.test(value) },
  { id: 'number', label: 'Contains a number', test: (value) => /\d/.test(value) },
];

/** A stronger password (8+ chars with a letter and a number) is highlighted. */
const isStrong = (value) => value.length >= 8 && /[a-z]/i.test(value) && /\d/.test(value);

/**
 * Registration page.
 *
 * The backend deliberately does not sign a new account in automatically, so
 * after a successful registration the user logs in with the same credentials.
 * That keeps the login flow (and its error handling) identical for everyone.
 */
export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const { execute, loading, error, clearError } = useAsyncAction(register);

  const passedRules = useMemo(
    () => RULES.filter((rule) => rule.test(form.password)),
    [form.password]
  );

  const update = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    if (error) clearError();
    if (formError) setFormError(null);
  };

  const validate = () => {
    const problems = {};

    if (!form.name.trim()) problems.name = 'Name is required';
    else if (form.name.trim().length < 3) problems.name = 'Name must be at least 3 characters long';

    if (!form.email.trim()) problems.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      problems.email = 'Please provide a valid email address';
    }

    if (!form.password) problems.password = 'Password is required';
    else if (form.password.length < 6) problems.password = 'Password must be at least 6 characters long';

    if (!form.confirmPassword) problems.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) problems.confirmPassword = 'Passwords do not match';

    if (!accepted) problems.terms = 'Please accept the terms to continue';

    setFieldErrors(problems);
    return Object.keys(problems).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await execute({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // Registration does not return a token, so log in straight away to keep
      // the user on a single, predictable step.
      try {
        await login({ email: form.email.trim().toLowerCase(), password: form.password });
        navigate('/dashboard', { replace: true });
      } catch {
        setFormError(
          'Your account was created, but the automatic login failed. Please sign in with your new credentials.'
        );
        navigate('/login');
      }
    } catch (thrown) {
      setFieldErrors(thrown?.fieldErrors || {});
    }
  };

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
        {/* ------------------------------------------------------ marketing */}
        <div className="hidden lg:block">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-600 text-white">
            <Leaf className="h-6 w-6" />
          </span>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Create your free account
          </h1>

          <p className="mt-4 text-pretty leading-relaxed text-leaf-700 dark:text-leaf-300">
            Registration takes a few seconds and gives you a private dashboard with your detection
            history, saved images and remedy plans.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              'Unlimited leaf image detections',
              'A permanent history of your scans',
              'Disease details, remedies and prevention plans',
              'Light and dark interface with mobile support',
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-leaf-700 dark:text-leaf-300">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------------------ form */}
        <div className="card p-7 sm:p-9">
          <div className="lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-600 text-white">
              <Leaf className="h-5 w-5" />
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight lg:mt-0">Sign up</h2>
          <p className="mt-1.5 text-sm text-leaf-600 dark:text-leaf-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-leaf-600 hover:underline dark:text-leaf-400">
              Log in
            </Link>
          </p>

          {error ? (
            <ErrorMessage title="Could not create the account" message={error} onDismiss={clearError} className="mt-6" />
          ) : null}

          {formError ? <ErrorMessage variant="warning" message={formError} className="mt-6" /> : null}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
                placeholder="e.g. Ramesh Kumar"
                className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? <p className="form-error">{fieldErrors.name}</p> : null}
            </div>

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
                  autoComplete="new-password"
                  placeholder="Create a password"
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

              {/* Strength feedback */}
              {form.password ? (
                <div className="mt-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isStrong(form.password) ? 'w-full bg-leaf-500' : 'w-2/3 bg-amber-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isStrong(form.password)
                          ? 'text-leaf-600 dark:text-leaf-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isStrong(form.password) ? 'Strong' : 'Could be stronger'}
                    </span>
                  </div>

                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {RULES.map((rule) => {
                      const passed = rule.test(form.password);
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-1 text-xs ${
                            passed
                              ? 'text-leaf-600 dark:text-leaf-400'
                              : 'text-leaf-500 dark:text-leaf-500'
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${passed ? 'opacity-100' : 'opacity-30'}`}
                            aria-hidden="true"
                          />
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              {fieldErrors.confirmPassword ? (
                <p className="form-error">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-leaf-700 dark:text-leaf-300">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => {
                    setAccepted(event.target.checked);
                    setFieldErrors((previous) => ({ ...previous, terms: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-leaf-300 text-leaf-600 focus:ring-leaf-500 dark:border-leaf-700"
                />
                <span>
                  I understand that this tool gives suggestions only, and that a plant pathologist
                  should confirm serious infections.
                </span>
              </label>
              {fieldErrors.terms ? <p className="form-error">{fieldErrors.terms}</p> : null}
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-block">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-leaf-500 dark:text-leaf-500">
            {passedRules.length < RULES.length
              ? `A password of at least ${6} characters is required.`
              : 'You are signed in automatically after registering.'}
          </p>
        </div>
      </div>
    </div>
  );
}