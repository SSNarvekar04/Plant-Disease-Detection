import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { statusStyle, sourceStyle, confidenceStyle } from '../utils/constants';
import { formatPercent, formatRelative } from '../utils/formatters';

/**
 * Row card for a prediction in the history / admin lists.
 *
 * @param {object} prediction  Prediction document
 * @param {{ onDelete?: (prediction: object) => void, showUser?: boolean, deleting?: boolean }} props
 */
export default function PredictionCard({ prediction, onDelete, showUser = false, deleting = false }) {
  const status = statusStyle(prediction.predictionStatus);
  const source = sourceStyle(prediction.predictionSource);
  const confidence = confidenceStyle(prediction.confidence);

  return (
    <article className="card card-hover overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Thumbnail */}
        <Link
          to={`/predictions/${prediction.id}`}
          className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-leaf-100 dark:bg-leaf-800 sm:h-24 sm:w-24"
          aria-label={`View prediction for ${prediction.diseaseName}`}
        >
          {prediction.imageUrl ? (
            <img
              src={prediction.imageUrl}
              alt={`Leaf classified as ${prediction.diseaseName}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-leaf-600 dark:text-leaf-400">
              No image
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600 dark:text-leaf-400">
                {prediction.plantName}
              </p>
              <Link
                to={`/predictions/${prediction.id}`}
                className="block truncate text-base font-semibold text-leaf-900 hover:text-leaf-600 dark:text-leaf-50 dark:hover:text-leaf-400"
              >
                {prediction.diseaseName}
              </Link>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className={`badge ${status.badge}`}>{status.label}</span>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(prediction)}
                  disabled={deleting}
                  aria-label={`Delete prediction for ${prediction.diseaseName}`}
                  className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-leaf-600 dark:text-leaf-400">Confidence</span>
              <span className={`font-semibold ${confidence.text}`}>
                {formatPercent(prediction.confidence)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
              <div
                className={`h-full rounded-full ${confidence.bar}`}
                style={{ width: `${Math.min(100, Math.max(2, prediction.confidence ?? 0))}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-leaf-600 dark:text-leaf-400">
            <span>{formatRelative(prediction.createdAt)}</span>
            <span aria-hidden="true">•</span>
            <span className={`badge ${source.badge}`}>{source.label}</span>
            {showUser && prediction.user ? (
              <>
                <span aria-hidden="true">•</span>
                <span className="truncate">{prediction.user.name}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}