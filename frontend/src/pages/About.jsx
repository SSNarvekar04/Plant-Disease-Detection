import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Brain,
  Cloud,
  Database,
  Gauge,
  Layers,
  Lock,
  ScanLine,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
} from 'lucide-react';
import LinkButton from '../components/LinkButton';

const STACK = [
  {
    icon: Layers,
    title: 'Frontend',
    color: 'text-sky-600 dark:text-sky-400',
    items: ['React 18 with Vite', 'React Router 6', 'Tailwind CSS', 'Axios', 'Chart.js'],
  },
  {
    icon: Server,
    title: 'Backend',
    color: 'text-leaf-600 dark:text-leaf-400',
    items: ['Node.js and Express', 'MongoDB with Mongoose', 'JWT authentication', 'Multer uploads', 'Cloudinary storage'],
  },
  {
    icon: Brain,
    title: 'Machine learning',
    color: 'text-violet-600 dark:text-violet-400',
    items: ['Python and FastAPI', 'TensorFlow / Keras', 'CNN and transfer learning', 'scikit-learn metrics', 'Matplotlib reports'],
  },
];

const PIPELINE = [
  {
    step: '01',
    title: 'Capture',
    text: 'The user photographs or uploads a leaf image. The browser checks the type and size, then the server re-validates it with Multer so a bad file never reaches the model.',
  },
  {
    step: '02',
    title: 'Storage',
    text: 'The image is uploaded to Cloudinary (or to local disk when Cloudinary is not configured) and only the resulting URL is stored in MongoDB.',
  },
  {
    step: '03',
    title: 'Preprocessing',
    text: 'The Python service converts the image to RGB, resizes it to the model input size and normalises it into the same range used during training.',
  },
  {
    step: '04',
    title: 'Classification',
    text: 'The Keras model returns a probability distribution over the 29 classes. The highest probability becomes the predicted disease and its confidence.',
  },
  {
    step: '05',
    title: 'Enrichment',
    text: 'The predicted class is matched against the disease knowledge base in MongoDB so the result includes symptoms, causes, treatment, organic remedies and prevention.',
  },
  {
    step: '06',
    title: 'History',
    text: 'The prediction is stored with the image URL, confidence, status and source, which feeds the user dashboard and the admin analytics.',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Honest results',
    text: 'Low-confidence predictions are flagged rather than hidden, and predictions produced without a trained model are clearly labelled as demo results.',
  },
  {
    icon: Lock,
    title: 'Secure by default',
    text: 'Passwords are hashed with bcrypt, tokens are signed JWTs, admin routes require the admin role, and uploads are limited by type and size.',
  },
  {
    icon: Database,
    title: 'No binary blobs',
    text: 'Images live in Cloudinary or on disk, which keeps MongoDB documents small and the database easy to back up.',
  },
  {
    icon: Gauge,
    title: 'Performance',
    text: 'The prediction services are loaded lazily and the model is kept in memory, so the first request is slower and later ones are fast.',
  },
];

/**
 * About page: what the project is, how the pipeline works and which
 * technologies it uses.
 */
export default function About() {
  return (
    <>
      {/* ============================================================== header */}
      <section className="border-b border-leaf-100 bg-white py-14 sm:py-16 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-leaf-600 dark:text-leaf-400">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-leaf-800 dark:text-leaf-200">About</span>
          </nav>

          <div className="max-w-3xl">
            <p className="section-eyebrow">About the project</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Plant Disease Detection &amp; Remedy Recommendation System
            </h1>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-leaf-700 dark:text-leaf-300">
              A full-stack web application that identifies plant leaf diseases from a photograph and
              presents a practical remedy plan. It combines a deep learning classifier written in
              Python with a Node.js and MongoDB backend and a React frontend, so the whole journey
              — upload, diagnosis, advice and history — happens in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ pipeline */}
      <section className="border-b border-leaf-100 py-16 sm:py-20 dark:border-leaf-800">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From photograph to recommendation
            </h2>
          </div>

          <ol className="mt-12 space-y-4">
            {PIPELINE.map((item) => (
              <li key={item.step} className="card flex flex-col gap-4 p-6 sm:flex-row sm:gap-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-sm font-bold text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================================================================ stack */}
      <section className="border-b border-leaf-100 bg-white py-16 sm:py-20 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Technology</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Built with a modern stack
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STACK.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-50 dark:bg-leaf-900">
                      <Icon className={`h-5 w-5 ${group.color}`} />
                    </span>
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-leaf-700 dark:text-leaf-300"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================== principles */}
      <section className="border-b border-leaf-100 py-16 sm:py-20 dark:border-leaf-800">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="section-eyebrow">Design principles</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Reliable, not just impressive
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-leaf-700 dark:text-leaf-300">
                A tool that gives farming advice has to be careful about what it claims. The project
                therefore separates demo behaviour from real inference, exposes confidence levels,
                and keeps the security and storage concerns explicit instead of hiding them.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: Wrench, text: 'A dedicated training script converts the raw dataset, trains the model and saves it with the best checkpoint.' },
                  { icon: Cloud, text: 'Cloudinary keeps the deployment lean; a local disk fallback means the project still runs without any account.' },
                  { icon: Terminal, text: 'Every layer — database, API, model, tests — is started with one documented command.' },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.text} className="flex gap-3.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                        {row.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div key={principle.title} className="card card-hover p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-600/10 text-leaf-600 dark:bg-leaf-800 dark:text-leaf-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">{principle.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                      {principle.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ accuracy */}
      <section className="border-b border-leaf-100 bg-white py-16 sm:py-20 dark:border-leaf-800 dark:bg-leaf-900/30">
        <div className="container-page">
          <div className="card flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:p-9">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="h-6 w-6" />
            </span>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">About accuracy</h2>
              <p className="mt-2 text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
                Reported accuracy depends on the trained model and the dataset it was trained on. The
                model is trained on laboratory-style images of individual leaves on plain
                backgrounds, so field photographs with shadows, several leaves or a cluttered
                background usually give lower confidence. Always treat a result as advice and
                confirm it with a local agriculture expert before treating a crop.
              </p>
            </div>

            <LinkButton to="/diseases" variant="secondary" className="shrink-0">
              Browse diseases
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ================================================================= cta */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="rounded-3xl bg-leaf-700 px-8 py-12 text-center dark:bg-leaf-800">
            <h2 className="text-3xl font-bold tracking-tight text-white">Try the detection</h2>
            <p className="mx-auto mt-3 max-w-lg text-leaf-50/90">
              Upload a leaf image and see the classifier, the disease knowledge base and the remedy
              plan working together.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkButton to="/register" className="bg-white text-leaf-800 hover:bg-leaf-50 shadow-lg">
                <ScanLine className="h-5 w-5" />
                Create an account
              </LinkButton>
              <LinkButton
                to="/login"
                className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                Log in
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}