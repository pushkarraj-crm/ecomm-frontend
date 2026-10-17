'use client';
import Link from 'next/link';
import { itemsOf, productImages } from '@/lib/api.mjs';
import { useResource } from './store-provider';
import { ProductCard } from './catalog';
import { Loading, ErrorState, Empty } from './ui';
import MarketIcon from './market-icon';
export default function MarketHome() {
  const content = useResource('/products/store-content/', { public: true });
  const categories = useResource('/products/categories/', { public: true });
  const products = useResource('/products/?page=1&page_size=24&sort=newest', {
    public: true,
  });
  return (
    <div className="market-home">
      <section className="market-hero">
        <div className="market-hero-copy">
          <p className="market-eyebrow">A little discovery. A lot to love.</p>
          <h1>
            Everyday finds.
            <br />
            Extraordinary value.
          </h1>
          <p>
            Explore styles for you, essentials for your home,
            <br className="market-desktop-break" /> and something new for every day.
          </p>
          <Link href="/shop/" className="market-shop-button">
            Shop now <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="market-hero-art">
          <span className="market-orbit" />
          <img
            src={
              itemsOf(products.data)
                .map((p) => productImages(p)[0])
                .find(Boolean) ||
              '/assets/images/product-banner/product-banner-img-01.webp'
            }
            alt="Discover products from our marketplace"
            width="440"
            height="248"
            fetchPriority="high"
          />
          <span className="market-hero-label">Find your everyday favourites</span>
        </div>
      </section>
      <div className="market-value-strip">
        <span>
          <MarketIcon name="layers" />
          One place. More possibilities.
        </span>
        <span>
          <MarketIcon name="heart" />
          Save the finds you love
        </span>
        <span>
          <MarketIcon name="store" />
          Shop independent sellers
        </span>
      </div>
      <section className="market-category-section" aria-label="Browse categories">
        <div className="market-section-heading">
          <h2>Find your kind of favourite</h2>
          <Link href="/shop-by-categories/">Explore categories →</Link>
        </div>
        <div className="market-category-circles">
          {itemsOf(categories.data).map((c, index) => (
            <Link key={c.id} href={`/shop/?category=${c.id}`}>
              <span
                className={`market-category-circle tone-${index % 4}`}
                aria-hidden="true"
              >
                <MarketIcon
                  name={
                    /electro/i.test(c.name)
                      ? 'headphones'
                      : /fashion/i.test(c.name)
                        ? 'shirt'
                        : /beaut/i.test(c.name)
                          ? 'sparkles'
                          : 'home'
                  }
                  size={36}
                />
              </span>
              <strong>{c.name}</strong>
              <small>
                {(c.children || [])
                  .map((child) => child.name)
                  .slice(0, 2)
                  .join(' · ')}
              </small>
            </Link>
          ))}
        </div>
        {categories.error && (
          <p>
            Browse the full <Link href="/shop/">product collection</Link>.
          </p>
        )}
      </section>
      {(content.data?.banners || []).length > 0 && (
        <section className="market-promo-grid">
          {content.data.banners.map((b) => (
            <Link
              key={b.id}
              href={b.category ? `/shop/?category=${b.category}` : '/shop/'}
              className="market-promo-tile"
            >
              {b.image && (
                <img src={b.image} alt="" width="560" height="260" loading="lazy" />
              )}
              <div>
                <h2>{b.title}</h2>
                <p>{b.subtitle}</p>
                <strong>Explore collection →</strong>
              </div>
            </Link>
          ))}
        </section>
      )}
      <section className="market-edit-banner">
        <div>
          <p className="market-eyebrow">Your next good find</p>
          <h2>
            Small upgrades.
            <br />
            Big everyday joy.
          </h2>
        </div>
        <p>
          Discover what’s just arrived.
          <br />
          <Link href="/shop/?sort=newest">Explore new arrivals →</Link>
        </p>
      </section>
      <section className="market-discovery">
        <div className="market-section-heading">
          <h2>Shop your everyday</h2>
          <Link href="/shop-by-categories/">All categories →</Link>
        </div>
        <div className="market-discovery-grid">
          {itemsOf(categories.data).map((c, index) => {
            const match = itemsOf(products.data).find(
              (p) =>
                p.category === c.id ||
                (c.children || []).some((child) => child.id === p.category),
            );
            const image =
              c.image || match?.variants?.flatMap((v) => v.images || [])[0]?.image;
            return (
              <Link
                key={c.id}
                href={`/shop/?category=${c.id}`}
                className={`market-discovery-card tone-${index % 4}`}
              >
                {image ? (
                  <img
                    src={image}
                    width="280"
                    height="200"
                    alt={c.name}
                    loading="lazy"
                  />
                ) : (
                  <MarketIcon
                    name={
                      /fashion/i.test(c.name)
                        ? 'shirt'
                        : /electro/i.test(c.name)
                          ? 'headphones'
                          : 'home'
                    }
                    size={70}
                  />
                )}
                <div>
                  <h3>{c.name}</h3>
                  <span>Discover the collection →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      {itemsOf(products.data).length > 0 && (
        <section className="market-arrivals">
          <div className="market-section-heading">
            <h2>Just arrived</h2>
            <Link href="/shop/?sort=newest">Shop new arrivals →</Link>
          </div>
          <div className="market-product-rail">
            {itemsOf(products.data)
              .slice(0, 8)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}
      <div className="market-home-products">
        <section className="market-catalog is-home">
          <div className="container">
            <div className="market-section-heading">
              <h2>Products for you</h2>
              <Link href="/shop/">View all →</Link>
            </div>
            {products.loading ? (
              <Loading text="Loading products…" />
            ) : products.error ? (
              <ErrorState error={products.error} retry={products.reload} />
            ) : (
              <div className="market-product-grid">
                {!itemsOf(products.data).length && (
                  <Empty title="No products available yet" />
                )}
                {itemsOf(products.data).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <section className="market-service-strip">
        <article>
          <MarketIcon name="store" />
          <h3>Independent sellers</h3>
          <p>Discover products from marketplace businesses.</p>
        </article>
        <article>
          <MarketIcon name="heart" />
          <h3>Clear return policies</h3>
          <p>Check eligibility on every product before you buy.</p>
          <Link href="/return-policy/">Learn more →</Link>
        </article>
        <article>
          <MarketIcon name="bag" />
          <h3>Your orders, in one place</h3>
          <p>Review payment and shipment updates in your account.</p>
          <Link href="/my-order-history/">View orders →</Link>
        </article>
        <article>
          <MarketIcon name="user" />
          <h3>Here to help</h3>
          <p>Find answers about shopping and your account.</p>
          <Link href="/help-center/">Help centre →</Link>
        </article>
      </section>
    </div>
  );
}
