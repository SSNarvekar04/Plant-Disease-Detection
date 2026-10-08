import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const VARIANTS = {
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200',
    Icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
    Icon: TriangleAlert,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    wrapper: 'border-leaf-200 bg-leaf-50 text-leaf-900 dark:border-leaf-800 dark:bg-leaf-900/60 dark:text-leaf-100',
    Icon: CheckCircle2,
    iconColor: 'text-leaf-600 dark:text-leaf-400',
  },
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-100',
    Icon: Info,
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
};

/**
 * Inline, dismissible message block.
 *
 * Used for form validation summaries, low-confidence warnings and the
 * "no remedy record yet" notice, so every error in the app looks the same.
 *
 * @param {{ variant?: 'error'|'warning'|'success'|'info', title?: string, message?: string|React.ReactNode, onDismiss?: () => void, className?: string }} props
 */
export default function ErrorMessage({
  variant = 'error',
  title,
  message,
  onDismiss,
  className = '',
}) {
  if (!message) return null;

  const { wrapper, Icon, iconColor } = VARIANTS[variant] || VARIANTS.error;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${wrapper} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
      <div className="flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-0.5 leading-relaxed' : 'leading-relaxed'}>{message}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold opacity-70 transition hover:opacity-100"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

/**
 * Renders the `{ field, message }[]` array returned by the API as a list of
 * problems under a form.
 */
export function FieldErrorList({ errors = [] }) {
  if (!errors.length) return null;
  return (
    <ErrorMessage
      variant="error"
      title="Please correct the following"
      message={
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {errors.map((item, index) => (
            <li key={`${item.field}-${index}`}>{item.message}</li>
          ))}
        </ul>
      }
    />
  );
}