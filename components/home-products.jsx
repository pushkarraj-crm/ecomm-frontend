'use client';
import { createContext, useContext } from 'react';
import { itemsOf } from '@/lib/api.mjs';
import { useResource } from './store-provider';
import { ProductCard } from './catalog';
import { ErrorState } from './ui';
const Products = createContext(null);
export function HomeProducts({ children }) {
  const resource = useResource('/products/?page=1&page_size=100&sort=newest', {
    public: true,
  });
  return <Products.Provider value={resource}>{children}</Products.Provider>;
}
export function HomeProductSlot({ index = 0 }) {
  const resource = useContext(Products);
  if (!resource) return null;
  if (resource.loading)
    return <div className="next-skeleton" role="status" aria-label="Loading product" />;
  if (resource.error)
    return index === 0 ? (
      <ErrorState error={resource.error} retry={resource.reload} />
    ) : (
      <div className="next-product-unavailable">Products unavailable</div>
    );
  const products = itemsOf(resource.data);
  if (!products.length) return index === 0 ? <p>No products available yet.</p> : null;
  return <ProductCard product={products[index % products.length]} />;
}
