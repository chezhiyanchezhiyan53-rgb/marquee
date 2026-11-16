/**
 * CineBook API client
 */
const API_BASE = '/api';
const TOKEN_KEY = 'cinebook_token';

const Api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (err) {
      throw new Error(
        'Cannot reach the CineBook server. Ensure the backend is running and MongoDB is connected.'
      );
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text || 'Unexpected response' };
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        (Array.isArray(data?.details) ? data.details.map((d) => d.message || d).join(', ') : null) ||
        `Request failed (${res.status})`;
      const error = new Error(msg);
      error.status = res.status;
      error.details = data?.details;
      throw error;
    }

    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: 'POST', body });
  },

  put(path, body) {
    return this.request(path, { method: 'PUT', body });
  },

  patch(path, body) {
    return this.request(path, { method: 'PATCH', body });
  },

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  },
};

window.Api = Api;
