import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { MAX_FILE_SIZE_MB, readFileAsDataUrl, validateImageFile } from '../utils/imageValidation';
import ErrorMessage from './ErrorMessage';

/**
 * Drag-and-drop image picker with preview, validation and progress.
 *
 * Responsibilities kept here so `DetectDisease` stays a thin page:
 *   - client side type / size validation (mirrors the backend rules)
 *   - object-URL lifecycle, so previews never leak memory
 *   - upload progress bar
 *   - prevents a second analysis while one is running (spec 20)
 *
 * @param {{ file: File|null, onFileChange: (file: File|null) => void,
 *           onSubmit: (file: File) => Promise<void>,
 *           submitting?: boolean, progress?: number, disabled?: boolean }} props
 */
export default function ImageUploader({
  file,
  onFileChange,
  onSubmit,
  submitting = false,
  progress = 0,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Build (and clean up) the preview URL whenever the selected file changes.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    let url = null;
    let cancelled = false;

    readFileAsDataUrl(file)
      .then((dataUrl) => {
        if (!cancelled) setPreviewUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError('Could not read the selected image. Please choose another file.');
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const isBusy = submitting || disabled;

  /** Validates and stores the chosen file. */
  const acceptFile = useCallback(
    (candidate) => {
      if (!candidate) return;

      const result = validateImageFile(candidate);
      if (!result.valid) {
        setError(result.error);
        onFileChange(null);
        return;
      }

      setError(null);
      onFileChange(candidate);
    },
    [onFileChange]
  );

  const handleInputChange = (event) => {
    acceptFile(event.target.files?.[0] ?? null);
    // Reset the input so choosing the same file twice still fires onChange.
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    acceptFile(event.dataTransfer.files?.[0] ?? null);
  };

  const clearFile = () => {
    onFileChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------------------- dropzone */}
      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isBusy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
            isDragging
              ? 'border-leaf-500 bg-leaf-50 dark:bg-leaf-900/40'
              : 'border-leaf-300 bg-leaf-50/50 hover:border-leaf-400 dark:border-leaf-700 dark:bg-leaf-900/30 dark:hover:border-leaf-600'
          } ${isBusy ? 'opacity-60' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={handleInputChange}
            className="sr-only"
            id="leaf-image-input"
            disabled={isBusy}
          />

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-600 text-white shadow-sm">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="text-lg font-semibold">Upload a plant leaf image</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-leaf-600 dark:text-leaf-400">
            Drag and drop an image here, or choose a file from your device. Clear, well-lit photos
            give the most accurate result.
          </p>

          <button
            type="button"
            className="btn-primary mt-5"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            <ImagePlus className="h-4 w-4" />
            Choose image
          </button>

          <p className="mt-3 text-xs text-leaf-500 dark:text-leaf-500">
            JPG, JPEG or PNG • maximum {MAX_FILE_SIZE_MB} MB
          </p>
        </div>
      ) : (
        /* ------------------------------------------------------------- preview */
        <div className="card overflow-hidden">
          <div className="relative bg-leaf-100 dark:bg-leaf-800">
            <img
              src={previewUrl}
              alt="Selected plant leaf preview"
              className="mx-auto max-h-96 w-full object-contain"
            />

            {!submitting ? (
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove selected image"
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm backdrop-blur transition hover:bg-white dark:bg-leaf-900/90 dark:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-leaf-900 dark:text-leaf-50">{file.name}</p>
              <p className="text-xs text-leaf-600 dark:text-leaf-400">
                {formatFileSize(file.size)}
                {previewUrl ? ' • ready to analyse' : ''}
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => onSubmit(file)}
              disabled={isBusy}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Detect disease
                </>
              )}
            </button>
          </div>

          {/* Upload progress */}
          {submitting && progress > 0 && progress < 100 ? (
            <div className="px-4 pb-4">
              <div className="mb-1.5 flex justify-between text-xs text-leaf-600 dark:text-leaf-400">
                <span>Uploading image...</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                <div
                  className="h-full rounded-full bg-leaf-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Photo quality tips */}
      <div className="rounded-2xl border border-leaf-100 bg-leaf-50/60 p-4 dark:border-leaf-800 dark:bg-leaf-900/40">
        <p className="text-sm font-semibold text-leaf-900 dark:text-leaf-100">For an accurate result</p>
        <ul className="mt-2 grid gap-1.5 text-sm text-leaf-700 sm:grid-cols-2 dark:text-leaf-300">
          {[
            'Fill the frame with a single leaf',
            'Use natural daylight, avoid shadows',
            'Keep the leaf surface flat and in focus',
            'Avoid filters, edits or screenshots',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}