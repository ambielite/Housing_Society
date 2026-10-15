import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const LEGACY_BASE_URL = import.meta.env.VITE_LEGACY_API_BASE_URL || BASE_URL.replace(/\/api\/v1\/?$/, '/api');

const ACCESS_KEY = 'hs_access_token';
const REFRESH_KEY = 'hs_refresh_token';
const SOCIETY_KEY = 'hs_active_society_id';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY) || localStorage.getItem('token'),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
      // The legacy /api modules use the original storage key.
      localStorage.setItem('token', accessToken);
    }
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('token');
  },
};

// Optional "act in this society" override, sent as the x-society-id header.
// When empty, the backend falls back to the logged-in user's own society.
export const societyStorage = {
  get: () => localStorage.getItem(SOCIETY_KEY) || localStorage.getItem('selectedSocietyId'),
  set: (id) => {
    localStorage.setItem(SOCIETY_KEY, id);
    localStorage.setItem('selectedSocietyId', id);
  },
  clear: () => {
    localStorage.removeItem(SOCIETY_KEY);
    localStorage.removeItem('selectedSocietyId');
  },
};

const EXPIRED_MESSAGE = 'Invalid or expired access token';
const SESSION_LOST_MESSAGES = ['Authentication token missing', 'User account no longer exists'];

const endSession = () => {
  tokenStorage.clear();
  societyStorage.clear();
  window.dispatchEvent(new Event('auth:expired'));
};

const createApiClient = (baseURL, refreshBaseURL = baseURL) => {
  const client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
  const refreshClient = axios.create({ baseURL: refreshBaseURL, headers: { 'Content-Type': 'application/json' } });
  let refreshPromise = null;

  const refreshTokens = () => {
    if (!refreshPromise) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return Promise.reject(new Error('No refresh token'));
      refreshPromise = refreshClient
        .post('/auth/refresh', { refreshToken })
        .then((res) => {
          const tokens = res.data.data;
          tokenStorage.set(tokens);
          return tokens.accessToken;
        })
        .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  };

  client.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const societyId = societyStorage.get();
    if (societyId && !config.skipSociety) config.headers['x-society-id'] = societyId;
    return config;
  });

  client.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;
    if (status === 401 && message === EXPIRED_MESSAGE && original && !original._retried) {
      original._retried = true;
      try {
        original.headers.Authorization = `Bearer ${await refreshTokens()}`;
        return client(original);
      } catch {
        endSession();
        return Promise.reject(error);
      }
    }
    if (status === 401 && SESSION_LOST_MESSAGES.includes(message)) endSession();
    return Promise.reject(error);
  });
  return client;
};

const api = createApiClient(BASE_URL);
// Nikhil's older modules are mounted directly under /api. Their token and
// society context are shared with the same authenticated session.
export const legacyApi = createApiClient(LEGACY_BASE_URL, BASE_URL);

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
