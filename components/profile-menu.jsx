 'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import {useResource,useStore} from './store-provider';
import MarketIcon from './market-icon';
export default function ProfileMenu(){
 const menu=useRef(null);const [open,setOpen]=useState(false);const {session}=useStore();
 const profile=useResource(open&&session&&!session.seller?'/customer/profile/':null);
 const name=profile.data?.name?.trim();
 const account=session?.seller?'/seller-dashboard/':'/account-info/';
 return <details ref={menu} className="market-profile-menu" onPointerEnter={e=>{if(e.pointerType==='mouse')menu.current.open=true;}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!e.currentTarget.contains(document.activeElement))menu.current.open=false;}} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))menu.current.open=false;}} onToggle={e=>{const expanded=e.currentTarget.open;setOpen(expanded);if(expanded)e.currentTarget.closest('header')?.querySelectorAll('details[open]').forEach(other=>{if(other!==e.currentTarget)other.open=false;});}}><summary className="market-header-icon" aria-label="Profile menu"><MarketIcon name="user"/><span>Profile</span></summary><div className="market-profile-dropdown"><div className="market-profile-intro"><h2>{name?`Hello ${name}`:'Hello User'}</h2><p>{session?'Manage your Unimart account':'To access your Unimart account'}</p><Link href={session?account:'/signup/'} className="market-profile-primary">{session?'Your Account':'Sign Up'}</Link>{!session&&<p className="market-profile-signin">Already registered? <Link href="/signin/">Sign in</Link></p>}</div><Link className="market-profile-orders" href="/my-order-history/"><MarketIcon name="bag" size={21}/><span>My Orders</span></Link><Link className="market-profile-orders" href="/wishlist/"><MarketIcon name="heart" size={21}/><span>Wishlist</span></Link><button className="market-profile-delete" type="button" disabled title="Account deletion is not available yet.">Delete Account</button></div></details>;
}
