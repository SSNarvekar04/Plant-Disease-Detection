import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pdd-theme';

/**
 * Light / dark theme.
 *
 * The initial class is applied by an inline script in index.html (so there is no
 * flash of the wrong theme); this provider keeps the React tree in sync and
 * persists the user's choice.
 */

const ThemeContext = createContext(null);

function readInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing: the theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

export { ThemeContext };