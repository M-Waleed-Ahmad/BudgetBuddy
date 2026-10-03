// Thin fetch wrapper shared by every API module.
// - Resolves the base URL from VITE_API_URL (defaults to the Vite dev proxy at /api)
// - Attaches the bearer token when one is stored
// - Normalises error responses into ApiError({ message, status, errors })
// - Notifies the auth layer when the server rejects the token (401)

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const TOKEN_KEY = 'token';

export class ApiError extends Error {
  constructor(message, status = 0, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) – the session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Returns true when the JWT is malformed or its `exp` claim is in the past. */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

let unauthorizedHandler = null;

/** Registers the callback invoked when an authenticated request comes back 401. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

function buildUrl(path, query) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request(path, { method = 'GET', body, query, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? tokenStorage.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Unable to reach the server. Please check your connection and try again.');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data?.errors);
  }

  return data;
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
