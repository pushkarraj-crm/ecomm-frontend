const configured = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
export const API_BASE = configured.replace(/\/+$/, '');
export const keys = { access: 'marketplace_access', refresh: 'marketplace_refresh', email: 'marketplace_email', role: 'marketplace_is_seller' };
export class ApiError extends Error {
  constructor(message, status = 0, data = null) { super(message); this.name = 'ApiError'; this.status = status; this.data = data; }
}
export function readSession() {
  if (typeof window === 'undefined') return null;
  try {
    const access = localStorage.getItem(keys.access);
    return access ? { access, refresh: localStorage.getItem(keys.refresh), email: localStorage.getItem(keys.email), seller: localStorage.getItem(keys.role) === 'true' } : null;
  } catch { return null; }
}
export function clearSession() {
  if (typeof window === 'undefined') return;
  Object.values(keys).forEach(key => localStorage.removeItem(key));
  window.dispatchEvent(new Event('marketplace-session'));
}
export function saveSession(data, email, seller = false) {
  if (!data?.access || !data?.refresh || Boolean(data.is_seller) !== seller) throw new ApiError('Please sign in with the correct account type.');
  localStorage.setItem(keys.access, data.access);
  localStorage.setItem(keys.refresh, data.refresh);
  localStorage.setItem(keys.email, email);
  localStorage.setItem(keys.role, String(seller));
  window.dispatchEvent(new Event('marketplace-session'));
}
function errorMessage(data) {
  if (!data || typeof data !== 'object') return 'The request could not be completed.';
  for (const key of ['detail', 'error', 'message']) if (typeof data[key] === 'string') return data[key];
  return Object.entries(data).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : 'Please check this value.'}`).join(' ');
}
export async function request(path, { method = 'GET', body, public: isPublic = false, signal, blob = false } = {}) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError('Invalid API path.');
  const controller = new AbortController();
  // Explicit application errors avoid browser-generated AbortError rejections.
  const cancelled = new ApiError('Request cancelled.');
  const timeout = new ApiError('The request timed out. Please try again.');
  const cancel = () => { controller.abort(cancelled); };
  if (signal?.aborted) return undefined;
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(timeout), 20000);
  const headers = new Headers({ Accept: blob ? '*/*' : 'application/json' });
  const session = readSession();
  if (!isPublic && session?.access) headers.set('Authorization', `Bearer ${session.access}`);
  if (body && !(body instanceof FormData)) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(body); }
  try {
    const response = await fetch(API_BASE + path, { method, body, headers, signal: controller.signal, mode: 'cors', cache: 'no-store' });
    if (blob && response.ok) return await response.blob();
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { throw new ApiError('The server returned an unexpected response. Please try again.', response.status); } }
    if (!response.ok) {
      if (response.status === 401 && !isPublic) clearSession();
      const message = response.status === 401 ? 'Please sign in again to continue.' : response.status === 429 ? 'Too many requests. Please wait a moment and try again.' : response.status >= 500 ? 'The service is temporarily unavailable. Please try again.' : errorMessage(data);
      throw new ApiError(message, response.status, data);
    }
    return data;
  } catch (error) {
    // Effect cleanup is expected during navigation and React Strict Mode.
    // Consumers with a signal discard cancelled results rather than showing an error.
    if (signal?.aborted) return undefined;
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted ? 'The request timed out. Please try again.' : 'Cannot connect to the store. Please check your connection and try again.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}
export function itemsOf(data) { return Array.isArray(data) ? data : data?.results || data?.orders || data?.addresses || []; }
export function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0); }
export function media(path) {
  if (!path || typeof path !== 'string') return '';
  try {
    const url = new URL(path, API_BASE.replace(/\/api$/, '') + '/');
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
export function productImages(product, variant) {
  const images = (variant ? [variant] : product.variants || []).flatMap(item => item.images || []);
  if (!images.length && product.image) images.push(product.image);
  return [...new Set(images.map(image => media(typeof image === 'string' ? image : image.image || image.url)).filter(Boolean))];
}
export function lowestPrice(product) {
  const stocked = (product.variants || []).filter(v => Number(v.stock) > 0);
  const prices = (stocked.length ? stocked : product.variants || []).map(v => Number(v.price)).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
}
export function addressText(address) { return [address.address_line_1, address.address_line_2, address.landmark, address.city, address.state, address.postal_code, address.country].filter(Boolean).join(', ') || address.address || ''; }
export function validAddress(address) { return ['address_line_1', 'city', 'state', 'postal_code'].every(key => String(address?.[key] || '').trim()); }
export function quantityValue(value, max = Infinity) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > max) throw new ApiError(`Choose a whole quantity between 1 and ${Number.isFinite(max) ? max : 'the available stock'}.`);
  return result;
}
export function safeNext(value, fallback = '/account-info/') { return typeof value === 'string' && /^\/[a-z0-9/-]*(?:\?[^\\]*)?$/i.test(value) && !value.startsWith('//') ? value : fallback; }
export function catalogQuery({ search = '', sort = 'newest', page = 1, pageSize = 24 } = {}) {
  const sorts = ['price_asc', 'price_desc', 'newest', 'oldest', 'name_asc', 'name_desc'];
  const params = new URLSearchParams({ page: String(Math.max(1, Math.floor(Number(page) || 1))), page_size: String(Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 24)))), sort: sorts.includes(sort) ? sort : 'newest' });
  if (search.trim()) params.set('search', search.trim().slice(0, 100));
  return params.toString();
}
export async function download(path, name) {
  const file = await request(path, { blob: true });
  const url = URL.createObjectURL(file); const link = document.createElement('a');
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
