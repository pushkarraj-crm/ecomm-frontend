 'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {useResource,useStore} from './store-provider';
import MarketIcon from './market-icon';
export default function ProfileMenu(){
 const menu=useRef(null);const {session}=useStore();
 const profile=useResource(session&&!session.seller?'/customer/profile/':null);
 const reloadProfile=profile.reload;
 useEffect(()=>{window.addEventListener('marketplace-profile-updated',reloadProfile);return()=>window.removeEventListener('marketplace-profile-updated',reloadProfile);},[reloadProfile]);
 const name=profile.data?.name?.trim();
 const storedMobile=String(profile.data?.mobile_number||'').trim();
 const digits=storedMobile.replace(/[\s()-]/g,'');
 const mobile=/^\d{10}$/.test(digits)?'+91 '+digits:/^\+?91\d{10}$/.test(digits)?'+91 '+digits.slice(-10):storedMobile;
 const account=session?.seller?'/seller-dashboard/':'/account-info/';
 return <details ref={menu} className="market-profile-menu" onPointerEnter={e=>{if(e.pointerType==='mouse')menu.current.open=true;}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!e.currentTarget.contains(document.activeElement))menu.current.open=false;}} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))menu.current.open=false;}} onToggle={e=>{const expanded=e.currentTarget.open;if(expanded)e.currentTarget.closest('header')?.querySelectorAll('details[open]').forEach(other=>{if(other!==e.currentTarget)other.open=false;});}}><summary className="market-header-icon" aria-label="Profile menu"><MarketIcon name="user"/><span>Profile</span></summary><div className="market-profile-dropdown"><div className="market-profile-intro">{session?<div className="market-profile-identity"><span className="market-profile-avatar" aria-hidden="true"><svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="16" r="9" fill="currentColor"/><path d="M7 47v-4a17 17 0 0 1 34 0v4Z" fill="currentColor"/></svg></span><div><h2>{name?`Hello ${name}`:'Hello User'}</h2>{mobile&&<p>{mobile}</p>}</div></div>:<><h2>Hello User</h2><p>To access your Unimart account</p></>}<Link href={session?account:'/signup/'} className="market-profile-primary">{session?'Your Account':'Sign Up'}</Link>{!session&&<p className="market-profile-signin">Already registered? <Link href="/signin/">Sign in</Link></p>}</div><Link className="market-profile-orders" href="/my-order-history/"><MarketIcon name="bag" size={21}/><span>My Orders</span></Link><Link className="market-profile-orders" href="/wishlist/"><MarketIcon name="heart" size={21}/><span>Wishlist</span></Link><button className="market-profile-delete" type="button" disabled title="Account deletion is not available yet.">Delete Account</button></div></details>;
}
