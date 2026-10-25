import { Link } from 'react-router-dom';
import { Github, Heart, Mail } from 'lucide-react';

/**
 * Site footer with quick links, a short project blurb and the academic note.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-leaf-100 bg-white dark:border-leaf-800 dark:bg-leaf-950">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand + blurb */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21c0-6 0-9 0-12" strokeLinecap="round" />
                  <path
                    d="M12 13C9 12 6.5 10 5.5 6.5 9 7 11 9 12 13Z"
                    fill="currentColor"
                    fillOpacity="0.35"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16c2.8-.8 4.8-3 5.5-6.5C14.8 10 12.6 12.6 12 16Z"
                    fill="currentColor"
                    fillOpacity="0.55"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-lg font-bold tracking-tight">
                Plant<span className="text-leaf-600 dark:text-leaf-400">Disease</span>
              </span>
            </div>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-leaf-700 dark:text-leaf-300">
              An AI-assisted plant disease detection and remedy recommendation system. Upload a leaf
              image to identify the disease and get symptoms, causes, treatment options, organic
              remedies and prevention guidance.
            </p>

            <p className="mt-4 text-xs text-leaf-500 dark:text-leaf-500">
              Built as a full-stack academic project: React, Node.js, MongoDB and the Plant.id API.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-leaf-900 dark:text-leaf-100">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About the project' },
                { to: '/diseases', label: 'Disease library' },
                { to: '/detect', label: 'Detect a disease' },
                { to: '/register', label: 'Create an account' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-leaf-700 transition-colors hover:text-leaf-600 dark:text-leaf-300 dark:hover:text-leaf-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-leaf-900 dark:text-leaf-100">
              Technology
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-leaf-700 dark:text-leaf-300">
              {['React.js + Vite', 'Node.js + Express', 'MongoDB + Mongoose', 'Plant.id AI API', 'JWT authentication'].map(
                (item) => (
                  <li key={item}>{item}</li>
                )
              )}
            </ul>

            <div className="mt-5 flex gap-2">
              <a
                href="mailto:project@example.com"
                aria-label="Email the project"
                className="btn-ghost btn-sm"
              >
                <Mail className="h-4 w-4" />
              </a>
              <span className="btn-ghost btn-sm cursor-default" aria-hidden="true">
                <Github className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer strip */}
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          <strong className="font-semibold">Please note:</strong> predictions come from a machine
          learning model and are an aid for decision making only. Always confirm with a local
          agriculture expert or extension officer before applying any treatment or pesticide, and
          follow the product label.
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-leaf-100 pt-6 text-sm text-leaf-600 sm:flex-row dark:border-leaf-800 dark:text-leaf-400">
          <p>
            &copy; {year} Plant Disease Detection &amp; Remedy Recommendation System. All rights
            reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs">
            Made with <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden="true" /> for farmers
            and plant pathology learners.
          </p>
        </div>
      </div>
    </footer>
  );
}