'use client';
import OrderActions from './order-actions';
import { useState } from 'react';
import { addressText, itemsOf, money, request } from '@/lib/api.mjs';
import { useResource, useStore } from './store-provider';
import {
  AccountNav,
  AddressFields,
  AuthGate,
  Button,
  Empty,
  ErrorState,
  Field,
  Loading,
  Pager,
} from './ui';
function ProfileContent() {
  const profile = useResource('/customer/profile/'),
    addresses = useResource('/customer/addresses/');
  const { notify } = useStore();
  const [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(null),
    [formVersion, setFormVersion] = useState(0);
  const rows = itemsOf(addresses.data),
    value = profile.data || {};
  async function saveProfile(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (profile.error?.status === 404 && rows.length) data.addresses = rows;
      await request('/customer/profile/', {
        method: profile.error?.status === 404 ? 'POST' : 'PATCH',
        body: data,
      });
      notify('Profile saved.');
      profile.reload();
      addresses.reload();
      window.dispatchEvent(new Event('marketplace-profile-updated'));
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function saveAddress(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    data.is_default = data.is_default === 'on';
    try {
      await request(
        '/customer/addresses/' + (editing ? encodeURIComponent(editing.id) + '/' : ''),
        { method: editing ? 'PATCH' : 'POST', body: data },
      );
      notify('Address saved.');
      setEditing(null);
      setFormVersion((n) => n + 1);
      addresses.reload();
      profile.reload();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function addressAction(id, remove) {
    if (busy) return;
    setBusy(true);
    try {
      await request('/customer/addresses/' + encodeURIComponent(id) + '/', {
        method: remove ? 'DELETE' : 'PATCH',
        body: remove ? undefined : { is_default: true },
      });
      addresses.reload();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  if (profile.loading || addresses.loading) return <Loading />;
  if (addresses.error && addresses.error.status !== 404)
    return <ErrorState error={addresses.error} retry={addresses.reload} />;
  if (profile.error && profile.error.status !== 404)
    return <ErrorState error={profile.error} retry={profile.reload} />;
  return (
    <section className="rbt-section-gap2">
      <div className="container">
        <h1 className="h3">Personal Information</h1>
        <AccountNav />
        {profile.error?.status === 404 && (
          <p>Add your name and mobile number to complete your profile.</p>
        )}
        <div className="row row--30">
          <div className="col-lg-7">
            <form className="next-panel" onSubmit={saveProfile}>
              <Field
                name="name"
                label="Full name"
                defaultValue={value.name || ''}
                autoComplete="name"
              />
              <Field
                name="mobile_number"
                label="Mobile number"
                type="tel"
                defaultValue={value.mobile_number || ''}
                autoComplete="tel"
              />
              <Button type="submit" disabled={busy}>
                Save profile
              </Button>
            </form>
            <h2 className="h4 mt--32">Saved Addresses</h2>
            {rows.length ? (
              rows.map((a) => (
                <article className="next-panel mb--16" key={a.id}>
                  <h3 className="h6">
                    {a.label || 'Address'}{' '}
                    {a.is_default && <span className="rbt-badge">Default</span>}
                  </h3>
                  <p>{addressText(a)}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      small
                      secondary
                      disabled={busy}
                      onClick={() => {
                        setEditing(a);
                        setFormVersion((n) => n + 1);
                      }}
                    >
                      Edit
                    </Button>
                    {!a.is_default && (
                      <Button
                        small
                        secondary
                        disabled={busy}
                        onClick={() => addressAction(a.id, false)}
                      >
                        Make default
                      </Button>
                    )}
                    <Button
                      small
                      secondary
                      disabled={busy}
                      onClick={() => addressAction(a.id, true)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <p>No saved addresses yet.</p>
            )}
          </div>
          <div className="col-lg-5">
            <form className="next-panel" key={formVersion} onSubmit={saveAddress}>
              <h2 className="h5">{editing ? 'Edit' : 'Add'} Delivery Address</h2>
              <AddressFields value={editing || {}} />
              <Button type="submit" disabled={busy}>
                Save address
              </Button>
              {editing && (
                <Button
                  type="button"
                  secondary
                  onClick={() => {
                    setEditing(null);
                    setFormVersion((n) => n + 1);
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
export default function Account() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}
function OrdersContent() {
  const [page, setPage] = useState(1);
  const resource = useResource(
    '/orders/customer/history/?page=' + page + '&page_size=24',
  );
  return (
    <section className="rbt-section-gap2">
      <div className="container">
        <h1 className="h3">My Order History</h1>
        <AccountNav />
        {resource.loading ? (
          <Loading />
        ) : resource.error ? (
          <ErrorState error={resource.error} retry={resource.reload} />
        ) : !itemsOf(resource.data).length ? (
          <Empty title="No orders yet" />
        ) : (
          itemsOf(resource.data).map((o) => (
            <article className="next-panel mb--24" key={o.id}>
              <div className="d-flex justify-content-between flex-wrap">
                <h2 className="h5">Order #{o.id}</h2>
                <span className="rbt-badge">
                  {o.order_status || o.payment_status || o.status || 'pending'}
                </span>
              </div>
              <p>
                {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : ''}{' '}
                · {money(o.total_amount)}
              </p>
              {o.coupon_code && (
                <p>
                  Coupon {o.coupon_code}: saved {money(o.discount_amount)}
                </p>
              )}
              {(o.seller_orders || []).map((part, index) => (
                <div className="next-order-part" key={part.id || index}>
                  <strong>Delivery: {part.status || 'pending'}</strong>
                  {['paid', 'partially_refunded'].includes(o.status) && (
                    <ol className="market-order-timeline">
                      {[
                        ['pending', 'Order received'],
                        ['shipped', 'Dispatched'],
                        ['delivered', 'Delivered'],
                      ].map(([status, label], index) => (
                        <li
                          key={status}
                          className={
                            index <=
                            ['pending', 'shipped', 'delivered'].indexOf(part.status)
                              ? 'is-complete'
                              : ''
                          }
                          aria-current={part.status === status ? 'step' : undefined}
                        >
                          {label}
                        </li>
                      ))}
                    </ol>
                  )}
                  {(part.items || []).map((i, index) => (
                    <p key={i.id || index}>
                      {typeof i.product === 'object'
                        ? i.product.name
                        : i.product || i.product_name || 'Product'}{' '}
                      × {i.quantity}
                    </p>
                  ))}
                  <OrderActions
                    shipment={part}
                    paid={['paid', 'partially_refunded'].includes(o.status)}
                    onReload={resource.reload}
                  />
                </div>
              ))}
            </article>
          ))
        )}
        <Pager
          page={page}
          previous={resource.data?.previous}
          next={resource.data?.next}
          change={setPage}
        />
      </div>
    </section>
  );
}
export function Orders() {
  return (
    <AuthGate>
      <OrdersContent />
    </AuthGate>
  );
}
