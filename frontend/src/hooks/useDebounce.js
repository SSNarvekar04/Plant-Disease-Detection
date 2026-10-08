import { useEffect, useState } from 'react';

/**
 * Debounces a fast-changing value.
 * Used by the search inputs so typing does not fire a request per keystroke.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay] milliseconds
 * @returns {T}
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Persists a value in localStorage (used for theme and list filters).
 *
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, (value: T) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [key, value]);

  return [value, setValue];
}