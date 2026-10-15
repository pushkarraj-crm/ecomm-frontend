'use client';
import Link from 'next/link';
import { useState } from 'react';
import { money, quantityValue, request } from '@/lib/api.mjs';
import { useResource, useStore } from './store-provider';
import { AuthGate, Button, Empty, ErrorState, Loading } from './ui';
export function OrderSummary({ items, checkout = false }) {
  const total = items.reduce((n,i) => n + Number(i.price) * Number(i.quantity),0), count = items.reduce((n,i) => n + Number(i.quantity),0);
  return <aside className="rbt-sidebar-widget rbt-sidebar-cart next-panel"><div className="rbt-inner"><h3 className="h5">Order Summary</h3><div className="rbt-cart-subttotal"><p>Items ({count})</p><p className="price">{money(total)}</p></div><div className="rbt-cart-subttotal"><p>Subtotal</p><p className="price">{money(total)}</p></div><p className="description-text">Final amount is confirmed at payment.</p>{checkout ? <Link className="rbt-btn w-100 text-center" href="/checkout-delivery-step-one/">Proceed to Checkout</Link> : <Link href="/cart/">Edit cart</Link>}</div></aside>;
}
function CartContent() {
  const resource = useResource('/cart/'), {refreshCart,notify} = useStore(); const [busy,setBusy]=useState(false);
  async function mutate(path,method,body) { if(busy)return;setBusy(true); try {await request(path,{method,body});await refreshCart();resource.reload();} catch(e){notify(e.message,true);resource.reload();}finally{setBusy(false);} }
  if(resource.loading)return <Loading text="Loading your cart…"/>;
  if(resource.error)return <ErrorState error={resource.error} retry={resource.reload}/>;
  const items=resource.data?.items||[];
  return <section className="rbt-component-area rbt-cart-page rbt-section-gap2"><div className="container"><h1 className="h3 mb--32">Shopping Cart</h1>{!items.length?<Empty title="Your cart is empty"><p>Explore the catalog and find something you love.</p></Empty>:<div className="row row--30"><div className="col-lg-8"><div className="table-responsive"><table className="table next-cart-table"><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><h3 className="rbt-wish-product-name h6">{i.product_name || (typeof i.product==='object'?i.product.name:i.product) || 'Product'}</h3><span>{[i.size||i.variant?.size,i.color||i.variant?.color].filter(Boolean).join(' / ')}</span></td><td>{money(i.price)}</td><td><input className="rbt-input-field next-quantity" type="number" min="1" step="1" defaultValue={i.quantity} key={`${i.id}-${i.quantity}`} disabled={busy} aria-label={`Quantity for ${i.product_name||'product'}`} onBlur={e=>{if(Number(e.target.value)===Number(i.quantity))return;try{const q=quantityValue(e.target.value);mutate(`/cart/update/${encodeURIComponent(i.id)}/`,'PATCH',{quantity:q});}catch(error){notify(error.message,true);e.target.value=String(i.quantity);}}}/></td><td>{money(Number(i.price)*Number(i.quantity))}</td><td><Button small secondary disabled={busy} onClick={()=>mutate(`/cart/remove/${encodeURIComponent(i.id)}/`,'DELETE')}>Remove</Button></td></tr>)}</tbody></table></div><div className="d-flex gap-3 mt--24"><Link href="/shop/" className="rbt-btn rbt-btn-border">Continue shopping</Link><Button secondary disabled={busy} onClick={()=>mutate('/cart/clear/','DELETE')}>Clear cart</Button></div></div><div className="col-lg-4"><OrderSummary items={items} checkout/></div></div>}</div></section>;
}
export default function Cart(){return <AuthGate><CartContent/></AuthGate>;}
