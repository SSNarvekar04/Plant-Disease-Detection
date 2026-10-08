import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Moon, ScanLine, Sun, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { initials } from '../utils/formatters';
import LinkButton from './LinkButton';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/diseases', label: 'Diseases' },
  { to: '/about', label: 'About' },
];

/**
 * Top navigation bar for the public pages and the user area.
 *
 * Responsive behaviour: links collapse into a slide-down menu below the `md`
 * breakpoint, and the account area becomes a dropdown on desktop.
 */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  // Close both menus whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Close the account dropdown when clicking outside it.
  useEffect(() => {
    if (!accountOpen) return undefined;

    const onClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-leaf-100 bg-white/85 backdrop-blur-md dark:border-leaf-800 dark:bg-leaf-950/85">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5" aria-label="Go to home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-600 text-white">
              <LeafIcon />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">
              Plant<span className="text-leaf-600 dark:text-leaf-400">Disease</span>
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-leaf-100 text-leaf-800 dark:bg-leaf-800 dark:text-leaf-100'
                      : 'text-leaf-700 hover:bg-leaf-50 dark:text-leaf-300 dark:hover:bg-leaf-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="btn-ghost btn-sm"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <LinkButton to="/detect" variant="primary" size="sm" className="hidden sm:inline-flex">
                  <ScanLine className="h-4 w-4" />
                  Detect
                </LinkButton>

                {/* Account dropdown */}
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-leaf-50 dark:hover:bg-leaf-900"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-600 text-xs font-bold text-white">
                      {initials(user?.name)}
                    </span>
                    <span className="hidden max-w-[8rem] truncate text-sm font-medium lg:block">
                      {user?.name}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-leaf-500 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {accountOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 animate-scale-in overflow-hidden rounded-xl border border-leaf-100 bg-white shadow-card-hover dark:border-leaf-800 dark:bg-leaf-900"
                    >
                      <div className="border-b border-leaf-100 px-4 py-3 dark:border-leaf-800">
                        <p className="truncate text-sm font-semibold">{user?.name}</p>
                        <p className="truncate text-xs text-leaf-600 dark:text-leaf-400">{user?.email}</p>
                        {isAdmin ? (
                          <span className="badge mt-2 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                            Administrator
                          </span>
                        ) : null}
                      </div>

                      <div className="p-1.5">
                        {isAdmin ? (
                          <Link
                            to="/admin"
                            role="menuitem"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-leaf-50 dark:hover:bg-leaf-800"
                          >
                            <LayoutDashboard className="h-4 w-4 text-leaf-600 dark:text-leaf-400" />
                            Admin dashboard
                          </Link>
                        ) : null}
                        <Link
                          to="/dashboard"
                          role="menuitem"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-leaf-50 dark:hover:bg-leaf-800"
                        >
                          <LayoutDashboard className="h-4 w-4 text-leaf-600 dark:text-leaf-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/detect"
                          role="menuitem"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-leaf-50 dark:hover:bg-leaf-800"
                        >
                          <ScanLine className="h-4 w-4 text-leaf-600 dark:text-leaf-400" />
                          Detect disease
                        </Link>
                        <Link
                          to="/profile"
                          role="menuitem"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-leaf-50 dark:hover:bg-leaf-800"
                        >
                          <User className="h-4 w-4 text-leaf-600 dark:text-leaf-400" />
                          My profile
                        </Link>
                      </div>

                      <div className="border-t border-leaf-100 p-1.5 dark:border-leaf-800">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <LinkButton to="/login" variant="ghost" size="sm">
                  Log in
                </LinkButton>
                <LinkButton to="/register" variant="primary" size="sm">
                  Get started
                </LinkButton>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="btn-ghost btn-sm md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="border-t border-leaf-100 bg-white animate-fade-in dark:border-leaf-800 dark:bg-leaf-950 md:hidden">
          <nav className="container-page space-y-1 py-4" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-leaf-100 text-leaf-800 dark:bg-leaf-800 dark:text-leaf-100'
                      : 'text-leaf-700 dark:text-leaf-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <div className="my-2 border-t border-leaf-100 dark:border-leaf-800" />
                <NavLink
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-leaf-700 dark:text-leaf-300"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/detect"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-leaf-700 dark:text-leaf-300"
                >
                  Detect disease
                </NavLink>
                <NavLink
                  to="/history"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-leaf-700 dark:text-leaf-300"
                >
                  Prediction history
                </NavLink>
                <NavLink
                  to="/profile"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-leaf-700 dark:text-leaf-300"
                >
                  My profile
                </NavLink>
                {isAdmin ? (
                  <NavLink
                    to="/admin"
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-violet-700 dark:text-violet-300"
                  >
                    Admin dashboard
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <div className="my-2 border-t border-leaf-100 dark:border-leaf-800" />
                <LinkButton to="/login" variant="secondary" className="btn-block">
                  Log in
                </LinkButton>
                <LinkButton to="/register" variant="primary" className="btn-block mt-2">
                  Get started
                </LinkButton>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

/** Inline SVG leaf used as the brand mark (no icon-font dependency). */
function LeafIcon() {
  return (
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
  );
}