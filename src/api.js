const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
export function describeError(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(describeError).join(' ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, val]) => `${key}: ${describeError(val)}`).join(' · ');
  return 'Request failed. Please try again.';
}
export function clearSession() { sessionStorage.removeItem('d2c-session'); window.dispatchEvent(new Event('session-change')); }
export function session() { try { return JSON.parse(sessionStorage.getItem('d2c-session') || 'null'); } catch { return null; } }
export function saveSession(data) { sessionStorage.setItem('d2c-session', JSON.stringify(data)); window.dispatchEvent(new Event('session-change')); }
export async function api(path, { method = 'GET', body, signal, download = false } = {}) {
  const token = session()?.access;
  let response;
  try {
    response = await fetch(`${base}${path}`, { method, signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  } catch (error) { if (error.name === 'AbortError') throw error; throw new ApiError('Cannot reach the API. Check that the backend is running and the API URL is configured.', 0); }
  if (response.status === 401 && token) clearSession();
  if (!response.ok) { const text = await response.text(); let value; try { value = JSON.parse(text); } catch { value = `Request failed (${response.status})`; } throw new ApiError(describeError(value), response.status); }
  if (download) return response.blob();
  if (response.status === 204) return null;
  return response.json();
}
export async function download(path, filename) { const blob = await api(path, { download: true }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function rows(data) { return Array.isArray(data) ? data : data?.results || data?.orders || []; }
