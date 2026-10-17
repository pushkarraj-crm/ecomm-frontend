'use client';
import Link from 'next/link';
import { productUrl } from '@/lib/product-url.mjs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { money, productImages, quantityValue, request } from '@/lib/api.mjs';
import { useResource, useStore } from './store-provider';
import DeliveryCheck from './delivery-check';
import { ProductCard } from './catalog';
import { Button, Empty, ErrorState, Field, Loading } from './ui';
export default function Product({ productId }) {
  const query = useSearchParams(),
    id = productId || query.get('product_id'),
    router = useRouter(),
    pathname = usePathname();
  const resource = useResource(
    id ? '/products/' + encodeURIComponent(id) + '/' : null,
    { public: true },
  );
  const related = useResource(
    resource.data?.category
      ? '/products/?category=' + resource.data.category + '&page=1&page_size=8'
      : null,
    { public: true },
  );
  const { session, notify, refreshCart, wishlist, toggleWish } = useStore();
  const [variantId, setVariantId] = useState(''),
    [quantity, setQuantity] = useState(1),
    [photo, setPhoto] = useState(0),
    [busy, setBusy] = useState(false);
  const zoom = useRef(null);
  const tracked = useRef(null);
  useEffect(() => {
    const p = resource.data;
    if (!p) return;
    setVariantId(
      String(
        (p.variants || []).find((v) => Number(v.stock) > 0)?.id ||
          p.variants?.[0]?.id ||
          '',
      ),
    );
    setQuantity(1);
    setPhoto(0);
    if (tracked.current !== String(p.id)) {
      tracked.current = String(p.id);
      request('/products/' + encodeURIComponent(p.id) + '/track/', {
        method: 'POST',
        public: true,
        body: { event: 'view' },
      }).catch(() => {});
    }
  }, [resource.data]);
  useEffect(() => {
    if (resource.data) {
      const canonical = productUrl(resource.data);
      if (pathname !== canonical) router.replace(canonical);
    }
  }, [resource.data, pathname, router]);
  if (!id)
    return (
      <Empty title="Choose a product">
        <p>Browse the catalog to see product details.</p>
      </Empty>
    );
  if (resource.loading) return <Loading text="Loading product…" />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const p = resource.data;
  if (!p) return null;
  const variant = (p.variants || []).find((v) => String(v.id) === variantId),
    images = productImages(p, variant);
  const fallback = images.length ? images : productImages(p);
  function login() {
    if (session && !session.seller) return true;
    router.push('/signin/?next=' + encodeURIComponent(productUrl(p)));
    return false;
  }
  async function add(e, buyNow = false) {
    e.preventDefault();
    if (busy || !login()) return;
    setBusy(true);
    try {
      await request('/customer/cart/add/', {
        method: 'POST',
        body: {
          variant_id: variant.id,
          quantity: quantityValue(quantity, Number(variant.stock)),
        },
      });
      await refreshCart();
      notify('Added to your cart.');
      if (buyNow) router.push('/checkout-delivery-step-one/');
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function review(e) {
    e.preventDefault();
    if (busy || !login()) return;
    const form = e.currentTarget,
      d = new FormData(form);
    setBusy(true);
    try {
      await request('/products/review/', {
        method: 'POST',
        body: {
          product_id: p.id,
          rating: Number(d.get('rating')),
          comment: d.get('comment'),
        },
      });
      form.reset();
      notify('Your review was submitted.');
      resource.reload();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rbt-section-gap2">
      <div className="container">
        <p>
          <Link href="/shop/">Shop</Link> / {p.name}
        </p>
        <div className="row row--30">
          <div className="col-lg-6">
            <div className="rbt-product-single-img next-product-gallery">
              {fallback.length ? (
                <img
                  src={fallback[Math.min(photo, fallback.length - 1)]}
                  alt={p.name}
                  width="620"
                  height="560"
                  fetchPriority="high"
                />
              ) : (
                <span>Image unavailable</span>
              )}
            </div>
            {fallback.length > 0 && (
              <>
                <button
                  type="button"
                  className="market-outline-button"
                  onClick={() => zoom.current?.showModal()}
                >
                  Enlarge image
                </button>
                <dialog
                  className="market-image-dialog"
                  aria-label={`${p.name} enlarged image`}
                  ref={zoom}
                >
                  <button
                    type="button"
                    aria-label="Close image"
                    onClick={() => zoom.current?.close()}
                  >
                    ×
                  </button>
                  <img
                    src={fallback[Math.min(photo, fallback.length - 1)]}
                    alt={p.name}
                  />
                </dialog>
              </>
            )}
            <div className="next-thumbnails">
              {fallback.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setPhoto(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={photo === i}
                >
                  <img src={src} width="80" height="80" alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="rbt-product-variations">
              <p className="market-eyebrow">{p.category_name}</p>
              <h1 className="h3">{p.name}</h1>
              <p className="market-product-description">{p.description}</p>
              <p>
                {p.average_rating != null
                  ? `${Number(p.average_rating).toFixed(1)} ★ · ${p.review_count} reviews`
                  : 'Be the first to review this product'}
              </p>
              {p.seller && (
                <p>
                  Sold by{' '}
                  <Link href={`/shop/?seller=${p.seller.id}`}>
                    {p.seller.store_name}
                  </Link>
                </p>
              )}
              <p className="price-text h4">
                {variant ? money(variant.price) : 'Unavailable'}{' '}
                {Number(variant?.original_price) > Number(variant?.price) && (
                  <>
                    <del className="market-original-price">
                      {money(variant.original_price)}
                    </del>
                    <span className="market-discount">
                      {Math.round(
                        (1 - Number(variant.price) / Number(variant.original_price)) *
                          100,
                      )}
                      % off
                    </span>
                  </>
                )}
              </p>
              <form onSubmit={add}>
                <fieldset className="market-variant-options">
                  <legend>Size</legend>
                  {[
                    ...new Set((p.variants || []).map((v) => v.size || 'Standard')),
                  ].map((size) => {
                    const match = p.variants.find(
                      (v) => (v.size || 'Standard') === size && Number(v.stock) > 0,
                    );
                    return (
                      <button
                        type="button"
                        key={size}
                        disabled={!match}
                        aria-pressed={(variant?.size || 'Standard') === size}
                        onClick={() => {
                          setVariantId(String(match.id));
                          setQuantity(1);
                          setPhoto(0);
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </fieldset>
                <fieldset className="market-variant-options">
                  <legend>Colour</legend>
                  {(p.variants || [])
                    .filter((v) => v.size === variant?.size)
                    .map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        disabled={Number(v.stock) <= 0}
                        aria-pressed={String(v.id) === variantId}
                        onClick={() => {
                          setVariantId(String(v.id));
                          setQuantity(1);
                          setPhoto(0);
                        }}
                      >
                        {v.color || 'Standard'}
                      </button>
                    ))}
                </fieldset>
                <Field
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max={variant?.stock || 1}
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p>
                  {Number(variant?.stock) > 0
                    ? `${variant.stock} available`
                    : 'Currently out of stock'}
                </p>
                <Button
                  type="button"
                  onClick={(e) => add(e, true)}
                  disabled={busy || !variant || Number(variant.stock) <= 0}
                >
                  Buy now
                </Button>{' '}
                <Button
                  type="submit"
                  disabled={busy || !variant || Number(variant.stock) <= 0}
                >
                  {busy ? 'Please wait…' : 'Add to cart'}
                </Button>{' '}
                <Button type="button" secondary onClick={() => toggleWish(p.id)}>
                  {wishlist.includes(String(p.id))
                    ? 'Saved to wishlist'
                    : 'Save to wishlist'}
                </Button>
              </form>
              <DeliveryCheck />
              <div className="market-product-facts">
                <h2>Product information</h2>
                <dl>
                  <dt>Category</dt>
                  <dd>{p.category_name || 'General'}</dd>
                  <dt>Size</dt>
                  <dd>{variant?.size || 'Standard'}</dd>
                  <dt>Colour</dt>
                  <dd>{variant?.color || 'Standard'}</dd>
                  {Object.entries(p.specifications || {}).map(([key, value]) => (
                    <div className="market-spec-row" key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                  <dt>Returns</dt>
                  <dd>
                    {p.return_policy === 'return_and_exchange'
                      ? `${p.return_days}-day return and exchange eligibility`
                      : 'This product is not eligible for return'}
                  </dd>
                </dl>
                {p.size_guide && (
                  <details className="market-size-guide">
                    <summary>Size guide</summary>
                    <p>{p.size_guide}</p>
                  </details>
                )}
                <Link href="/return-policy/">Read the return policy →</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt--48">
          <div className="col-lg-7">
            <h2 className="h4">Customer reviews</h2>
            {p.reviews?.length ? (
              p.reviews.map((r, i) => (
                <article className="next-panel mb--16" key={r.id || i}>
                  <strong>{r.rating} / 5</strong>
                  <p>{r.comment}</p>
                </article>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
          <div className="col-lg-5">
            <form className="next-panel" onSubmit={review}>
              <h3 className="h5">Write a review</h3>
              <Field label="Rating" name="rating">
                <select className="rbt-input-field" name="rating" id="rating">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your review" name="comment">
                <textarea
                  className="rbt-text-field"
                  id="comment"
                  name="comment"
                  rows="4"
                  maxLength={2000}
                  required
                />
              </Field>
              <Button type="submit" disabled={busy}>
                Submit review
              </Button>
            </form>
          </div>
        </div>
        {(related.data?.results || related.data || []).filter(
          (item) => item.id !== p.id,
        ).length > 0 && (
          <section className="market-related">
            <div className="market-section-heading">
              <h2>You may also like</h2>
              <Link href={`/shop/?category=${p.category}`}>View all →</Link>
            </div>
            <div className="market-product-grid">
              {(related.data?.results || related.data || [])
                .filter((item) => item.id !== p.id)
                .slice(0, 4)
                .map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
