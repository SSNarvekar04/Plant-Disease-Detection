import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bug,
  CloudSun,
  FlaskConical,
  Leaf,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Sprout,
  TriangleAlert,
} from 'lucide-react';
import { diseaseService } from '../services';
import { useAsyncData } from '../hooks/useAsyncData';
import { severityStyle } from '../utils/constants';
import { formatShortDate } from '../utils/formatters';
import { FullPageLoader } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import LinkButton from '../components/LinkButton';

/** Ordered sections of the knowledge base, each with its own icon. */
const SECTIONS = [
  { key: 'symptoms', label: 'Symptoms', icon: Stethoscope, tone: 'text-red-600 dark:text-red-400' },
  { key: 'causes', label: 'Causes', icon: Bug, tone: 'text-amber-600 dark:text-amber-400' },
  {
    key: 'organicRemedies',
    label: 'Organic remedies',
    icon: Sprout,
    tone: 'text-leaf-600 dark:text-leaf-400',
  },
  {
    key: 'chemicalTreatment',
    label: 'Chemical treatment',
    icon: FlaskConical,
    tone: 'text-sky-600 dark:text-sky-400',
  },
  { key: 'prevention', label: 'Prevention', icon: ShieldCheck, tone: 'text-leaf-600 dark:text-leaf-400' },
  {
    key: 'precautions',
    label: 'Precautions',
    icon: ShieldAlert,
    tone: 'text-orange-600 dark:text-orange-400',
  },
];

/**
 * Full knowledge-base entry for one disease: summary, symptoms, causes,
 * remedies, prevention and precautions.
 */
export default function DiseaseDetails() {
  const { id } = useParams();

  const { data, loading, error, reload } = useAsyncData(
    useCallback(() => diseaseService.getById(id), [id]),
    [id]
  );

  if (loading) return <FullPageLoader label="Loading disease details..." />;

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorMessage
          title="Could not load this disease"
          message={error}
          onDismiss={reload}
          className="mx-auto max-w-2xl"
        />
        <div className="mt-8 text-center">
          <LinkButton to="/diseases" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to the disease library
          </LinkButton>
        </div>
      </div>
    );
  }

  const disease = data?.data;
  if (!disease) return null;

  const severity = severityStyle(disease.severity);
  const isHealthy = /healthy/i.test(disease.diseaseName);

  // Only render sections that actually have content.
  const sections = SECTIONS.filter((section) => (disease[section.key] || []).length > 0);

  return (
    <>
      {/* ============================================================== header */}
      <section className="border-b border-leaf-100 bg-white dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page py-10 sm:py-12">
          <Link
            to="/diseases"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:text-leaf-700 dark:text-leaf-400 dark:hover:text-leaf-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Disease library
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200">
                  <Leaf className="h-3.5 w-3.5" />
                  {disease.plantName}
                </span>
                <span className={`badge ${severity.badge}`}>{severity.label} severity</span>
                {disease.isActive === false ? (
                  <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Inactive
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{disease.diseaseName}</h1>

              <p className="mt-4 text-pretty text-base leading-relaxed text-leaf-700 dark:text-leaf-300">
                {disease.description}
              </p>

              {/* Context facts */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {disease.pathogenType ? (
                  <FactCard icon={Bug} label="Pathogen type" value={disease.pathogenType} />
                ) : null}
                {disease.favourableConditions ? (
                  <FactCard
                    icon={CloudSun}
                    label="Favoured conditions"
                    value={disease.favourableConditions}
                  />
                ) : null}
              </div>
            </div>

            {/* Image */}
            <div className="card overflow-hidden">
              {disease.imageUrl ? (
                <img
                  src={disease.imageUrl}
                  alt={`${disease.plantName} — ${disease.diseaseName}`}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-56 w-full flex-col items-center justify-center gap-2 bg-leaf-50 text-leaf-600 dark:bg-leaf-900 dark:text-leaf-400">
                  <Leaf className="h-10 w-10" />
                  <span className="text-xs font-medium">No reference image</span>
                </div>
              )}

              <div className="space-y-3 p-5">
                <p className="text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                  {isHealthy
                    ? 'A healthy leaf has no disease symptoms. Keep following the prevention advice below.'
                    : severity.description}
                </p>

                <LinkButton to="/detect" variant="primary" className="btn-block">
                  Check your own plant
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ sections */}
      <section className="py-12 sm:py-14">
        <div className="container-page space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.key} className="card p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-50 dark:bg-leaf-900">
                    <Icon className={`h-5 w-5 ${section.tone}`} />
                  </span>
                  <h2 className="text-lg font-semibold">{section.label}</h2>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {disease[section.key].map((item, index) => (
                    <li
                      key={`${section.key}-${index}`}
                      className="flex gap-2.5 rounded-xl bg-soil-50 p-3.5 text-sm leading-relaxed dark:bg-leaf-900/60"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
                        aria-hidden="true"
                      />
                      <span className="text-leaf-800 dark:text-leaf-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============================================================== footer */}
      <section className="pb-16">
        <div className="container-page space-y-6">
          {/* Safety note */}
          <div className="card flex items-start gap-4 border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
              <p className="font-semibold">Use pesticides safely</p>
              <p className="mt-1">
                Chemical treatments must be applied at the labelled dose, worn with proper protective
                equipment and kept away from children, livestock and water bodies. Many of these
                products are unsafe shortly before harvest, so always check the pre-harvest interval.
                Prefer the organic options when the infection is still mild.
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-leaf-600 sm:flex-row dark:text-leaf-400">
            <p>
              Last updated on {formatShortDate(disease.updatedAt) || formatShortDate(disease.createdAt)}
            </p>
            <div className="flex gap-3">
              <Link to="/diseases" className="font-medium underline-offset-2 hover:underline">
                All diseases
              </Link>
              <Link
                to={`/diseases?plant=${encodeURIComponent(disease.plantName)}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                More {disease.plantName.toLowerCase()} diseases
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Small labelled fact in the header (pathogen type, conditions, ...). */
function FactCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-leaf-100 bg-soil-50 p-4 dark:border-leaf-800 dark:bg-leaf-900/60">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-leaf-600 dark:text-leaf-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium">{value}</p>
    </div>
  );
}