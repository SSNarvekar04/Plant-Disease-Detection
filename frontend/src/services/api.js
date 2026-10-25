import axios from 'axios';

/**
 * The single Axios instance every request goes through.
 *
 * Base URL resolution:
 *   VITE_API_URL="http://localhost:5000/api"  -> call the API directly (default)
 *   VITE_API_URL="/"                          -> same origin, Vite proxies /api
 *
 * `/api` is only appended when the configured value does not already end with
 * it, so either style of setting produces exactly one `/api`.
 */
const envUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const baseURL = (!envUrl || envUrl === 'http://localhost:5000/api' || envUrl === '/api')
  ? '/api'
  : (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`);

const TOKEN_KEY = 'pdd-token';

const api = axios.create({
  baseURL,
  timeout: 60000, // predictions can take a while while the model runs
});

/* ------------------------------------------------------------------ tokens */

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/* ------------------------------------------------- request / response hooks */

// Attach the JWT to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

/**
 * Normalises every backend error into a single shape the UI can rely on:
 *   { message: string, status: number, fieldErrors: { [field]: string } }
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / CORS / server-down errors have no response object.
    if (!error.response) {
      const offline = !navigator.onLine;
      return Promise.reject({
        message: offline
          ? 'You appear to be offline. Please check your internet connection.'
          : 'Cannot reach the server. Please make sure the backend is running.',
        status: 0,
        fieldErrors: {},
      });
    }

    const { status, data } = error.response;

    // Expired or invalid token -> drop it so the app falls back to the login page.
    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      // A full page reload would lose in-memory state, so dispatch an event that
      // AuthContext listens to and let React Router redirect instead.
      window.dispatchEvent(new CustomEvent('pdd:unauthorised'));
    }

    const fieldErrors = {};
    if (Array.isArray(data?.errors)) {
      data.errors.forEach((item) => {
        if (item?.field) fieldErrors[item.field] = item.message;
      });
    }

    return Promise.reject({
      message: data?.message || `Request failed with status ${status}`,
      status,
      fieldErrors,
      errors: data?.errors || [],
    });
  }
);

/**
 * Unwraps the `{ success, data, pagination }` envelope used by the backend.
 * Keeps every page free of `response.data.data` noise.
 *
 * @param {import('axios').AxiosPromise} promise
 */
export async function unwrap(promise) {
  const response = await promise;
  return response.data;
}

export default api;