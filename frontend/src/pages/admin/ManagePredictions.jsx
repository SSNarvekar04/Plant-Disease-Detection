import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, RotateCcw, ScanLine, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { adminService, diseaseService } from '../../services';
import { useAsyncAction, useAsyncData } from '../../hooks/useAsyncData';
import { useDebounce } from '../../hooks/useDebounce';
import PredictionCard from '../../components/PredictionCard';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';
import LinkButton from '../../components/LinkButton';
import { ConfirmModal } from '../../components/Modal';
import { SkeletonList } from '../../components/LoadingSpinner';
import { STATUS_STYLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const PAGE_SIZE = 12;

const STATUS_FILTERS = [
  { value: '', label: 'All outcomes' },
  { value: 'detected', label: STATUS_STYLES.detected.label },
  { value: 'healthy', label: STATUS_STYLES.healthy.label },
  { value: 'low_confidence', label: STATUS_STYLES.low_confidence.label },
  { value: 'failed', label: STATUS_STYLES.failed.label },
];

/**
 * Prediction oversight (`/admin/predictions`).
 *
 * Read-only apart from deletion: predictions are a record of what the model
 * returned, so editing one would make the history worthless as evidence. An
 * admin who needs to correct a label should look at the disease knowledge base
 * instead, which is what future detections will use.
 */
export default function ManagePredictions() {
  // The users table deep-links here with ?search=<user name>.
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [plant, setPlant] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  // Plant options come from the knowledge base, which mirrors the model classes.
  const plants = useAsyncData(() => diseaseService.filterOptions(), []);
  const plantOptions = plants.data?.data?.plants || [];

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(plant ? { plant } : {}),
      ...(status ? { status } : {}),
    }),
    [page, debouncedSearch, plant, status]
  );

  const { data, loading, error, reload } = useAsyncData(
    () => adminService.listPredictions(params),
    [params]
  );

  const { execute: runDelete } = useAsyncAction(adminService.deletePrediction);

  const predictions = data?.data || [];
  const meta = data?.pagination || { page, totalPages: 1, total: 0 };
  const hasFilters = Boolean(search || plant || status);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setPlant('');
    setStatus('');
    setPage(1);
    // Drop the deep-link so a refresh does not re-apply the stale filter.
    setSearchParams({}, { replace: true });
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    try {
      const response = await runDelete(deleting.id);
      toast.success(response.message || 'Prediction deleted');
      setDeleting(null);
      if (predictions.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (thrown) {
      toast.error(thrown?.message || 'The prediction could not be deleted.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage predictions</h1>
          <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
            {meta.total ?? 0} stored prediction{meta.total === 1 ? '' : 's'} across all users.
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="relative">
            <label htmlFor="admin-predictions-search" className="sr-only">
              Search predictions
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="admin-predictions-search"
              type="search"
              className="input pl-9"
              value={search}
              onChange={(event) => changeFilter(setSearch)(event.target.value)}
              placeholder="Search plant, disease or user"
            />
          </div>

          <div>
            <label htmlFor="admin-predictions-plant" className="sr-only">
              Filter by plant
            </label>
            <select
              id="admin-predictions-plant"
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
            <label htmlFor="admin-predictions-status" className="sr-only">
              Filter by outcome
            </label>
            <select
              id="admin-predictions-status"
              className="input"
              value={status}
              onChange={(event) => changeFilter(setStatus)(event.target.value)}
            >
              {STATUS_FILTERS.map((item) => (
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
        <ErrorMessage
          title="Could not load the predictions"
          message={error}
          onDismiss={reload}
          className="mb-6"
        />
      ) : null}

      {/* ---------------------------------------------------------- content */}
      {loading ? (
        <SkeletonList count={5} />
      ) : predictions.length > 0 ? (
        <>
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <div key={prediction.id} className={busyId === prediction.id ? 'opacity-60' : ''}>
                <PredictionCard
                  prediction={prediction}
                  showUser
                  onDelete={setDeleting}
                  deleting={busyId === prediction.id}
                />

                {/* Admin-only detail row: the owner and timestamp are not part of
                    the compact user-facing card. */}
                <div className="-mt-2 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-leaf-500">
                  <span>{formatDate(prediction.createdAt)}</span>
                  {prediction.user?.email ? <span>{prediction.user.email}</span> : null}
                  <LinkButton
                    to={`/predictions/${prediction.id}`}
                    variant="ghost"
                    size="sm"
                    className="!px-2 !py-1 text-xs"
                  >
                    View full result
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onChange={setPage}
            label="predictions"
          />
        </>
      ) : (
        <EmptyState
          icon={ScanLine}
          title={hasFilters ? 'No predictions match these filters' : 'No predictions recorded yet'}
          message={
            hasFilters
              ? 'Try a different search term, plant or outcome.'
              : 'Once users start uploading leaf images their scans appear here.'
          }
          className="mt-2"
        />
      )}

      {hasFilters && predictions.length === 0 && !loading ? (
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
        title="Delete this prediction?"
        confirmLabel="Delete record"
        message={
          deleting
            ? `The ${deleting.diseaseName} scan by ${deleting.user?.name || 'a user'} will be removed from their history. This cannot be undone.`
            : ''
        }
      />

      <p className="mt-6 flex items-start gap-2 text-xs text-leaf-500">
        <Activity className="mt-0.5 h-4 w-4 shrink-0" />
        Prediction records are an audit trail of what the model returned, so they can only be
        deleted, never edited.
      </p>
    </div>
  );
}
