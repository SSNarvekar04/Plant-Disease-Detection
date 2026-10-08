import api, { unwrap } from './api';

/* ==========================================================================
   Auth
   ========================================================================== */
export const authService = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),

  login: (credentials) => unwrap(api.post('/auth/login', credentials)),

  logout: () => unwrap(api.post('/auth/logout')),

  me: () => unwrap(api.get('/auth/me')),
};

/* ==========================================================================
   Users
   ========================================================================== */
export const userService = {
  getProfile: () => unwrap(api.get('/users/profile')),

  updateProfile: (payload) => unwrap(api.put('/users/profile', payload)),

  changePassword: (payload) => unwrap(api.put('/users/password', payload)),

  changeEmail: (payload) => unwrap(api.put('/users/email', payload)),

  deleteAccount: (password) => unwrap(api.delete('/users/profile', { data: { password } })),
};

/* ==========================================================================
   Diseases (public read, admin write)
   ========================================================================== */
export const diseaseService = {
  /** @param {{search?:string, plant?:string, severity?:string, page?:number, limit?:number, sort?:string}} params */
  list: (params = {}) => unwrap(api.get('/diseases', { params })),

  getById: (id) => unwrap(api.get(`/diseases/${id}`)),

  filterOptions: () => unwrap(api.get('/diseases/plants')),

  create: (payload) => unwrap(api.post('/diseases', payload)),

  update: (id, payload) => unwrap(api.put(`/diseases/${id}`, payload)),

  remove: (id) => unwrap(api.delete(`/diseases/${id}`)),
};

/* ==========================================================================
   Predictions
   ========================================================================== */
export const predictionService = {
  /**
   * Analyses an image and saves the result to the user's history.
   * @param {File} file
   * @param {(percent: number) => void} [onUploadProgress] upload progress 0-100
   */
  create: (file, onUploadProgress) =>
    unwrap(
      api.post(
        '/predictions',
        makeImageForm(file),
        onUploadProgress
          ? { onUploadProgress: (event) => onUploadProgress(toPercent(event)) }
          : undefined
      )
    ),

  /** Analyses an image without writing to history. */
  analyzeOnly: (file, onUploadProgress) =>
    unwrap(
      api.post(
        '/predict',
        makeImageForm(file),
        onUploadProgress
          ? { onUploadProgress: (event) => onUploadProgress(toPercent(event)) }
          : undefined
      )
    ),

  getMine: (params = {}) => unwrap(api.get('/predictions/my', { params })),

  getById: (id) => unwrap(api.get(`/predictions/${id}`)),

  getMyStats: () => unwrap(api.get('/predictions/stats/my')),

  remove: (id) => unwrap(api.delete(`/predictions/${id}`)),
};

/* ==========================================================================
   Admin
   ========================================================================== */
export const adminService = {
  statistics: () => unwrap(api.get('/admin/statistics')),

  mlHealth: () => unwrap(api.get('/admin/ml-health')),

  listUsers: (params = {}) => unwrap(api.get('/admin/users', { params })),
  createUser: (payload) => unwrap(api.post('/admin/users', payload)),
  updateUser: (id, payload) => unwrap(api.put(`/admin/users/${id}`, payload)),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),

  listPredictions: (params = {}) => unwrap(api.get('/admin/predictions', { params })),
  deletePrediction: (id) => unwrap(api.delete(`/admin/predictions/${id}`)),
};

/* ==========================================================================
   Helpers
   ========================================================================== */

/** Builds the multipart body for an image upload. */
function makeImageForm(file) {
  const form = new FormData();
  form.append('image', file, file.name);
  return form;
}

/** Converts an Axios upload progress event into a whole percentage. */
function toPercent(event) {
  if (!event.total) return 0;
  return Math.min(100, Math.round((event.loaded / event.total) * 100));
}

/** System status used on the admin dashboard and the footer. */
export const systemService = {
  health: () => unwrap(api.get('/health')),
};