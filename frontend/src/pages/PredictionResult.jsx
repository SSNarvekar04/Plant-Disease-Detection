import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ScanLine, SearchX, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { predictionService } from '../services';
import { useAsyncAction, useAsyncData } from '../hooks/useAsyncData';
import PredictionResultView from '../components/PredictionResultView';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LinkButton from '../components/LinkButton';
import { FullPageLoader } from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

/**
 * Saved prediction detail (`/predictions/:id`).
 *
 * Uses the same view as the detect flow so a result looks identical whether it
 * was just produced or reopened from history.
 */
export default function PredictionResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsyncData(
    () => predictionService.getById(id),
    [id]
  );

  const { execute: runDelete, loading: deleting } = useAsyncAction(predictionService.remove);

  const handleDelete = async () => {
    if (!window.confirm('Delete this prediction and its stored image? This cannot be undone.')) {
      return;
    }

    try {
      await runDelete(id);
      toast.success('Prediction deleted');
      navigate('/history', { replace: true });
    } catch (thrown) {
      toast.error(thrown?.message || 'The prediction could not be deleted.');
    }
  };

  if (loading) return <FullPageLoader label="Loading prediction" />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorMessage title="Could not load this prediction" message={error} onDismiss={reload} />
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton to="/history" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </LinkButton>
          <LinkButton to="/detect" variant="ghost">
            <ScanLine className="h-4 w-4" />
            Analyse another image
          </LinkButton>
        </div>
      </div>
    );
  }

  const payload = data?.data;

  if (!payload?.prediction) {
    return (
      <EmptyState
        icon={SearchX}
        title="Prediction not found"
        message="This record does not exist, or it was deleted by its owner."
        actionLabel="Back to history"
        actionTo="/history"
      />
    );
  }

  const { prediction } = payload;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:underline dark:text-leaf-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Prediction history
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Saved result</h1>
          {prediction.createdAt ? (
            <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
              Scanned on {formatDate(prediction.createdAt)}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <PredictionResultView
        result={payload}
        showActions={
          <LinkButton to="/detect" variant="secondary">
            <ScanLine className="h-4 w-4" />
            Analyse another image
          </LinkButton>
        }
      />

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={reload}
          className="text-sm font-medium text-leaf-600 hover:underline dark:text-leaf-400"
        >
          Refresh this result
        </button>
      </div>
    </div>
  );
}