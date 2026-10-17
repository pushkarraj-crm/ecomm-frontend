'use client';
import Link from 'next/link';
import { productUrl } from '@/lib/product-url.mjs';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  catalogQuery,
  itemsOf,
  lowestPrice,
  money,
  productImages,
} from '@/lib/api.mjs';
import { useResource, useStore } from './store-provider';
import { Empty, ErrorState, Loading, Pager } from './ui';
import MarketIcon from './market-icon';
import CategoryFilter from './category-filter';
import { selectedCategoryIds } from '@/lib/categories.mjs';
export function ProductCard({ product }) {
  const { wishlist, toggleWish } = useStore();
  const image = productImages(product)[0];
  const price = lowestPrice(product),
    saved = wishlist.includes(String(product.id));
  const url = productUrl(product);
  const pricedVariant =
    (product.variants || []).find(
      (v) => Number(v.price) === Number(price) && Number(v.stock) > 0,
    ) || (product.variants || []).find((v) => Number(v.price) === Number(price));
  const original = Number(pricedVariant?.original_price);
  return (
    <article className="rbt-card rbt-product-card has-hover-box-shadow h-100">
      <div className="inner">
        <div className="rbt-card-img rbt-bg-color-default next-product-image">
          <Link href={url}>
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                width="340"
                height="300"
              />
            ) : (
              <span className="next-image-placeholder">Image unavailable</span>
            )}
          </Link>
          <div className="rbt-quick-btn-grp bottom-right--position">
            <button
              className={`rbt-quick-btn ${saved ? 'next-saved' : ''}`}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={saved}
              onClick={() => toggleWish(product.id)}
            >
              <MarketIcon name="heart" size={18} />
            </button>
          </div>
        </div>
        <div className="rbt-card-body">
          <h3 className="rbt-card-title h6">
            <Link href={url}>{product.name}</Link>
          </h3>
          <div className="pricing-part">
            <span className="price-text">
              {price == null ? 'Price unavailable' : money(price)}
            </span>
            {original > Number(price) && (
              <>
                <del className="market-original-price">{money(original)}</del>
                <span className="market-discount">
                  {Math.round((1 - Number(price) / original) * 100)}% off
                </span>
              </>
            )}
          </div>
          <div className="market-card-meta">
            {product.average_rating != null ? (
              <span className="market-rating">
                {Number(product.average_rating).toFixed(1)} ★{' '}
                <small>({product.review_count})</small>
              </span>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
          {product.seller?.store_name && (
            <p className="market-card-seller">{product.seller.store_name}</p>
          )}
          <p className="next-stock">
            {(product.variants || []).some((v) => Number(v.stock) > 0)
              ? 'In stock'
              : 'Out of stock'}
          </p>
          <div className="prd-btn-grp">
            <Link className="rbt-btn rbt-btn-border rbt-btn-sm d-block" href={url}>
              Choose options
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
export default function Catalog({
  home = false,
  title = 'Products for you',
  limit = 24,
}) {
  const query = useSearchParams(),
    router = useRouter();
  const page = Math.max(1, Number(query.get('page')) || 1),
    sort = query.get('sort') || 'newest',
    search = home ? '' : query.get('search') || '';
  const params = new URLSearchParams(
    catalogQuery({
      search,
      sort: home ? 'newest' : sort,
      page: home ? 1 : page,
      pageSize: home ? limit : query.get('page_size') || 24,
    }),
  );
  if (!home)
    for (const key of [
      'category',
      'category_ids',
      'seller',
      'min_price',
      'max_price',
      'size',
      'color',
      'in_stock',
      'min_rating',
    ])
      if (query.get(key)) params.set(key, query.get(key));
  const resource = useResource('/products/?' + params, { public: true });
  const categories = useResource(home ? null : '/products/categories/', {
    public: true,
  });
  const selectedCategories = selectedCategoryIds(query);
  function changeCategories(ids) {
    const next = new URLSearchParams(query);
    next.delete('category');
    next.delete('category_ids');
    if (ids.length) next.set('category_ids', ids.join(','));
    next.set('page', '1');
    router.push('/shop/?' + next);
  }
  function change(values) {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(values)) next.set(k, String(v));
    router.push('/shop/?' + next);
  }
  function applyFilters(e) {
    e.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(e.currentTarget))
      if (String(value).trim()) next.set(key, String(value));
    next.set('page', '1');
    router.push('/shop/?' + next);
  }
  return (
    <section className={`market-catalog ${home ? 'is-home' : ''}`}>
      <div className="container">
        <div className="market-section-heading">
          <h2>
            {home ? title : search ? `Results for “${search}”` : 'Products for you'}
          </h2>
          {!home && (
            <label className="market-sort">
              Sort by:{' '}
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => change({ sort: e.target.value, page: 1 })}
              >
                {[
                  ['newest', 'Newest arrivals'],
                  ['price_asc', 'Price: low to high'],
                  ['price_desc', 'Price: high to low'],
                  ['name_asc', 'Name: A to Z'],
                  ['name_desc', 'Name: Z to A'],
                ].map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className={home ? '' : 'market-catalog-layout'}>
          {!home && (
            <aside className="market-filter-panel">
              <div className="market-filter-heading">
                <h3>Filters</h3>
                <Link href="/shop/">Clear all</Link>
              </div>
              <p>
                {resource.data
                  ? `${resource.data.count ?? itemsOf(resource.data).length} products`
                  : 'Find your next favourite'}
              </p>
              <form key={query.toString()} onSubmit={applyFilters}>
                <input type="hidden" name="search" value={search} />
                <input type="hidden" name="sort" value={sort} />
                {query.get('seller') && (
                  <input type="hidden" name="seller" value={query.get('seller')} />
                )}
                {selectedCategories.length > 0 && (
                  <input
                    type="hidden"
                    name="category_ids"
                    value={selectedCategories.join(',')}
                  />
                )}
                <CategoryFilter
                  categories={itemsOf(categories.data)}
                  selected={selectedCategories}
                  onChange={changeCategories}
                  loading={categories.loading}
                  error={categories.error}
                  retry={categories.reload}
                />
                <fieldset>
                  <legend>Price</legend>
                  <div className="market-price-range">
                    <input
                      name="min_price"
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Minimum price"
                      placeholder="Min ₹"
                      defaultValue={query.get('min_price') || ''}
                    />
                    <span>–</span>
                    <input
                      name="max_price"
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Maximum price"
                      placeholder="Max ₹"
                      defaultValue={query.get('max_price') || ''}
                    />
                  </div>
                </fieldset>
                <label>
                  Size
                  <input
                    name="size"
                    maxLength={50}
                    placeholder="e.g. M, L, Free size"
                    defaultValue={query.get('size') || ''}
                  />
                </label>
                <label>
                  Color
                  <input
                    name="color"
                    maxLength={50}
                    placeholder="e.g. Blue"
                    defaultValue={query.get('color') || ''}
                  />
                </label>
                <label>
                  Customer rating
                  <select
                    name="min_rating"
                    defaultValue={query.get('min_rating') || ''}
                  >
                    <option value="">All ratings</option>
                    {[4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} stars & above
                      </option>
                    ))}
                  </select>
                </label>
                <label className="market-stock-check">
                  <input
                    name="in_stock"
                    type="checkbox"
                    value="true"
                    defaultChecked={query.get('in_stock') === 'true'}
                  />
                  In stock only
                </label>
                <button className="market-shop-button" type="submit">
                  Apply filters
                </button>
              </form>
            </aside>
          )}
          <div className="market-catalog-results">
            {resource.loading ? (
              <Loading text="Loading products…" />
            ) : resource.error ? (
              <ErrorState error={resource.error} retry={resource.reload} />
            ) : !itemsOf(resource.data).length ? (
              <Empty title="No products found">
                <p>Try another search or adjust your filters.</p>
              </Empty>
            ) : (
              <div className="market-product-grid">
                {itemsOf(resource.data).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {!home && resource.data && (
              <Pager
                page={page}
                previous={resource.data.previous}
                next={resource.data.next}
                change={(page) => change({ page })}
              />
            )}
          </div>
        </div>
        {home && (
          <div className="text-center mt--32">
            <Link className="market-outline-button" href="/shop/">
              Explore all products →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
export { default as Categories } from './category-directory';
