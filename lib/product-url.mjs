// Amazon-style readable path with a stable product ID.
export function productUrl(product) {
  const id = String(product?.id ?? '');
  if (!/^[1-9]\d*$/.test(id)) throw new Error('A valid product ID is required.');
  const slug = String(product.slug || product.name || 'product').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
  return `/${slug}/dp/${id}/`;
}
export function parseProductPath(path) {
  const match = String(path).replace(/^\/|\/$/g, '').match(/^([a-z0-9_-]+)\/dp\/([1-9]\d*)$/);
  return match ? { slug: match[1], id: match[2] } : null;
}
