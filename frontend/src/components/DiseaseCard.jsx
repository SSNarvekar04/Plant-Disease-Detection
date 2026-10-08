import { Link } from 'react-router-dom';
import { Eye, ImageOff, Leaf } from 'lucide-react';
import { severityStyle } from '../utils/constants';
import { formatShortDate } from '../utils/formatters';

/**
 * Card for a single disease in the knowledge base.
 * Clicking it opens the full disease details page.
 *
 * @param {object} disease
 */
export default function DiseaseCard({ disease }) {
  const severity = severityStyle(disease.severity);

  return (
    <Link
      to={`/diseases/${disease.id}`}
      className="card card-hover group flex flex-col overflow-hidden focus-visible:ring-offset-0"
    >
      {/* Header band */}
      <div className={`h-1.5 w-full ${severity.bar}`} aria-hidden="true" />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
              <Leaf className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-leaf-600 dark:text-leaf-400">
                {disease.plantName}
              </p>
              <h3 className="truncate text-base font-semibold text-leaf-900 dark:text-leaf-50">
                {disease.diseaseName}
              </h3>
            </div>
          </div>
          <span className={`badge shrink-0 ${severity.badge}`}>{severity.label}</span>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
          {disease.description}
        </p>

        {/* First symptom, to hint at what the disease looks like */}
        {disease.symptoms?.length ? (
          <p className="mt-3 line-clamp-1 text-xs text-leaf-600 dark:text-leaf-400">
            <span className="font-semibold">Key symptom:</span> {disease.symptoms[0]}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-leaf-100 pt-3 text-xs dark:border-leaf-800">
          <span className="inline-flex items-center gap-1 text-leaf-600 dark:text-leaf-400">
            <Eye className="h-3.5 w-3.5" />
            View details
          </span>
          <span className="text-leaf-500 dark:text-leaf-500">
            {disease.createdAt ? formatShortDate(disease.createdAt) : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Placeholder card used while the list is loading. */
export function DiseaseCardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="h-1.5 w-full rounded bg-leaf-100 dark:bg-leaf-800" />
      <div className="mt-4 flex gap-3">
        <div className="h-9 w-9 rounded-xl bg-leaf-100 dark:bg-leaf-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-leaf-100 dark:bg-leaf-800" />
          <div className="h-4 w-2/3 rounded bg-leaf-100 dark:bg-leaf-800" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-leaf-100 dark:bg-leaf-800" />
        <div className="h-3 w-5/6 rounded bg-leaf-100 dark:bg-leaf-800" />
      </div>
    </div>
  );
}