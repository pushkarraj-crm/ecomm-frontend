 'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {itemsOf} from '@/lib/api.mjs';
import {useResource,useStore} from './store-provider';
import ThemeToggle from './theme-toggle';
import MarketIcon from './market-icon';
import SearchSuggestions from './search-suggestions';
import DeliveryCheck from './delivery-check';
import ProfileMenu from './profile-menu';
import CategoryNavbar from './category-navbar';
export default function Header(){const header=useRef(null);function closeMenus(){header.current?.querySelectorAll('details[open]').forEach(menu=>{menu.open=false;});}useEffect(()=>{function outside(e){if(!header.current?.contains(e.target))closeMenus();}function escape(e){if(e.key==='Escape'){const active=header.current?.querySelector('details[open] summary');closeMenus();active?.focus();}}document.addEventListener('click',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('click',outside);document.removeEventListener('keydown',escape);};},[]);const {session,cart}=useStore();const categories=useResource('/products/categories/',{public:true});const count=(cart?.items||[]).reduce((n,i)=>n+Number(i.quantity),0);return <header className="market-header" ref={header} onClick={e=>{if(e.target.closest('a'))closeMenus();}}><div className="market-header-main"><Link href="/" className="market-wordmark" aria-label="Unimart home">unimart<span>everyday, for you</span></Link><SearchSuggestions/><div className="market-header-actions"><a className="market-seller-login" href="https://d2c-seller-dashboard.vercel.app/login">Seller login</a><ThemeToggle/><ProfileMenu key={session?.email||'guest'}/><Link className="market-orders-shortcut" href="/my-order-history/"><span>Returns</span><strong>&amp; Orders</strong></Link><Link className="market-cart-shortcut" href="/cart/" aria-label={`Cart, ${count} items`}><span className="market-cart-symbol"><MarketIcon name="cart" size={32}/><span className="market-cart-count">{count}</span></span><strong>Cart</strong></Link></div></div><div className="market-location-row"><DeliveryCheck compact/><span>Discover more. Shop independent sellers.</span></div><CategoryNavbar categories={itemsOf(categories.data)}/></header>;}
