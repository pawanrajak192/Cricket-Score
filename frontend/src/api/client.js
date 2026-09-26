// Thin fetch wrapper around the Node/Express API in ../../server.
// Only used for signed-up users — guests never call this (see useStore.js).

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  listMatches: (token) => request('/matches', { token }),
  createMatch: (token, match) => request('/matches', { method: 'POST', token, body: match }),
  updateMatch: (token, id, match) => request(`/matches/${id}`, { method: 'PUT', token, body: match }),
  deleteMatch: (token, id) => request(`/matches/${id}`, { method: 'DELETE', token }),
  getPublicMatch: (id) => request(`/matches/public/${id}`)
};
