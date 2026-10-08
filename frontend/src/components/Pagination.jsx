import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page navigation for the paginated list endpoints.
 *
 * The backend returns `{ page, limit, total, totalPages, ... }`, so the button
 * range is derived from `totalPages` and disabled at the edges.
 *
 * @param {{ page: number, totalPages: number, total?: number,
 *           onChange: (page: number) => void, label?: string }} props
 */
export default function Pagination({ page = 1, totalPages = 1, total, onChange, label = 'results' }) {
  if (totalPages <= 1) return null;

  // Show a short window around the current page, e.g. 1 ... 4 5 6 ... 12
  const windowSize = 2;
  const pages = [];
  for (let index = 1; index <= totalPages; index += 1) {
    const isEdge = index === 1 || index === totalPages;
    const isNear = Math.abs(index - page) <= windowSize;
    if (isEdge || isNear) pages.push(index);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const go = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    onChange(next);
  };

  return (
    <nav
      className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
      aria-label="Pagination"
    >
      <p className="text-sm text-leaf-600 dark:text-leaf-400">
        {typeof total === 'number' ? `${total} ${label}` : ''}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="btn-ghost btn-sm disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <ul className="flex items-center gap-1">
          {pages.map((entry, index) =>
            entry === '…' ? (
              <li key={`gap-${index}`} className="px-2 text-sm text-leaf-500">
                &hellip;
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => go(entry)}
                  aria-current={entry === page ? 'page' : undefined}
                  className={`h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold transition ${
                    entry === page
                      ? 'bg-leaf-600 text-white'
                      : 'text-leaf-700 hover:bg-leaf-100 dark:text-leaf-300 dark:hover:bg-leaf-800'
                  }`}
                >
                  {entry}
                </button>
              </li>
            )
          )}
        </ul>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost btn-sm disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}