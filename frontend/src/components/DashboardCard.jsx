import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Statistic tile used on both dashboards.
 *
 * @param {{ label: string, value: number|string, hint?: string,
 *           icon?: React.ComponentType<{className?: string}>,
 *           to?: string, tone?: 'leaf'|'sky'|'amber'|'violet' }} props
 */
export default function DashboardCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  tone = 'leaf',
}) {
  const tones = {
    leaf: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
  };

  const content = (
    <div className="card card-hover flex items-center gap-4 p-5">
      {Icon ? (
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tracking-tight text-leaf-900 dark:text-leaf-50">{value}</p>
        <p className="truncate text-sm font-medium text-leaf-600 dark:text-leaf-400">{label}</p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-leaf-500 dark:text-leaf-500">{hint}</p>
        ) : null}
      </div>

      {to ? <ArrowRight className="h-4 w-4 shrink-0 text-leaf-400" /> : null}
    </div>
  );

  return to ? (
    <Link to={to} className="block focus-visible:ring-offset-2">
      {content}
    </Link>
  ) : (
    content
  );
}