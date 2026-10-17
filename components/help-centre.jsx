'use client';
import Link from 'next/link';
import { useState } from 'react';
import { request, itemsOf } from '@/lib/api.mjs';
import { useResource, useStore } from './store-provider';
import { Button, Field, Loading, ErrorState } from './ui';
export default function HelpCentre() {
  const { session, ready } = useStore(),
    tickets = useResource('/customer/support/', {
      enabled: ready && !!session && !session.seller,
    });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    const form = e.currentTarget;
    try {
      const ticket = await request('/customer/support/', {
        method: 'POST',
        body: Object.fromEntries(new FormData(form)),
      });
      form.reset();
      setMessage(`Ticket #${ticket.id} received. You can read the response here.`);
      tickets.reload();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rbt-section-gap2">
      <div className="container market-help">
        <p className="market-eyebrow">Customer care</p>
        <h1>How can we help?</h1>
        <div className="market-help-topics">
          {[
            [
              'Where is my order?',
              'Open My orders to see payment, dispatch, carrier and tracking information.',
              '/my-order-history/',
            ],
            [
              'Can I return an item?',
              'Return eligibility is shown on each product. For eligible delivered shipments, submit a request from My orders.',
              '/return-policy/',
            ],
            [
              'How do I change my address?',
              'Manage saved addresses in your account before starting checkout.',
              '/account-info/',
            ],
          ].map(([title, text, url]) => (
            <article className="next-panel" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
              <Link href={url}>Learn more →</Link>
            </article>
          ))}
        </div>
        {!session || session.seller ? (
          <div className="next-panel">
            <h2>Contact support</h2>
            <p>
              Sign in to your customer account to send a message and track the response.
            </p>
            <Link className="market-shop-button" href="/signin/?next=%2Fhelp-center%2F">
              Sign in
            </Link>
          </div>
        ) : (
          <div className="row">
            <div className="col-lg-6">
              <form className="next-panel" onSubmit={submit}>
                <h2>Send us a message</h2>
                <Field name="subject" label="Subject" minLength={5} maxLength={150} />
                <Field name="message" label="How can we help?">
                  <textarea
                    className="rbt-text-field"
                    id="message"
                    name="message"
                    minLength={10}
                    maxLength={4000}
                    rows={5}
                    required
                  />
                </Field>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Sending…' : 'Send message'}
                </Button>
                {message && <p role="status">{message}</p>}
              </form>
            </div>
            <div className="col-lg-6">
              <h2>Your support tickets</h2>
              {tickets.loading ? (
                <Loading />
              ) : tickets.error ? (
                <ErrorState error={tickets.error} retry={tickets.reload} />
              ) : itemsOf(tickets.data).length ? (
                itemsOf(tickets.data).map((t) => (
                  <article className="next-panel mb--16" key={t.id}>
                    <h3>
                      #{t.id} · {t.subject}
                    </h3>
                    <strong>{t.status}</strong>
                    <p>{t.message}</p>
                    {t.response && <p>Support: {t.response}</p>}
                  </article>
                ))
              ) : (
                <p>No tickets yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
