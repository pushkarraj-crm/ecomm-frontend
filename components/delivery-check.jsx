'use client';
import { useEffect, useState } from 'react';
import { request } from '@/lib/api.mjs';
export default function DeliveryCheck({ compact = false }) {
  const [code, setCode] = useState(''),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(!compact);
  useEffect(() => {
    try {
      setCode(localStorage.getItem('marketplace-pincode') || '');
    } catch {}
  }, []);
  async function check(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await request(
        '/products/delivery/?postal_code=' + encodeURIComponent(code),
        { public: true },
      );
      setResult(data);
      if (data.available) {
        localStorage.setItem('marketplace-pincode', code);
        window.dispatchEvent(new Event('marketplace-delivery-updated'));
      }
    } catch (e) {
      setResult({ message: e.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={compact ? 'market-delivery compact' : 'market-delivery'}>
      {compact ? (
        <button
          type="button"
          className="market-delivery-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Deliver to {code || 'your location'} ⌄
        </button>
      ) : (
        <h2>Check delivery</h2>
      )}
      {open && (
        <form onSubmit={check}>
          <label htmlFor={compact ? 'header-pincode' : 'product-pincode'}>
            Delivery pincode
          </label>
          <div>
            <input
              id={compact ? 'header-pincode' : 'product-pincode'}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              placeholder="Enter 6-digit pincode"
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Check'}
            </button>
          </div>
          <p role="status">
            {result?.available
              ? `${result.city}: estimated ${new Date(result.earliest).toLocaleDateString('en-IN')}–${new Date(result.latest).toLocaleDateString('en-IN')}. ${result.message}`
              : result?.message}
          </p>
        </form>
      )}
    </div>
  );
}
