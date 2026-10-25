import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_PLANTS } from '../utils/constants';
import LinkButton from '../components/LinkButton';

/** The four steps of the detection flow. */
const STEPS = [
  {
    icon: ScanLine,
    title: 'Upload the leaf image',
    text: 'Take a clear photo of a single affected leaf in daylight, or pick an existing image from your device.',
  },
  {
    icon: Brain,
    title: 'AI analyses the image',
    text: 'The Plant.id API classifies the plant species and scores the most likely diseases from your photo.',
  },
  {
    icon: Sparkles,
    title: 'Get the diagnosis',
    text: 'The predicted plant, disease and confidence score appear within seconds.',
  },
  {
    icon: ClipboardCheck,
    title: 'Follow the remedy plan',
    text: 'Symptoms, causes, chemical treatment, organic remedies, prevention and precautions.',
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'Plant.id AI analysis',
    text: 'The Plant.id API identifies the plant species and the most likely disease, with a confidence score.',
  },
  {
    icon: BookOpen,
    title: 'Curated disease knowledge base',
    text: 'Every detection links to a detailed record with symptoms, causes and treatment options.',
  },
  {
    icon: Sprout,
    title: 'Organic and chemical remedies',
    text: 'Practical options for both chemical control and chemical-free / biological approaches.',
  },
  {
    icon: ShieldCheck,
    title: 'Prevention checklist',
    text: 'Agronomic advice that reduces the chance of the disease returning next season.',
  },
  {
    icon: TrendingUp,
    title: 'History and dashboards',
    text: 'Every scan is saved so you can track which diseases keep appearing in your field.',
  },
  {
    icon: CheckCircle2,
    title: 'Honest confidence reporting',
    text: 'Low-confidence results are flagged instead of being presented as a certain diagnosis.',
  },
];

const BENEFITS = [
  {
    title: 'Faster field decisions',
    text: 'Get a likely diagnosis in seconds instead of waiting days for a lab report.',
  },
  {
    title: 'Lower input costs',
    text: 'Organic remedies and prevention steps reduce unnecessary pesticide spending.',
  },
  {
    title: 'Fewer crop losses',
    text: 'Early identification limits spread to neighbouring plants in the same field.',
  },
  {
    title: 'Accessible anywhere',
    text: 'Runs on a phone browser, so it works in the field where connectivity is limited.',
  },
];

