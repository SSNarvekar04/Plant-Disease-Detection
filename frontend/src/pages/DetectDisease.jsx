import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ScanLine, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { predictionService } from '../services';
import { useAsyncAction } from '../hooks/useAsyncData';
import ImageUploader from '../components/ImageUploader';
import PredictionResultView from '../components/PredictionResultView';
import ErrorMessage from '../components/ErrorMessage';
import LinkButton from '../components/LinkButton';

/**
 * Detection page.
 *
 * The analysis request itself is the "save" action: `POST /api/predictions`
 * classifies the image *and* writes it to the user's history, so there is no
 * second confirmation step that could be forgotten. The result is rendered on
 * this page for immediacy, and the saved record stays reachable at
 * `/predictions/:id` and in the history list.
 */
export default function DetectDisease() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const { execute, loading, error, clearError } = useAsyncAction(predictionService.create);

  const analyse = async (selectedFile) => {
    setResult(null);
    setProgress(0);
    try {
      const response = await execute(selectedFile, setProgress);
      setResult(response.data);
      toast.success(response.message || 'Analysis complete');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (thrown) {
      toast.error(thrown?.message || 'The analysis failed. Please try again.');
    }
  };

  /** Starts a fresh detection, keeping the page on the uploader. */
  const reset = () => {
    setResult(null);
    setFile(null);
    setProgress(0);
    clearError();
  };

  // ---- Result view ------------------------------------------------------
  if (result?.prediction) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detection result</h1>
            <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
              This scan has been saved to your prediction history.
            </p>
          </div>
        </div>

        <PredictionResultView
          result={result}
          showActions={
            <>
              <button type="button" onClick={reset} className="btn-primary">
                <ScanLine className="h-4 w-4" />
                Analyse another image
              </button>
              <LinkButton to="/history" variant="secondary">
                <History className="h-4 w-4" />
                View full history
              </LinkButton>
              {result.prediction.id ? (
                <LinkButton to={`/predictions/${result.prediction.id}`} variant="ghost">
                  Open saved record
                </LinkButton>
              ) : null}
            </>
          }
        />
      </div>
    );
  }

  // ---- Uploader ---------------------------------------------------------
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Detect plant disease</h1>
        <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
          Upload a photo of a single leaf. The AI model identifies the condition and the system
          looks up the matching remedy plan.
        </p>
      </div>

      {error ? (
        <ErrorMessage
          title="The detection failed"
          message={error}
          onDismiss={clearError}
          className="mb-6"
        />
      ) : null}

      <div className="card p-5 sm:p-7">
        <ImageUploader
          file={file}
          onFileChange={setFile}
          onSubmit={analyse}
          submitting={loading}
          progress={progress}
        />
      </div>

      {/* What happens next */}
      <div className="card mt-6 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">What happens when you click detect</h2>
            <ol className="mt-3 space-y-2 text-sm text-leaf-700 dark:text-leaf-300">
              {[
                'The image is checked, stored, and sent to the TensorFlow service.',
                'The model returns the most likely disease and a confidence score.',
                'The result is matched against the disease knowledge base for remedies.',
                'The scan is added to your history so you can compare it later.',
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-[11px] font-bold text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* History shortcut */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:underline dark:text-leaf-400"
        >
          <History className="h-4 w-4" />
          Browse your previous scans instead
        </button>
      </div>
    </div>
  );
}