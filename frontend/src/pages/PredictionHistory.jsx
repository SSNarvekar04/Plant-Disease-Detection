import { useMemo, useState } from 'react';
import { Filter, History, RotateCcw, ScanLine, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { predictionService } from '../services';
import { useAsyncAction, useAsyncData } from '../hooks/useAsyncData';
import { useDebounce } from '../hooks/useDebounce';
import PredictionCard from '../components/PredictionCard';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Pagination from '../components/Pagination';
import LinkButton from '../components/LinkButton';
import { SkeletonList } from '../components/LoadingSpinner';
import { STATUS_STYLES, SUPPORTED_PLANTS } from '../utils/constants';
import { titleCase } from '../utils/formatters';

/** Matches the endpoint's `limit` ceiling so the count and the page agree. */
const PAGE_SIZE = 9;

const STATUS_FILTERS = [
  { value: '', label: 'All results' },
  { value: 'detected', label: STATUS_STYLES.detected.label },
  { value: 'healthy', label: STATUS_STYLES.healthy.label },
  { value: 'low_confidence', label: STATUS_STYLES.low_confidence.label },
  { value: 'failed', label: STATUS_STYLES.failed.label },
];

/**
 * Signed-in user's scan history (`/history`).
 *
 * Filters live in the component state rather than the URL: the list is a
 * personal, frequently re-filtered view and every keystroke should not push a
 * history entry.
 */
export default function PredictionHistory() {
  const [search, setSearch] = useState('');
  const [plant, setPlant] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  // One request per settled keystroke instead of per character.
  const debouncedSearch = useDebounce(search, 400);

  // Only send the filters that are actually set.
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
    () => predictionService.getMine(params),
    [params]
  );

  const { execute: runDelete } = useAsyncAction(predictionService.remove);

  const predictions = data?.data || [];
  const meta = data?.pagination || { page, totalPages: 1, total: 0, limit: PAGE_SIZE };
  const hasFilters = Boolean(search || plant || status);

  const clearFilters = () => {
    setSearch('');
    setPlant('');
    setStatus('');
    setPage(1);
  };

  /** Changing a filter must send the user back to page 1. */
  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleDelete = async (prediction) => {
    if (!window.confirm(`Delete the scan for "${prediction.diseaseName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(prediction.id);
    try {
      await runDelete(prediction.id);
      toast.success('Prediction deleted');
      // Deleting the last row of a page must not leave an empty page behind.
      if (predictions.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (thrown) {
      toast.error(thrown?.message || 'The prediction could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prediction history</h1>
          <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
            Every image you have analysed, newest first. Open a scan to read its full remedy plan.
          </p>
        </div>

        <LinkButton to="/detect">
          <ScanLine className="h-4 w-4" />
          New detection
        </LinkButton>
      </div>

      {/* ------------------------------------------------------------ filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          {/* Search */}
          <div className="relative">
            <label htmlFor="history-search" className="sr-only">
              Search history
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
            <input
              id="history-search"
              type="search"
              value={search}
              onChange={(event) => changeFilter(setSearch)(event.target.value)}
              placeholder="Search by plant or disease"
              className="input pl-9"
            />
          </div>

          {/* Plant */}
          <div>
            <label htmlFor="history-plant" className="sr-only">
              Filter by plant
            </label>
            <select
              id="history-plant"
              value={plant}
              onChange={(event) => changeFilter(setPlant)(event.target.value)}
              className="input"
            >
              <option value="">All plants</option>
              {SUPPORTED_PLANTS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="history-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="history-status"
              value={status}
              onChange={(event) => changeFilter(setStatus)(event.target.value)}
              className="input"
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-ghost btn-sm whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-leaf-500">
          <Filter className="h-3.5 w-3.5" />
          {meta.total ?? 0} scan{meta.total === 1 ? '' : 's'} stored
          {status ? ` • ${titleCase(status)}` : ''}
          {plant ? ` • ${plant}` : ''}
        </p>
      </div>

      {error ? (
        <ErrorMessage
          title="Could not load your history"
          message={error}
          onDismiss={reload}
          className="mb-6"
        />
      ) : null}

      {/* -------------------------------------------------------------- list */}
      {loading ? (
        <SkeletonList count={4} />
      ) : predictions.length > 0 ? (
        <>
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onDelete={handleDelete}
                deleting={deletingId === prediction.id}
              />
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onChange={setPage}
            label="scans"
          />
        </>
      ) : (
        <EmptyState
          icon={History}
          title={hasFilters ? 'No scans match these filters' : 'No predictions yet'}
          message={
            hasFilters
              ? 'Try a different search term, plant or status.'
              : 'Analyse your first leaf image and it will appear here with its remedy plan.'
          }
          actionTo={hasFilters ? undefined : '/detect'}
          actionLabel={hasFilters ? undefined : 'Detect a disease'}
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
    </div>
  );
}