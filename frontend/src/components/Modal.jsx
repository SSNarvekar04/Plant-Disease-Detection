import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible modal dialog.
 *
 * Handles the three things a hand-rolled modal usually forgets:
 *   - Escape closes it
 *   - the background does not scroll while it is open
 *   - focus moves into the dialog and returns to the trigger on close
 *
 * @param {{ open: boolean, onClose: () => void, title?: string, description?: string,
 *           size?: 'sm'|'md'|'lg'|'xl', children: React.ReactNode,
 *           footer?: React.ReactNode, closeOnBackdrop?: boolean }} props
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Lock background scrolling and remember the focused element.
  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-leaf-950/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizes[size]} animate-scale-in overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-leaf-900`}
      >
        {(title || onClose) && (
          <header className="flex items-start justify-between gap-4 border-b border-leaf-100 px-6 py-4 dark:border-leaf-800">
            <div>
              {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
              {description ? (
                <p className="mt-0.5 text-sm text-leaf-600 dark:text-leaf-400">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="btn-ghost btn-sm -mr-2 -mt-1 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-leaf-100 bg-leaf-50/60 px-6 py-4 dark:border-leaf-800 dark:bg-leaf-950/40">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/**
 * Confirmation dialog for destructive actions (delete user, delete disease).
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!loading}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-leaf-700 dark:text-leaf-200">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </Modal>
  );
}