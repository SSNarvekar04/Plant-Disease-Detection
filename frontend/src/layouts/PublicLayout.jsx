import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * Shell for every public page: navbar, content area, footer.
 * `main` grows to fill the viewport so the footer sticks to the bottom.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-soil-50 dark:bg-leaf-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-leaf-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}