'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readSession, request } from '@/lib/api.mjs';
const Store = createContext(null);
export function StoreProvider({ children }) {
  const [session, setSession] = useState(null), [ready, setReady] = useState(false), [cart, setCart] = useState(null), [toast, setToast] = useState(null), [wishlist, setWishlist] = useState([]);
  useEffect(() => {
    const update = () => { setSession(readSession()); setReady(true); };
    update();
    try { const saved = JSON.parse(localStorage.getItem('marketplace_wishlist') || '[]'); if (Array.isArray(saved)) setWishlist(saved.map(String)); } catch {}
    window.addEventListener('marketplace-session', update); window.addEventListener('storage', update);
    return () => { window.removeEventListener('marketplace-session', update); window.removeEventListener('storage', update); };
  }, []);
  const notify = useCallback((message, error = false) => setToast({ message, error }), []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 6000); return () => clearTimeout(timer); }, [toast]);
  const refreshCart = useCallback(async () => { if (!session || session.seller) { setCart(null); return; } const next = await request('/cart/'); setCart(next); return next; }, [session]);
  useEffect(() => { refreshCart().catch(() => setCart(null)); }, [refreshCart]);
  function toggleWish(id) { setWishlist(current => { const key = String(id); const next = current.includes(key) ? current.filter(x => x !== key) : [...current, key]; localStorage.setItem('marketplace_wishlist', JSON.stringify(next)); return next; }); }
  return <Store.Provider value={{ session, ready, cart, refreshCart, notify, wishlist, toggleWish }}>{children}{toast && <div className={`next-toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss message">×</button></div>}</Store.Provider>;
}
export const useStore = () => useContext(Store);
export function useResource(path, options = {}) {
  const [data, setData] = useState(null), [error, setError] = useState(null), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
  const isPublic = Boolean(options.public), enabled = options.enabled !== false;
  useEffect(() => {
    if (!enabled || !path) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError(null); setData(null);
    request(path, { public: isPublic, signal: controller.signal }).then(result => { if (!controller.signal.aborted) setData(result); }).catch(e => { if (!controller.signal.aborted) setError(e); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, isPublic, enabled, revision]);
  const reload=useCallback(()=>setRevision(n=>n+1),[]);
  return { data, error, loading, reload };
}
