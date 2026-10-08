import { Loader2 } from 'lucide-react';

/**
 * Spinner shown while data or a prediction is loading.
 *
 * @param {{ size?: 'sm'|'md'|'lg', label?: string, className?: string }} props
 */
export default function LoadingSpinner({ size = 'md', label, className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <Loader2 className={`${sizes[size]} animate-spin text-leaf-600 dark:text-leaf-400`} />
      {label ? (
        <p className="text-sm font-medium text-leaf-700 dark:text-leaf-300">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/**
 * Full-page loader used as the Suspense / route fallback.
 */
export function FullPageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

/**
 * Card-shaped skeleton placeholder, so the layout does not jump while loading.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card animate-pulse p-5 ${className}`}>
      <div className="mb-4 h-40 w-full rounded-xl bg-leaf-100 dark:bg-leaf-800" />
      <div className="mb-2 h-4 w-2/3 rounded bg-leaf-100 dark:bg-leaf-800" />
      <div className="mb-2 h-3 w-full rounded bg-leaf-100 dark:bg-leaf-800" />
      <div className="h-3 w-4/5 rounded bg-leaf-100 dark:bg-leaf-800" />
    </div>
  );
}

/** Row of skeletons for list pages. */
export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card animate-pulse flex items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-xl bg-leaf-100 dark:bg-leaf-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-leaf-100 dark:bg-leaf-800" />
            <div className="h-3 w-1/2 rounded bg-leaf-100 dark:bg-leaf-800" />
          </div>
        </div>
      ))}
    </div>
  );
}