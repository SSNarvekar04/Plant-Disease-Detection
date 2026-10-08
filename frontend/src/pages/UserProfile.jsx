import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Camera,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { userService } from '../services';
import { useAsyncAction, useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { ConfirmModal } from '../components/Modal';
import { FullPageLoader } from '../components/LoadingSpinner';
import { formatDate, initials } from '../utils/formatters';

/**
 * Account page (`/profile`).
 *
 * Four independent forms on purpose: each one maps to exactly one endpoint, so
 * a failed password change never rolls back a successful profile edit.
 */
export default function UserProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, refreshUser, logout } = useAuth();

  const { data, loading, error, reload } = useAsyncData(() => userService.getProfile(), []);

  if (loading) return <FullPageLoader label="Loading your profile" />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorMessage title="Could not load your profile" message={error} onDismiss={reload} />
      </div>
    );
  }

  const profile = data?.data?.user || user;
  const stats = data?.data?.stats || { predictionCount: 0, uniqueDiseases: 0 };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
          Manage your personal details, sign-in credentials and stored scans.
        </p>
      </div>

      {/* ------------------------------------------------------------ header */}
      <section className="card flex flex-wrap items-center gap-5 p-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${profile.name} avatar`}
            className="h-20 w-20 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-leaf-100 text-2xl font-bold text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
            {initials(profile.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-sm text-leaf-600 dark:text-leaf-400">{profile.email}</p>
          <p className="mt-2 text-xs text-leaf-500">
            Member since {formatDate(profile.createdAt) || '—'} • {profile.role === 'admin' ? 'Administrator' : 'User'}
          </p>
        </div>

        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-leaf-700 dark:text-leaf-300">{stats.predictionCount}</p>
            <p className="text-xs text-leaf-600 dark:text-leaf-400">Scans</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-leaf-700 dark:text-leaf-300">{stats.uniqueDiseases}</p>
            <p className="text-xs text-leaf-600 dark:text-leaf-400">Conditions seen</p>
          </div>
        </div>
      </section>

      <ProfileForm profile={profile} onSave={updateProfile} />
      <EmailForm profile={profile} onSaved={refreshUser} />
      <PasswordForm />
      <DangerZone onDelete={logout} redirectTo="/" navigate={navigate} />
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

/** Name, phone, location and avatar URL. */
function ProfileForm({ profile, onSave }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    location: profile.location || '',
    avatarUrl: profile.avatarUrl || '',
  });
  // `onSave` is the AuthContext updater, so the sidebar/navbar pick up the new
  // name without this page having to sync a second copy of the user.
  const { execute, loading, error, clearError } = useAsyncAction(onSave);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await execute(form);
      // Keep the inputs in sync with what the server accepted.
      setForm({
        name: response.data.user.name || '',
        phone: response.data.user.phone || '',
        location: response.data.user.location || '',
        avatarUrl: response.data.user.avatarUrl || '',
      });
      toast.success(response.message || 'Profile updated');
    } catch (thrown) {
      toast.error(thrown?.message || 'The profile could not be saved.');
    }
  };

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2.5">
        <UserRound className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
        <h2 className="text-lg font-semibold">Personal details</h2>
      </div>

      {error ? <ErrorMessage message={error} onDismiss={clearError} className="mt-4" /> : null}

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-name">
            Full name
          </label>
          <input
            id="profile-name"
            className="input"
            value={form.name}
            onChange={update('name')}
            required
            minLength={3}
            maxLength={80}
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-phone">
            Phone
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="profile-phone"
              className="input pl-9"
              value={form.phone}
              onChange={update('phone')}
              placeholder="Optional"
              maxLength={20}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="profile-location">
            Location
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="profile-location"
              className="input pl-9"
              value={form.location}
              onChange={update('location')}
              placeholder="City, region"
              maxLength={120}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="profile-avatar">
            Avatar URL
          </label>
          <div className="relative">
            <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="profile-avatar"
              type="url"
              className="input pl-9"
              value={form.avatarUrl}
              onChange={update('avatarUrl')}
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save details'}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Email change -- verified with the current password. */
function EmailForm({ profile, onSaved }) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const { execute, loading, error, clearError } = useAsyncAction(userService.changeEmail);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await execute({ newEmail, password });
      toast.success(response.message || 'Email updated');
      setNewEmail('');
      setPassword('');
      // Re-read the profile so the header and navbar show the new address.
      await onSaved();
    } catch (thrown) {
      toast.error(thrown?.message || 'The email address could not be changed.');
    }
  };

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2.5">
        <Mail className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
        <h2 className="text-lg font-semibold">Email address</h2>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-leaf-600 dark:text-leaf-400">
        <AtSign className="h-4 w-4" />
        Currently {profile.email}
      </p>

      {error ? <ErrorMessage message={error} onDismiss={clearError} className="mt-4" /> : null}

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email-new">
            New email
          </label>
          <input
            id="email-new"
            type="email"
            className="input"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="email-password">
            Current password
          </label>
          <input
            id="email-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Updating...' : 'Update email'}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Password change -- requires the current password. */
function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const { execute, loading, error, clearError } = useAsyncAction(userService.changePassword);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  /** Client-side check first, so an obvious typo never costs a round trip. */
  const submit = async (event) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setFieldErrors({});
    try {
      const response = await execute(form);
      toast.success(response.message || 'Password changed');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (thrown) {
      setFieldErrors(thrown?.fieldErrors || {});
      toast.error(thrown?.message || 'The password could not be changed.');
    }
  };

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2.5">
        <KeyRound className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
        <h2 className="text-lg font-semibold">Change password</h2>
      </div>

      {error ? <ErrorMessage message={error} onDismiss={clearError} className="mt-4" /> : null}

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="password-current">
            Current password
          </label>
          <input
            id="password-current"
            type="password"
            className="input"
            value={form.currentPassword}
            onChange={update('currentPassword')}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password-new">
            New password
          </label>
          <input
            id="password-new"
            type="password"
            className="input"
            value={form.newPassword}
            onChange={update('newPassword')}
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="label" htmlFor="password-confirm">
            Confirm new password
          </label>
          <input
            id="password-confirm"
            type="password"
            className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
          />
          {fieldErrors.confirmPassword ? (
            <p className="form-error">{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Irreversible actions, kept in their own clearly separated card. */
function DangerZone({ onDelete, redirectTo, navigate }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { execute, loading, error, clearError } = useAsyncAction(userService.deleteAccount);

  const removeAccount = async () => {
    try {
      await execute(password);
      toast.success('Your account has been deleted');
      setConfirmOpen(false);
      // The account is gone server side, so the local session must go too.
      await onDelete();
      navigate(redirectTo, { replace: true });
    } catch (thrown) {
      toast.error(thrown?.message || 'The account could not be deleted.');
    }
  };

  return (
    <section className="card border-red-200 p-6 dark:border-red-900">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Danger zone</h2>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
        Deleting your account permanently removes your profile and every prediction in your history,
        including the stored leaf images. This cannot be undone.
      </p>

      {error ? <ErrorMessage message={error} onDismiss={clearError} className="mt-4" /> : null}

      <button type="button" className="btn-danger mt-5" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete my account
      </button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={removeAccount}
        loading={loading}
        title="Delete your account?"
        confirmLabel="Delete permanently"
        message="All of your scans and their images will be removed. Type your password to confirm."
      >
        <label className="label" htmlFor="delete-password">
          Password
        </label>
        <input
          id="delete-password"
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your current password"
        />
      </ConfirmModal>
    </section>
  );
}
