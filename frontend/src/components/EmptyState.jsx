import { Inbox } from 'lucide-react';
import LinkButton from './LinkButton';

/**
 * Placeholder for an empty result set, with an optional call to action.
 *
 * Having one component means "no data yet" looks the same on the disease
 * library, the prediction history and every admin table.
 *
 * @param {{ icon?: React.ComponentType, title: string, message?: string,
 *           actionTo?: string, actionLabel?: string, onAction?: () => void,
 *           className?: string }} props
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionTo,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`card flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-600 dark:bg-leaf-800 dark:text-leaf-300">
        <Icon className="h-7 w-7" />
      </span>

      <h3 className="mt-5 text-lg font-semibold">{title}</h3>

      {message ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
          {message}
        </p>
      ) : null}

      {actionTo && actionLabel ? (
        <LinkButton to={actionTo} variant="primary" className="mt-6" onClick={onAction}>
          {actionLabel}
        </LinkButton>
      ) : null}
    </div>
  );
}