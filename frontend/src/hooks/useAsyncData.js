import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks its lifecycle.
 *
 * Keeps the loading / error bookkeeping out of the pages, which is what stops
 * business logic leaking into components. `deps` behaves like a useEffect
 * dependency list, so the request re-runs when the filters change.
 *
 * @template T
 * @param {() => Promise<T>} loader
 * @param {unknown[]} deps
 * @returns {{ data: T|null, loading: boolean, error: string|null, reload: () => void, setData: (value: T|null) => void }}
 */
export function useAsyncData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Guards against setting state after the component unmounts.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(loader)
      .then((result) => {
        if (!cancelled && mounted.current) setData(result);
      })
      .catch((thrown) => {
        if (cancelled || !mounted.current) return;
        setError(thrown?.message || 'Something went wrong while loading the data.');
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, loading, error, reload, setData };
}

/**
 * Tracks a one-shot async action (submit, delete, ...) with its own
 * loading/error state, so forms can show progress without extra boilerplate.
 *
 * @template {(...args: any[]) => Promise<any>} T
 * @param {T} action
 * @returns {{ execute: (...args: Parameters<T>) => Promise<any>, loading: boolean, error: string|null, clearError: () => void }}
 */
export function useAsyncAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (thrown) {
        const message = thrown?.message || 'Something went wrong.';
        if (mounted.current) setError(message);
        throw thrown;
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [action]
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, clearError };
}