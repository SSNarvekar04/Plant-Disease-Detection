import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Leaf, Search, SlidersHorizontal, X } from 'lucide-react';
import { diseaseService } from '../services';
import { useAsyncData } from '../hooks/useAsyncData';
import { useDebounce } from '../hooks/useDebounce';
import { SUPPORTED_PLANTS, severityStyle } from '../utils/constants';
import DiseaseCard, { DiseaseCardSkeleton } from '../components/DiseaseCard';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Pagination from '../components/Pagination';
import LinkButton from '../components/LinkButton';

const SORT_OPTIONS = [
  { value: 'diseaseName', label: 'Name (A-Z)' },
  { value: 'plantName', label: 'Plant (A-Z)' },
  { value: 'severity', label: 'Severity' },
  { value: 'updatedAt', label: 'Recently updated' },
];

const PAGE_SIZE = 9;

/**
 * Public, searchable disease knowledge base.
 *
 * The filter state lives in the URL query string, so a filtered view can be
 * bookmarked or shared and the Home page crop tiles can deep-link into it.
 */
export default function DiseaseLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();

  const plantFromUrl = searchParams.get('plant') || '';
  const severityFromUrl = searchParams.get('severity') || '';

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [plant, setPlant] = useState(plantFromUrl);
  const [severity, setSeverity] = useState(severityFromUrl);
  const [sort, setSort] = useState(searchParams.get('sort') || 'diseaseName');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Typing should not fire a request per keystroke.
  const debouncedSearch = useDebounce(search, 400);

  // Plant options come from the database, so a plant added later appears here.
  const { data: options } = useAsyncData(
    useCallback(() => diseaseService.filterOptions(), []),
    []
  );
  const plantOptions = useMemo(() => {
    const fromApi = options?.data?.plants || [];
    const names = fromApi.length ? fromApi : SUPPORTED_PLANTS.map((item) => item.name);
    return [...new Set(names)].sort();
  }, [options]);

  const severityOptions = useMemo(
    () => options?.data?.severities || ['Low', 'Medium', 'High', 'Critical'],
    [options]
  );

  const loadDiseases = useCallback(
    () =>
      diseaseService.list({
        search: debouncedSearch || undefined,
        plant: plant || undefined,
        severity: severity || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    [debouncedSearch, plant, severity, sort, page]
  );

  const { data, loading, error, reload } = useAsyncData(loadDiseases, [
    debouncedSearch,
    plant,
    severity,
    sort,
    page,
  ]);

  const diseases = data?.data || [];
  const pagination = data?.pagination || {};

  // Any filter change returns to the first page, otherwise the user can land
  // on an empty page 4.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, plant, severity, sort]);

  // Keep the URL in sync with the filter state.
  useEffect(() => {
    const next = {};
    if (debouncedSearch) next.search = debouncedSearch;
    if (plant) next.plant = plant;
    if (severity) next.severity = severity;
    if (sort !== 'diseaseName') next.sort = sort;
    if (page > 1) next.page = String(page);
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, plant, severity, sort, page, setSearchParams]);

  const hasFilters = Boolean(search || plant || severity);
  const clearFilters = () => {
    setSearch('');
    setPlant('');
    setSeverity('');
    setPage(1);
  };

  const activeFilterCount = [plant, severity].filter(Boolean).length;

  return (
    <>
      {/* ============================================================== header */}
      <section className="border-b border-leaf-100 bg-white py-12 sm:py-14 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Disease library</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Diseases, symptoms and remedies
            </h1>
            <p className="mt-4 text-pretty leading-relaxed text-leaf-700 dark:text-leaf-300">
              Browse the knowledge base that powers every detection result. Each record describes
              the symptoms, the conditions that favour the disease, the available treatments and
              how to prevent it.
            </p>
          </div>

          {/* Search + filters */}
          <div className="mx-auto mt-9 max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-leaf-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by disease, plant or description..."
                  aria-label="Search diseases"
                  className="input pl-10"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-leaf-500 hover:bg-leaf-100 hover:text-leaf-700 dark:hover:bg-leaf-800"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="btn-secondary sm:hidden"
                aria-expanded={filtersOpen}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount ? (
                  <span className="badge bg-leaf-600 text-white">{activeFilterCount}</span>
                ) : null}
              </button>
            </div>

            {/* Filter panel */}
            <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="plant-filter" className="label">
                    Plant
                  </label>
                  <select
                    id="plant-filter"
                    value={plant}
                    onChange={(event) => setPlant(event.target.value)}
                    className="input"
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
                  <label htmlFor="severity-filter" className="label">
                    Severity
                  </label>
                  <select
                    id="severity-filter"
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value)}
                    className="input"
                  >
                    <option value="">All severities</option>
                    {severityOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sort-filter" className="label">
                    Sort by
                  </label>
                  <select
                    id="sort-filter"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="input"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active filter summary */}
            {hasFilters ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <SlidersHorizontal className="h-4 w-4 text-leaf-500" />
                {search ? <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} /> : null}
                {plant ? <FilterChip label={plant} onRemove={() => setPlant('')} /> : null}
                {severity ? (
                  <FilterChip
                    label={`${severity} severity`}
                    dot={severityStyle(severity).dot}
                    onRemove={() => setSeverity('')}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-1 text-xs font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ================================================================ list */}
      <section className="py-12 sm:py-14">
        <div className="container-page">
          {error ? (
            <ErrorMessage title="Could not load diseases" message={error} onDismiss={reload} />
          ) : null}

          {/* Loading */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <DiseaseCardSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {/* Empty */}
          {!loading && !error && diseases.length === 0 ? (
            <EmptyState
              icon={Leaf}
              title="No diseases match your filters"
              message={
                hasFilters
                  ? 'Try a different search term, or clear the filters to see the whole library.'
                  : 'The knowledge base is empty. An administrator can add disease records.'
              }
              actionTo={hasFilters ? '/diseases' : '/register'}
              actionLabel={hasFilters ? 'Clear filters' : 'Get started'}
              onAction={hasFilters ? clearFilters : undefined}
            />
          ) : null}

          {/* Results */}
          {!loading && !error && diseases.length > 0 ? (
            <>
              <p className="mb-5 text-sm text-leaf-600 dark:text-leaf-400">
                Showing <span className="font-semibold">{diseases.length}</span> of{' '}
                <span className="font-semibold">{pagination.total ?? diseases.length}</span> diseases
              </p>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {diseases.map((disease) => (
                  <DiseaseCard key={disease.id} disease={disease} />
                ))}
              </div>

              <Pagination
                page={pagination.page || 1}
                totalPages={pagination.totalPages || 1}
                total={pagination.total}
                onChange={setPage}
                label="diseases"
              />
            </>
          ) : null}

          {/* Cross-link to detection */}
          <div className="card mt-12 flex flex-col items-center justify-between gap-4 p-7 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-lg font-semibold">Not sure what you are looking at?</h2>
              <p className="mt-1 text-sm text-leaf-700 dark:text-leaf-300">
                Upload a leaf image and let the model identify the disease for you.
              </p>
            </div>
            <LinkButton to="/register" variant="primary" className="shrink-0">
              Detect a disease
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

/** Removable chip representing one active filter. */
function FilterChip({ label, dot, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf-200 bg-leaf-50 py-1 pl-2.5 pr-1.5 text-xs font-medium dark:border-leaf-700 dark:bg-leaf-900">
      {dot ? <span className={`h-2 w-2 rounded-full ${dot}`} /> : null}
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="rounded-full p-0.5 text-leaf-600 transition hover:bg-leaf-200 hover:text-leaf-800 dark:text-leaf-300 dark:hover:bg-leaf-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}