/**
 * api.js
 *
 * Small helper around fetch() so we don't repeat ourselves.
 * - Adds JSON headers
 * - Adds auth token if needed
 * - Throws a JS Error when the backend returns an error
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (!token) localStorage.removeItem("token");
  else localStorage.setItem("token", token);
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Backend returns: { error: "..." } usually
    throw new Error(data.error || "Request failed");
  }

  return data;
}
