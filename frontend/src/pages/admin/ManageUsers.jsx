import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminService } from '../../services';
import { useAsyncAction, useAsyncData } from '../../hooks/useAsyncData';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';
import Modal, { ConfirmModal } from '../../components/Modal';
import { SkeletonList } from '../../components/LoadingSpinner';
import { formatDate, initials } from '../../utils/formatters';

const PAGE_SIZE = 10;

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
];

/**
 * User management (`/admin/users`): search, role changes, activation and
 * deletion. Self-demotion and self-deletion are blocked by the API, and the UI
 * disables those controls so the rule is visible before the request is sent.
 */
export default function ManageUsers() {
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(role ? { role } : {}),
    }),
    [page, debouncedSearch, role]
  );

  const { data, loading, error, reload } = useAsyncData(
    () => adminService.listUsers(params),
    [params]
  );

  const { execute: runUpdate } = useAsyncAction(adminService.updateUser);
  const { execute: runDelete } = useAsyncAction(adminService.deleteUser);

  const users = data?.data || [];
  const meta = data?.pagination || { page, totalPages: 1, total: 0 };
  const hasFilters = Boolean(search || role);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRole('');
    setPage(1);
  };

  /** Saves the role / activation changes made in the edit modal. */
  const saveUser = async (form) => {
    setBusyId(form.id);
    try {
      const payload = {};
      if (form.role !== undefined) payload.role = form.role;
      if (form.isActive !== undefined) payload.isActive = form.isActive;

      const response = await runUpdate(form.id, payload);
      toast.success(response.message || 'User updated');
      setEditing(null);
      reload();
    } catch (thrown) {
      toast.error(thrown?.message || 'The user could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    try {
      const response = await runDelete(deleting.id);
      toast.success(response.message || 'User deleted');
      setDeleting(null);
      // Keep the table inside the available pages after a removal.
      if (users.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (thrown) {
      toast.error(thrown?.message || 'The user could not be deleted.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage users</h1>
          <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
            {meta.total ?? 0} registered account{meta.total === 1 ? '' : 's'}.
          </p>
        </div>

        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" />
          Add user
        </button>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_auto]">
          <div className="relative">
            <label htmlFor="users-search" className="sr-only">
              Search users
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="users-search"
              type="search"
              className="input pl-9"
              value={search}
              onChange={(event) => changeFilter(setSearch)(event.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          <div>
            <label htmlFor="users-role" className="sr-only">
              Filter by role
            </label>
            <select
              id="users-role"
              className="input"
              value={role}
              onChange={(event) => changeFilter(setRole)(event.target.value)}
            >
              {ROLE_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters ? (
            <button type="button" className="btn-ghost btn-sm whitespace-nowrap" onClick={clearFilters}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <ErrorMessage title="Could not load the users" message={error} onDismiss={reload} className="mb-6" />
      ) : null}

      {/* ---------------------------------------------------------- content */}
      {loading ? (
        <SkeletonList count={5} />
      ) : users.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="hidden sm:table-cell">Role</th>
                  <th className="hidden md:table-cell">Scans</th>
                  <th className="hidden lg:table-cell">Joined</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => {
                  const isSelf = row.id === currentUser?.id;
                  const busy = busyId === row.id;

                  return (
                    <tr key={row.id} className={busy ? 'opacity-60' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-xs font-bold text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                            {initials(row.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {row.name}
                              {isSelf ? <span className="ml-1.5 text-xs text-leaf-500">(you)</span> : null}
                            </p>
                            <p className="truncate text-xs text-leaf-600 dark:text-leaf-400">{row.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden sm:table-cell">
                        <span
                          className={`badge ${
                            row.role === 'admin'
                              ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200'
                              : 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200'
                          }`}
                        >
                          {row.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>

                      <td className="hidden md:table-cell">
                        {row.predictionCount > 0 ? (
                          <Link
                            to={`/admin/predictions?search=${encodeURIComponent(row.name)}`}
                            className="font-semibold text-leaf-600 hover:underline dark:text-leaf-400"
                          >
                            {row.predictionCount}
                          </Link>
                        ) : (
                          <span className="text-leaf-500">0</span>
                        )}
                      </td>

                      <td className="hidden text-xs text-leaf-600 lg:table-cell dark:text-leaf-400">
                        {formatDate(row.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            row.isActive
                              ? 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {row.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => setEditing({ ...row })}
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(row)}
                            disabled={busy || isSelf}
                            title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                            aria-label={`Delete ${row.name}`}
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} label="users" />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No users match these filters' : 'No users yet'}
          message={hasFilters ? 'Try a different search term or role.' : 'Registered accounts will appear here.'}
          className="mt-2"
        />
      )}

      {hasFilters && users.length === 0 && !loading ? (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:underline dark:text-leaf-400"
          >
            <RotateCcw className="h-4 w-4" />
            Clear all filters
          </button>
        </div>
      ) : null}

      {/* ----------------------------------------------------------- modals */}
      <EditUserModal
        user={editing}
        isSelf={editing ? editing.id === currentUser?.id : false}
        loading={busyId === editing?.id}
        onClose={() => setEditing(null)}
        onSave={saveUser}
      />

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={reload} />

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busyId === deleting?.id}
        title="Delete this user?"
        confirmLabel="Delete user"
        message={
          deleting
            ? `${deleting.name} and all of their predictions (${deleting.predictionCount ?? 0}) will be permanently deleted.`
            : ''
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ modals */

/**
 * Role and activation state.
 *
 * The form is a separate component so it mounts only while the modal is open:
 * `useState` initialisers then seed the fields from the selected user, which is
 * simpler and less error-prone than syncing state with an effect.
 */
function EditUserModal({ user, isSelf, loading, onClose, onSave }) {
  if (!user) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit user"
      description={`${user.name} — ${user.email}`}
      size="sm"
    >
      <EditUserForm user={user} isSelf={isSelf} loading={loading} onClose={onClose} onSave={onSave} />
    </Modal>
  );
}

function EditUserForm({ user, isSelf, loading, onClose, onSave }) {
  const [form, setForm] = useState({ role: user.role, isActive: Boolean(user.isActive) });

  const submit = (event) => {
    event.preventDefault();
    onSave({ id: user.id, role: form.role, isActive: form.isActive });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="edit-role">
          Role
        </label>
        <select
          id="edit-role"
          className="input"
          value={form.role}
          onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          disabled={isSelf}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {isSelf ? (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            You cannot change your own role, otherwise the panel could be locked out.
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="edit-active">
          Account status
        </label>
        <select
          id="edit-active"
          className="input"
          value={form.isActive ? 'active' : 'inactive'}
          onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === 'active' }))}
          disabled={isSelf}
        >
          <option value="active">Active — can sign in</option>
          <option value="inactive">Deactivated — sign in blocked</option>
        </select>
        {isSelf ? (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            You cannot deactivate your own account.
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || isSelf}>
          <ShieldCheck className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

/** Creates a user from the admin panel (no confirmation field here). */
function CreateUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [fieldErrors, setFieldErrors] = useState({});
  const { execute, loading, error, clearError } = useAsyncAction(adminService.createUser);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    try {
      const response = await execute(form);
      toast.success(response.message || 'User created');
      setForm({ name: '', email: '', password: '', role: 'user' });
      onClose();
      onCreated();
    } catch (thrown) {
      setFieldErrors(thrown?.fieldErrors || {});
      toast.error(thrown?.message || 'The user could not be created.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add user" size="sm">
      {error ? <ErrorMessage message={error} onDismiss={clearError} className="mb-4" /> : null}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="create-name">
            Full name
          </label>
          <input
            id="create-name"
            className={`input ${fieldErrors.name ? 'input-error' : ''}`}
            value={form.name}
            onChange={update('name')}
            required
            minLength={3}
          />
          {fieldErrors.name ? <p className="form-error">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label className="label" htmlFor="create-email">
            Email
          </label>
          <input
            id="create-email"
            type="email"
            className={`input ${fieldErrors.email ? 'input-error' : ''}`}
            value={form.email}
            onChange={update('email')}
            required
          />
          {fieldErrors.email ? <p className="form-error">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label className="label" htmlFor="create-password">
            Password
          </label>
          <input
            id="create-password"
            type="password"
            className={`input ${fieldErrors.password ? 'input-error' : ''}`}
            value={form.password}
            onChange={update('password')}
            required
            minLength={6}
          />
          {fieldErrors.password ? (
            <p className="form-error">{fieldErrors.password}</p>
          ) : (
            <p className="mt-1.5 text-xs text-leaf-500">At least 6 characters.</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="create-role">
            Role
          </label>
          <select id="create-role" className="input" value={form.role} onChange={update('role')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
