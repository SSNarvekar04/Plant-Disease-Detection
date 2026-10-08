import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  History,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  ScanLine,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { initials } from '../utils/formatters';

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/detect', label: 'Detect disease', icon: ScanLine },
  { to: '/history', label: 'Prediction history', icon: History },
  { to: '/profile', label: 'My profile', icon: User },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Manage users', icon: User },
  { to: '/admin/diseases', label: 'Manage diseases', icon: Leaf },
  { to: '/admin/predictions', label: 'Prediction records', icon: History },
];

/**
 * Dashboard shell: a fixed sidebar on desktop and a slide-over drawer on
 * mobile. The same `links` list drives both, so a new page only has to be added
 * once.
 *
 * The header holds only the drawer trigger and the account-area actions; each
 * page renders its own `<h1>`, so the title is deliberately not repeated here.
 *
 * @param {{ variant?: 'user'|'admin' }} props
 */
export default function DashboardLayout({ variant = 'user' }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = variant === 'admin' ? ADMIN_LINKS : USER_LINKS;

  // Close the drawer whenever the user navigates.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-leaf-100 px-5 py-4 dark:border-leaf-800">
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
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {variant === 'admin' ? 'Admin panel' : 'My dashboard'}
          </p>
          <p className="truncate text-xs text-leaf-600 dark:text-leaf-400">Plant Disease Detection</p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="btn-ghost btn-sm ml-auto lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard navigation">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavItem
              key={link.to}
              to={link.to}
              label={link.label}
              icon={Icon}
              active={link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)}
            />
          );
        })}

        {/* An admin can also use the normal user area */}
        {variant === 'admin' ? (
          <div className="mt-4 border-t border-leaf-100 pt-4 dark:border-leaf-800">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-leaf-500 dark:text-leaf-500">
              Switch to
            </p>
            <NavItem to="/dashboard" icon={LayoutDashboard} active={false} label="User dashboard" />
            <NavItem to="/" icon={Leaf} active={false} label="Public site" />
          </div>
        ) : null}
      </nav>

      {/* Footer: user card + theme toggle */}
      <div className="border-t border-leaf-100 p-3 dark:border-leaf-800">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-leaf-600 text-xs font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-leaf-600 dark:text-leaf-400">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-leaf-700 transition hover:bg-leaf-50 dark:text-leaf-300 dark:hover:bg-leaf-900"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-soil-50 dark:bg-leaf-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-leaf-100 bg-white lg:block dark:border-leaf-800 dark:bg-leaf-950">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-leaf-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-72 animate-fade-in bg-white dark:bg-leaf-950">
            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-leaf-100 bg-white/85 backdrop-blur-md dark:border-leaf-800 dark:bg-leaf-950/85">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn-ghost btn-sm lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {variant === 'user' ? (
              <>
                {/* Visible only once the sidebar takes over on large screens. */}
                <span className="text-sm font-semibold lg:hidden">Plant Disease</span>
                <span className="flex-1" />
                <Link to="/" className="btn-ghost btn-sm" aria-label="Back to home">
                  <ChevronLeft className="h-4 w-4" />
                  Home
                </Link>
              </>
            ) : (
              <>
                <span className="badge bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                  <Shield className="h-3 w-3" />
                  Admin panel
                </span>
                <span className="flex-1" />
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Single sidebar link, kept inline to avoid an extra file for 8 lines. */
function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-leaf-600 text-white shadow-sm'
          : 'text-leaf-700 hover:bg-leaf-50 dark:text-leaf-300 dark:hover:bg-leaf-900'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label ?? null}
    </Link>
  );
}