/**
 * Landing page: hero, how it works, features, supported plants and benefits.
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const detectPath = isAuthenticated ? '/detect' : '/register';

  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative overflow-hidden border-b border-leaf-100 bg-gradient-to-b from-leaf-50 via-soil-50 to-soil-50 dark:border-leaf-800 dark:from-leaf-900/40 dark:via-leaf-950 dark:to-leaf-950">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-leaf-200/40 blur-3xl dark:bg-leaf-700/20" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-leaf-300/30 blur-3xl dark:bg-leaf-800/20" />

        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <div className="animate-fade-in-up">
              <span className="badge border border-leaf-200 bg-white text-leaf-700 dark:border-leaf-700 dark:bg-leaf-900/60 dark:text-leaf-300">
                <Leaf className="h-3.5 w-3.5" />
                Powered by the Plant.id API
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Detect plant diseases{' '}
                <span className="text-leaf-600 dark:text-leaf-400">using AI</span>
              </h1>

              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-leaf-700 dark:text-leaf-300">
                Upload a plant leaf image and get disease information, treatment recommendations
                and prevention methods — in seconds, from any device.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton to={detectPath} variant="primary" className="text-base">
                  <ScanLine className="h-5 w-5" />
                  Detect plant disease
                </LinkButton>
                <LinkButton to="/diseases" variant="secondary" className="text-base">
                  Browse the disease library
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                {[
                  { value: '29', label: 'Disease classes' },
                  { value: '7', label: 'Crop species' },
                  { value: '100%', label: 'Free to use' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-2xl font-bold text-leaf-700 dark:text-leaf-300">{stat.value}</dt>
                    <dd className="text-xs font-medium text-leaf-600 dark:text-leaf-500">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Illustration */}
            <div className="animate-fade-in-up [animation-delay:120ms]">
              <LeafIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= how it works */}
      <section className="border-b border-leaf-100 py-16 sm:py-20 dark:border-leaf-800">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Four steps from photo to remedy
            </h2>
            <p className="mt-3 text-pretty text-leaf-700 dark:text-leaf-300">
              No laboratory and no specialist appointment needed — a phone camera is enough.
            </p>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="card card-hover relative p-6">
                  {/* Step number */}
                  <span className="absolute right-5 top-5 text-3xl font-bold text-leaf-100 dark:text-leaf-800">
                    {index + 1}
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                    <Icon className="h-6 w-6" />
                  </span>

                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ============================================================= features */}
      <section className="border-b border-leaf-100 bg-white py-16 sm:py-20 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need after the diagnosis
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="card card-hover p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-600/10 text-leaf-600 dark:bg-leaf-800 dark:text-leaf-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                    {feature.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================== supported plants */}
      <section className="border-b border-leaf-100 py-16 sm:py-20 dark:border-leaf-800">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Supported plants</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Seven crops, 29 conditions
            </h2>
            <p className="mt-3 text-pretty text-leaf-700 dark:text-leaf-300">
              The model covers the most common diseases of these crops, including healthy leaves so
              it can tell you when nothing is wrong.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {SUPPORTED_PLANTS.map((plant) => (
              <Link
                key={plant.name}
                to={`/diseases?plant=${encodeURIComponent(plant.name)}`}
                className="card card-hover group p-5 text-center"
              >
                <span className="text-4xl" role="img" aria-label={plant.name}>
                  {plant.icon}
                </span>
                <p className="mt-3 text-sm font-semibold">{plant.name}</p>
                <p className="text-xs text-leaf-600 dark:text-leaf-400">
                  {plant.diseases} classes
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <LinkButton to="/diseases" variant="secondary">
              See all diseases and remedies
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ============================================================ benefits */}
      <section className="bg-white py-16 sm:py-20 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="section-eyebrow">Benefits</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Why it matters in the field
              </h2>
              <p className="mt-3 text-pretty text-leaf-700 dark:text-leaf-300">
                Plant diseases cost farmers a large share of their yield every year, and most losses
                come from acting too late. Early identification is the cheapest intervention.
              </p>

              <ul className="mt-8 space-y-5">
                {BENEFITS.map((benefit) => (
                  <li key={benefit.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                        {benefit.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <LinkButton to={detectPath} variant="primary">
                  <ScanLine className="h-4 w-4" />
                  {isAuthenticated ? 'Start a new scan' : 'Create a free account'}
                </LinkButton>
              </div>
            </div>

            <div className="card overflow-hidden p-8">
              <p className="section-eyebrow">Example result</p>
              <h3 className="mt-2 text-xl font-semibold">Tomato — Early Blight</h3>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-leaf-700 dark:text-leaf-300">Confidence</span>
                  <span className="font-semibold text-leaf-600 dark:text-leaf-400">94%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                  <div className="h-full w-[94%] rounded-full bg-leaf-500" />
                </div>
              </div>

              <dl className="mt-7 space-y-5">
                {[
                  { label: 'Symptoms', value: 'Dark spots with concentric rings on older lower leaves.' },
                  { label: 'Causes', value: 'Warm, wet weather plus infected crop residue in the soil.' },
                  { label: 'Treatment', value: 'Protectant fungicides applied at first symptom, repeated every 7–10 days.' },
                  { label: 'Organic remedy', value: 'Remove affected leaves, mulch the soil and use a copper-based fungicide.' },
                  { label: 'Prevention', value: 'Rotate crops, stake plants and keep foliage dry with drip irrigation.' },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-leaf-600 dark:text-leaf-400">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-leaf-800 dark:text-leaf-200">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== cta */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-leaf-700 px-8 py-14 text-center dark:bg-leaf-800">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-leaf-500/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to check your plants?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-leaf-50/90">
                Create a free account to save your scans, revisit past results and keep a record of
                your crops.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <LinkButton
                  to={detectPath}
                  className="bg-white text-leaf-800 hover:bg-leaf-50 shadow-lg"
                >
                  <ScanLine className="h-5 w-5" />
                  {isAuthenticated ? 'Detect a disease' : 'Get started free'}
                </LinkButton>
                <LinkButton
                  to="/about"
                  className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
                >
                  Learn more
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Decorative hero illustration.
 * Inline SVG keeps the landing page free of external image dependencies.
 */
function LeafIllustration() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="card overflow-hidden p-8">
        <svg viewBox="0 0 320 320" className="w-full" role="img" aria-label="Illustration of a scanned plant leaf">
          <defs>
            <linearGradient id="leafFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="leafFill2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Scan frame corners */}
          <g stroke="#16a34a" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55">
            <path d="M40 70 V46 a6 6 0 0 1 6-6 h24" />
            <path d="M280 70 V46 a6 6 0 0 0-6-6 h-24" />
            <path d="M40 250 v24 a6 6 0 0 0 6 6 h24" />
            <path d="M280 250 v24 a6 6 0 0 1-6 6 h-24" />
          </g>

          {/* Main leaf */}
          <path
            d="M160 40 C96 74 70 132 82 190 C96 254 150 288 160 288 C170 288 224 254 238 190 C250 132 224 74 160 40 Z"
            fill="url(#leafFill)"
          />
          <path
            d="M160 40 C130 96 128 200 160 288 C192 200 190 96 160 40 Z"
            fill="url(#leafFill2)"
            opacity="0.45"
          />

          {/* Veins */}
          <g stroke="#14532d" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" fill="none">
            <path d="M160 60 V282" />
            <path d="M160 110 C128 124 106 146 96 176" />
            <path d="M160 110 C192 124 214 146 224 176" />
            <path d="M160 160 C132 176 114 198 108 226" />
            <path d="M160 160 C188 176 206 198 212 226" />
          </g>

          {/* Disease spots (early blight style) */}
          <g fill="#7c2d12" opacity="0.75">
            <circle cx="126" cy="132" r="9" />
            <circle cx="196" cy="164" r="7" />
            <circle cx="140" cy="212" r="11" />
            <circle cx="188" cy="232" r="6" />
            <circle cx="112" cy="182" r="5" />
          </g>
          <g stroke="#431407" strokeWidth="1.6" opacity="0.7" fill="none">
            <circle cx="126" cy="132" r="5" />
            <circle cx="140" cy="212" r="6" />
          </g>

          {/* Scanning line */}
          <g>
            <rect x="52" y="150" width="216" height="4" rx="2" fill="#16a34a" opacity="0.85" />
            <rect x="52" y="150" width="216" height="22" rx="11" fill="#16a34a" opacity="0.12" />
          </g>
        </svg>
      </div>

      {/* Floating confidence badge */}
      <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl border border-leaf-100 bg-white p-4 shadow-card-hover dark:border-leaf-800 dark:bg-leaf-900 sm:-left-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold leading-none">94%</p>
          <p className="mt-1 text-xs text-leaf-600 dark:text-leaf-400">confidence</p>
        </div>
      </div>
    </div>
  );
}