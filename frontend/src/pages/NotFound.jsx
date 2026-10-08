import { Compass, Home, ScanLine, Search } from 'lucide-react';
import LinkButton from '../components/LinkButton';

/**
 * 404 page, shown for any URL that does not match a route.
 */
export default function NotFound() {
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="section-eyebrow">Error 404</p>

      <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-leaf-600 sm:text-6xl dark:text-leaf-400">
        Page not found
      </h1>

      <p className="mt-4 max-w-md text-pretty leading-relaxed text-leaf-700 dark:text-leaf-300">
        The page you are looking for does not exist, or it may have been moved. Try one of the links
        below to get back on track.
      </p>

      {/* Suggestions */}
      <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {[
          { to: '/', icon: Home, label: 'Home', text: 'Back to the landing page' },
          { to: '/diseases', icon: Search, label: 'Diseases', text: 'Browse the knowledge base' },
          { to: '/register', icon: ScanLine, label: 'Detect', text: 'Start a new detection' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <LinkButton
              key={item.to}
              to={item.to}
              variant="secondary"
              className="flex-col items-start gap-1 p-5 text-left"
            >
              <Icon className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
              <span className="text-base font-semibold">{item.label}</span>
              <span className="text-xs font-normal text-leaf-600 dark:text-leaf-400">
                {item.text}
              </span>
            </LinkButton>
          );
        })}
      </div>

      <p className="mt-10 flex items-center gap-1.5 text-xs text-leaf-500 dark:text-leaf-500">
        <Compass className="h-3.5 w-3.5" />
        Plant Disease Detection &amp; Remedy Recommendation System
      </p>
    </section>
  );
}