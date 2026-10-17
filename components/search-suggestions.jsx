'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { request, itemsOf, money, lowestPrice } from '@/lib/api.mjs';
import { productUrl } from '@/lib/product-url.mjs';
import { categorySuggestions } from '@/lib/categories.mjs';
import MarketIcon from './market-icon';
export default function SearchSuggestions({ categories = [] }) {
  const [value, setValue] = useState(''),
    [results, setResults] = useState({ query: '', items: [] }),
    [open, setOpen] = useState(false);
  const pathname = usePathname(),
    router = useRouter(),
    term = value.trim();
  const categoryOptions = categorySuggestions(categories, term),
    products = results.query === term ? results.items : [];
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        request(
          '/products/?search=' + encodeURIComponent(term) + '&page=1&page_size=5',
          { public: true, signal: controller.signal },
        )
          .then((data) => {
            if (!controller.signal.aborted)
              setResults({ query: term, items: itemsOf(data) });
          })
          .catch(() => {
            if (!controller.signal.aborted) setResults({ query: term, items: [] });
          }),
      300,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  function submit(event) {
    event.preventDefault();
    setOpen(false);
    const directory = /^\/(home\/categories|shop-by-categories)\/?$/.test(pathname);
    router.push(
      (directory ? '/home/categories' : '/shop/') +
        (term ? '?search=' + encodeURIComponent(term) : ''),
    );
  }
  return (
    <form
      className="market-search"
      role="search"
      action="/shop/"
      onSubmit={submit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button type="submit" aria-label="Search products and categories">
        <MarketIcon name="search" />
      </button>
      <input
        type="search"
        name="search"
        aria-label="Search products and categories"
        aria-expanded={
          open &&
          term.length >= 2 &&
          (categoryOptions.length > 0 || products.length > 0)
        }
        aria-controls="market-main-search-suggestions"
        maxLength={100}
        autoComplete="off"
        placeholder="Try a product, category or style"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open &&
        term.length >= 2 &&
        (categoryOptions.length > 0 || products.length > 0) && (
          <div
            id="market-main-search-suggestions"
            className="market-search-suggestions"
          >
            {categoryOptions.length > 0 && (
              <>
                <p>Categories</p>
                {categoryOptions.map((category) => (
                  <Link
                    key={category.id}
                    href={'/shop/?category=' + encodeURIComponent(category.id)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="market-search-category">
                      <strong>{category.name}</strong>
                      {category.breadcrumb && <small>{category.breadcrumb}</small>}
                    </span>
                    <MarketIcon name="arrow" size={16} />
                  </Link>
                ))}
                <Link
                  className="market-search-all-categories"
                  href={'/home/categories?search=' + encodeURIComponent(term)}
                  onClick={() => setOpen(false)}
                >
                  See all matching categories →
                </Link>
              </>
            )}
            {products.length > 0 && (
              <>
                <p>Products</p>
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={productUrl(product)}
                    onClick={() => setOpen(false)}
                  >
                    <span>{product.name}</span>
                    <small>{money(lowestPrice(product))}</small>
                  </Link>
                ))}
              </>
            )}
            <button type="submit">See all results for “{value}” →</button>
          </div>
        )}
    </form>
  );
}
