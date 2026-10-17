'use client';
import { useState } from 'react';
import { request } from '@/lib/api.mjs';
export default function OrderActions({ shipment, paid, onReload }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    const f = new FormData(e.currentTarget);
    try {
      const result = await request(
        `/orders/customer/shipments/${shipment.id}/requests/`,
        { method: 'POST', body: { kind: f.get('kind'), reason: f.get('reason') } },
      );
      setMessage(result.message);
      setOpen(false);
      onReload();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const safeTracking = /^https:\/\//i.test(shipment.tracking_url || '');
  return (
    <div className="market-order-actions">
      {shipment.carrier && (
        <p>
          Carrier: {shipment.carrier} · {shipment.tracking_number}
        </p>
      )}
      {safeTracking && (
        <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer">
          Track shipment ↗
        </a>
      )}
      {(shipment.customer_requests || []).map((r) => (
        <div className="market-request" key={r.id}>
          <strong>
            {r.kind === 'cancel'
              ? 'Cancellation'
              : r.kind === 'return'
                ? 'Return'
                : 'Refund enquiry'}
            : {r.status}
          </strong>
          <p>{r.reason}</p>
          {r.response && <p>Seller/support response: {r.response}</p>}
        </div>
      ))}
      {paid && (
        <button
          className="market-outline-button"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Close' : 'Get help with this shipment'}
        </button>
      )}
      {open && (
        <form onSubmit={submit}>
          <label>
            Request type
            <select name="kind" required>
              {shipment.status === 'pending' && (
                <option value="cancel">Request cancellation</option>
              )}
              {shipment.status === 'delivered' && (
                <option value="return">Request return</option>
              )}
              <option value="refund">Refund enquiry</option>
            </select>
          </label>
          <label>
            Tell us what happened
            <textarea name="reason" minLength={10} maxLength={2000} required rows={3} />
          </label>
          <p>
            Requests are reviewed against the product policy. Payment refunds require
            approval and processing.
          </p>
          <button className="market-shop-button" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
