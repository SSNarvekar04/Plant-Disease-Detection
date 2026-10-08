import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Leaf, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { diseaseService } from '../../services';
import { useAsyncAction, useAsyncData } from '../../hooks/useAsyncData';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';
import LinkButton from '../../components/LinkButton';
import { ConfirmModal } from '../../components/Modal';
import { SkeletonList } from '../../components/LoadingSpinner';
import { severityStyle } from '../../utils/constants';

const PAGE_SIZE = 10;

const SEVERITIES = ['', 'Low', 'Medium', 'High', 'Critical'];

/**
 * Knowledge-base management (`/admin/diseases`).
 *
 * Reuses the public `diseaseService` endpoints, which are admin-guarded on the
 * server, so there is no separate admin-only disease API.
 */
export default function ManageDiseases() {
  const [search, setSearch] = useState('');
  const [plant, setPlant] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(plant ? { plant } : {}),
      ...(severity ? { severity } : {}),
    }),
    [page, debouncedSearch, plant, severity]
  );

  const { data, loading, error, reload } = useAsyncData(
    () => diseaseService.list(params),
    [params]
  );

  // The plant dropdown comes from a lightweight endpoint of its own.
  const plants = useAsyncData(() => diseaseService.filterOptions(), []);

  const { execute: runDelete } = useAsyncAction(diseaseService.remove);

  const diseases = data?.data || [];
  const meta = data?.pagination || { page, totalPages: 1, total: 0 };
  const hasFilters = Boolean(search || plant || severity);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setPlant('');
    setSeverity('');
    setPage(1);
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    try {
      const response = await runDelete(deleting.id);
      toast.success(response.message || 'Disease deleted');
      setDeleting(null);
      if (diseases.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (thrown) {
      toast.error(thrown?.message || 'The disease could not be deleted.');
    } finally {
      setBusyId(null);
    }
  };

  const plantOptions = plants.data?.data?.plants || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage diseases</h1>
          <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
            {meta.total ?? 0} knowledge-base record{meta.total === 1 ? '' : 's'}. These are the remedy
            plans users see after a detection.
          </p>
        </div>

        <LinkButton to="/admin/diseases/new">
          <Plus className="h-4 w-4" />
          Add disease
        </LinkButton>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="relative">
            <label htmlFor="diseases-search" className="sr-only">
              Search diseases
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="diseases-search"
              type="search"
              className="input pl-9"
              value={search}
              onChange={(event) => changeFilter(setSearch)(event.target.value)}
              placeholder="Search by name or description"
            />
          </div>

          <div>
            <label htmlFor="diseases-plant" className="sr-only">
              Filter by plant
            </label>
            <select
              id="diseases-plant"
              className="input"
              value={plant}
              onChange={(event) => changeFilter(setPlant)(event.target.value)}
            >
              <option value="">All plants</option>
              {plantOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="diseases-severity" className="sr-only">
              Filter by severity
            </label>
            <select
              id="diseases-severity"
              className="input"
              value={severity}
              onChange={(event) => changeFilter(setSeverity)(event.target.value)}
            >
              {SEVERITIES.map((level) => (
                <option key={level || 'all'} value={level}>
                  {level || 'All severities'}
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
        <ErrorMessage
          title="Could not load the diseases"
          message={error}
          onDismiss={reload}
          className="mb-6"
        />
      ) : null}

      {/* ---------------------------------------------------------- content */}
      {loading ? (
        <SkeletonList count={5} />
      ) : diseases.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th className="hidden sm:table-cell">Plant</th>
                  <th>Severity</th>
                  <th className="hidden lg:table-cell">ML label</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {diseases.map((row) => {
                  const style = severityStyle(row.severity);
                  const busy = busyId === row.id;

                  return (
                    <tr key={row.id} className={busy ? 'opacity-60' : ''}>
                      <td>
                        <p className="font-medium">{row.diseaseName}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-leaf-600 dark:text-leaf-400">
                          {row.description}
                        </p>
                      </td>

                      <td className="hidden sm:table-cell">{row.plantName}</td>

                      <td>
                        <span className={`badge ${style.badge}`}>{row.severity}</span>
                      </td>

                      <td className="hidden max-w-[16rem] lg:table-cell">
                        {row.mlLabels?.length ? (
                          <code className="truncate text-xs text-leaf-600 dark:text-leaf-400">
                            {row.mlLabels[0]}
                            {row.mlLabels.length > 1 ? ` +${row.mlLabels.length - 1}` : ''}
                          </code>
                        ) : (
                          <span className="text-xs text-leaf-500">Not mapped</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            row.isActive
                              ? 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {row.isActive ? 'Visible' : 'Hidden'}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/diseases/${row.id}`}
                            className="btn-ghost btn-sm"
                            title="Preview as a user"
                            aria-label={`Preview ${row.diseaseName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/diseases/${row.id}/edit`}
                            className="btn-ghost btn-sm"
                            title="Edit"
                            aria-label={`Edit ${row.diseaseName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                            onClick={() => setDeleting(row)}
                            disabled={busy}
                            title="Delete"
                            aria-label={`Delete ${row.diseaseName}`}
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

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onChange={setPage}
            label="records"
          />
        </>
      ) : (
        <EmptyState
          icon={Leaf}
          title={hasFilters ? 'No diseases match these filters' : 'The knowledge base is empty'}
          message={
            hasFilters
              ? 'Try a different search term, plant or severity.'
              : 'Add the first disease so detections can be matched to remedy information.'
          }
          actionTo={hasFilters ? undefined : '/admin/diseases/new'}
          actionLabel={hasFilters ? undefined : 'Add a disease'}
          className="mt-2"
        />
      )}

      {hasFilters && diseases.length === 0 && !loading ? (
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

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busyId === deleting?.id}
        title="Delete this disease record?"
        confirmLabel="Delete record"
        message={
          deleting
            ? `"${deleting.diseaseName}" will be removed from the library. Existing predictions keep their own copy of the result, so no history is lost, but new detections of this class will have no remedy plan.`
            : ''
        }
      />
    </div>
  );
}
