import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bug,
  FlaskConical,
  Info,
  Leaf,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { confidenceStyle, severityStyle, sourceStyle, statusStyle } from '../utils/constants';
import { formatPercent, formatPlantDisease } from '../utils/formatters';

/** Same sections as the disease details page, so a result reads consistently. */
const REMEDY_SECTIONS = [
  { key: 'symptoms', label: 'Symptoms', icon: Stethoscope, tone: 'text-red-600 dark:text-red-400' },
  { key: 'causes', label: 'Causes', icon: Bug, tone: 'text-amber-600 dark:text-amber-400' },
  { key: 'organicRemedies', label: 'Organic remedies', icon: Sprout, tone: 'text-leaf-600 dark:text-leaf-400' },
  { key: 'chemicalTreatment', label: 'Chemical treatment', icon: FlaskConical, tone: 'text-sky-600 dark:text-sky-400' },
  { key: 'prevention', label: 'Prevention', icon: ShieldCheck, tone: 'text-leaf-600 dark:text-leaf-400' },
  { key: 'precautions', label: 'Precautions', icon: ShieldAlert, tone: 'text-orange-600 dark:text-orange-400' },
];

/**
 * The full result view: uploaded image, diagnosis, confidence, alternative
 * classes and the complete remedy plan.
 *
 * Shared by the detect flow (result shown right after the upload) and by the
 * prediction detail page, so a result looks identical wherever it appears.
 *
 * @param {{ result: {prediction: object, disease: object|null, remedyNotice?: string|null,
 *           lowConfidenceWarning?: string|null, disclaimer?: string},
 *           showActions?: React.ReactNode }} props
 */
export default function PredictionResultView({ result, showActions = null }) {
  if (!result?.prediction) return null;

  const { prediction, disease, remedyNotice, lowConfidenceWarning, disclaimer } = result;
  const status = statusStyle(prediction.predictionStatus);
  const source = sourceStyle(prediction.predictionSource);
  const confidence = confidenceStyle(prediction.confidence);
  const severity = severityStyle(disease?.severity);
  const topPredictions = prediction.topPredictions || [];
  const isHealthy = prediction.predictionStatus === 'healthy';

  // Only show sections the knowledge-base record actually has.
  const sections = disease ? REMEDY_SECTIONS.filter((item) => (disease[item.key] || []).length) : [];

  return (
    <div className="space-y-6">
      {/* ======================================================= headline card */}
      <section className="card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
          {/* Image */}
          <div className="relative bg-leaf-100 dark:bg-leaf-800">
            {prediction.imageUrl ? (
              <img
                src={prediction.imageUrl}
                alt={`Uploaded leaf classified as ${prediction.diseaseName}`}
                className="h-full max-h-80 w-full object-cover lg:max-h-none"
              />
            ) : (
              <div className="flex h-64 items-center justify-center lg:h-full">
                <Leaf className="h-12 w-12 text-leaf-500" />
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${status.badge}`}>{status.label}</span>
              <span className={`badge ${source.badge}`}>{source.label}</span>
              {disease?.severity && !isHealthy ? (
                <span className={`badge ${severity.badge}`}>{severity.label} severity</span>
              ) : null}
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-leaf-600 dark:text-leaf-400">
              {prediction.plantName}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {prediction.diseaseName}
            </h2>

            {/* Confidence */}
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-leaf-700 dark:text-leaf-300">
                  Model confidence
                  <span className="ml-1.5 text-xs text-leaf-500">({confidence.label})</span>
                </span>
                <span className={`text-lg font-bold ${confidence.text}`}>
                  {formatPercent(prediction.confidence)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${confidence.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, prediction.confidence ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Inline notices */}
            {prediction.notes ? (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-leaf-50 p-3.5 text-sm text-leaf-800 dark:bg-leaf-900/60 dark:text-leaf-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600 dark:text-leaf-400" />
                {prediction.notes}
              </p>
            ) : null}

            {lowConfidenceWarning ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                {lowConfidenceWarning}
              </p>
            ) : null}

            {showActions ? <div className="mt-6 flex flex-wrap gap-3">{showActions}</div> : null}
          </div>
        </div>
      </section>

      {/* ================================================== alternative classes */}
      {topPredictions.length > 1 ? (
        <section className="card p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
            <h3 className="text-lg font-semibold">Other likely classes</h3>
          </div>
          <p className="mt-1.5 text-sm text-leaf-600 dark:text-leaf-400">
            The model's next best guesses. Similar-looking conditions are easy to confuse, so compare
            the symptoms before treating.
          </p>

          <ul className="mt-5 space-y-3">
            {topPredictions.slice(1).map((item, index) => (
              <li key={`${item.class_name || item.className || item.disease}-${index}`}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {item.plant ? `${item.plant} — ${item.disease}` : item.disease || item.class_name}
                  </span>
                  <span className="text-leaf-600 dark:text-leaf-400">
                    {formatPercent(item.confidence)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                  <div
                    className="h-full rounded-full bg-leaf-300 dark:bg-leaf-700"
                    style={{ width: `${Math.min(100, Math.max(2, item.confidence ?? 0))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ============================================================ remedies */}
      {sections.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Remedy plan</h2>
              <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
                {formatPlantDisease(prediction.plantName, prediction.diseaseName)}
              </p>
            </div>

            {disease?.id ? (
              <Link
                to={`/diseases/${disease.id}`}
                className="text-sm font-semibold text-leaf-600 underline-offset-2 hover:underline dark:text-leaf-400"
              >
                Open the full disease record
              </Link>
            ) : null}
          </div>

          {disease?.description ? (
            <div className="card p-6">
              <p className="text-pretty leading-relaxed text-leaf-800 dark:text-leaf-200">
                {disease.description}
              </p>
              {(disease.pathogenType || disease.favourableConditions) && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-leaf-600 dark:text-leaf-400">
                  {disease.pathogenType ? (
                    <span>
                      <strong className="font-semibold">Pathogen:</strong> {disease.pathogenType}
                    </span>
                  ) : null}
                  {disease.favourableConditions ? (
                    <span>
                      <strong className="font-semibold">Favours:</strong>{' '}
                      {disease.favourableConditions}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.key} className="card p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-50 dark:bg-leaf-900">
                    <Icon className={`h-5 w-5 ${section.tone}`} />
                  </span>
                  <h3 className="text-base font-semibold">{section.label}</h3>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {disease[section.key].map((item, index) => (
                    <li key={index} className="flex gap-2.5 text-sm leading-relaxed">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500"
                        aria-hidden="true"
                      />
                      <span className="text-leaf-800 dark:text-leaf-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      ) : null}

      {/* No remedy record in the knowledge base */}
      {remedyNotice ? (
        <div className="card flex items-start gap-4 border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            <p className="font-semibold">No remedy information available yet</p>
            <p className="mt-1">{remedyNotice}</p>
          </div>
        </div>
      ) : null}

      {/* Disclaimer */}
      {disclaimer ? (
        <p className="flex items-start gap-2.5 rounded-xl bg-soil-100 p-4 text-xs leading-relaxed text-leaf-700 dark:bg-leaf-900/50 dark:text-leaf-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {disclaimer}
        </p>
      ) : null}
    </div>
  );
}