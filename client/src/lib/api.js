/**
 * In local dev, Vite proxies /api → http://localhost:5000
 * In production, set VITE_API_URL to your deployed backend origin
 * e.g. https://nutribloom-api.onrender.com
 */
const rawBase = import.meta.env.VITE_API_URL?.trim() || '';

export const API_BASE = rawBase.replace(/\/$/, '');

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}
