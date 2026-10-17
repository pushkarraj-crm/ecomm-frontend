'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, request } from '@/lib/api.mjs';
import { useStore } from './store-provider';
export function Button({
  children,
  secondary = false,
  small = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`rbt-btn ${secondary ? 'rbt-btn-border' : ''} ${small ? 'rbt-btn-sm' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  name,
  type = 'text',
  required = true,
  children,
  ...props
}) {
  return (
    <div className="rbt-input-field-grp mb--16">
      <label className="rbt-field-label" htmlFor={name}>
        {label}
        {required && ' *'}
      </label>
      {children || (
        <input
          className="rbt-input-field"
          id={name}
          name={name}
          type={type}
          required={required}
          {...props}
        />
      )}
    </div>
  );
}
export function Loading({ text = 'Loading…' }) {
  return (
    <div className="next-state" role="status">
      <span className="next-spinner" />
      {text}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="next-state">
      <h3 className="h5">{title}</h3>
      {children}
      <Link className="rbt-btn rbt-btn-border rbt-btn-sm" href="/shop/">
        Continue shopping
      </Link>
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="next-state" role="alert">
      <p>{error?.message || 'Something went wrong. Please try again.'}</p>
      {error?.status === 401 ? (
        <Link className="rbt-btn" href="/signin/">
          Sign in
        </Link>
      ) : (
        retry && (
          <Button secondary onClick={retry}>
            Try again
          </Button>
        )
      )}
    </div>
  );
}
export function PageTitle({ title }) {
  return (
    <div className="rbt-breadcrumb-area rbt-bg-color-gray-light">
      <div className="container py-4">
        <p className="mb--8">
          <Link href="/">Home</Link> / {title}
        </p>
        <h1 className="h3 mb--0">{title}</h1>
      </div>
    </div>
  );
}
export function AuthGate({ children, seller = false }) {
  const { session, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && (!session || session.seller !== seller))
      router.replace(
        `/${seller ? 'seller-signin' : 'signin'}/?next=${encodeURIComponent(pathname + window.location.search)}`,
      );
  }, [session, ready, seller, router, pathname]);
  if (!ready || !session || session.seller !== seller)
    return <Loading text="Opening your account…" />;
  return children;
}
export function AccountNav() {
  const { session, notify } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await request('/auth/logout/', {
        method: 'POST',
        body: { refresh: session?.refresh },
      });
    } catch (e) {
      notify(e.message, true);
    } finally {
      clearSession();
      router.push('/signin/');
      setBusy(false);
    }
  }
  return (
    <nav className="next-account-nav" aria-label="Account navigation">
      <Link href="/account-info/">Personal information</Link>
      <Link href="/my-order-history/">My orders</Link>
      <Link href="/wishlist/">Wishlist</Link>
      <button onClick={logout} disabled={busy}>
        Log out
      </button>
    </nav>
  );
}
export function AddressFields({ value = {}, prefix = '' }) {
  return (
    <>
      {[
        ['label', 'Address label'],
        ['address_line_1', 'Street address'],
        ['address_line_2', 'Apartment / floor (optional)'],
        ['landmark', 'Landmark (optional)'],
        ['city', 'City'],
        ['state', 'State'],
        ['postal_code', 'Postal code'],
        ['country', 'Country'],
      ].map(([name, label]) => (
        <Field
          key={prefix + name + (value.id || '')}
          name={prefix + name}
          label={label}
          defaultValue={
            value[name] ||
            (name === 'country' ? 'India' : name === 'label' ? 'Home' : '')
          }
          required={!['address_line_2', 'landmark'].includes(name)}
        />
      ))}
      <label className="next-checkbox">
        <input
          name={prefix + 'is_default'}
          type="checkbox"
          defaultChecked={!!value.is_default}
        />{' '}
        Use as default delivery address
      </label>
    </>
  );
}
export function Pager({ page, previous, next, change }) {
  return (
    <nav aria-label="Pagination" className="next-pager">
      <Button
        small
        secondary
        disabled={!previous || page <= 1}
        onClick={() => change(page - 1)}
      >
        Previous
      </Button>
      <span aria-current="page">Page {page}</span>
      <Button small secondary disabled={!next} onClick={() => change(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
