import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ACCESS_KEY = 'hs_access_token';
const REFRESH_KEY = 'hs_refresh_token';
const SOCIETY_KEY = 'hs_active_society_id';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Optional "act in this society" override, sent as the x-society-id header.
// When empty, the backend falls back to the logged-in user's own society.
export const societyStorage = {
  get: () => localStorage.getItem(SOCIETY_KEY),
  set: (id) => localStorage.setItem(SOCIETY_KEY, id),
  clear: () => localStorage.removeItem(SOCIETY_KEY),
};

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });
// Interceptor-free client, used only for the refresh call so it can never loop.
const plain = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const societyId = societyStorage.get();
  // skipSociety: a call can opt out of the picked-society header (used for role assignment,
  // where the role must be saved for the USER's own society, not the one being browsed).
  if (societyId && !config.skipSociety) config.headers['x-society-id'] = societyId;
  return config;
});

// Single-flight refresh: if several requests fail at once, only one refresh call is made.
let refreshPromise = null;
const refreshTokens = () => {
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) return Promise.reject(new Error('No refresh token'));
    refreshPromise = plain
      .post('/auth/refresh', { refreshToken })
      .then((res) => {
        const tokens = res.data.data;
        tokenStorage.set(tokens);
        return tokens.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const EXPIRED_MESSAGE = 'Invalid or expired access token';
const SESSION_LOST_MESSAGES = ['Authentication token missing', 'User account no longer exists'];

const endSession = () => {
  tokenStorage.clear();
  societyStorage.clear();
  window.dispatchEvent(new Event('auth:expired'));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Only an expired/invalid access token triggers a refresh. Other 401s
    // (wrong password, wrong current password) are real answers, not token problems.
    if (status === 401 && message === EXPIRED_MESSAGE && original && !original._retried) {
      original._retried = true;
      try {
        const newAccessToken = await refreshTokens();
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        endSession();
        return Promise.reject(error);
      }
    }

    if (status === 401 && SESSION_LOST_MESSAGES.includes(message)) {
      endSession();
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into one readable sentence for the UI. */
export const getErrorMessage = (error) => {
  if (!error?.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  const { message, details } = error.response.data || {};
  if (Array.isArray(details) && details.length) return details.join(' ');
  return message || 'Something went wrong. Please try again.';
};

export default api;