 'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {request,clearSession,saveCustomerIdentity} from '@/lib/api.mjs';
import {useResource,useStore} from './store-provider';
import MarketIcon from './market-icon';
export default function ProfileMenu(){
 const menu=useRef(null);const {session}=useStore();const router=useRouter();const [signingOut,setSigningOut]=useState(false);
 async function logout(){if(signingOut)return;setSigningOut(true);try{await request('/auth/logout/',{method:'POST',body:{refresh:session?.refresh}});}catch{}finally{clearSession();router.replace('/');}}
 const profile=useResource(session&&!session.seller?'/customer/profile/':null);
 const reloadProfile=profile.reload;
 useEffect(()=>{window.addEventListener('marketplace-profile-updated',reloadProfile);return()=>window.removeEventListener('marketplace-profile-updated',reloadProfile);},[reloadProfile]);
 useEffect(()=>{if(profile.data)saveCustomerIdentity(profile.data,session?.email);},[profile.data,session?.email]);
 const name=profile.data?.name?.trim()||session?.name?.trim();
 const storedMobile=String(profile.data?.mobile_number||session?.mobile_number||'').trim();
 const digits=storedMobile.replace(/[\s()-]/g,'');
 const mobile=/^\d{10}$/.test(digits)?'+91 '+digits:/^\+?91\d{10}$/.test(digits)?'+91 '+digits.slice(-10):storedMobile;
 const account=session?.seller?'/seller-dashboard/':'/account-info/';
 return <details ref={menu} className="market-profile-menu" onPointerEnter={e=>{if(e.pointerType==='mouse')menu.current.open=true;}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!e.currentTarget.contains(document.activeElement))menu.current.open=false;}} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))menu.current.open=false;}} onToggle={e=>{const expanded=e.currentTarget.open;if(expanded)e.currentTarget.closest('header')?.querySelectorAll('details[open]').forEach(other=>{if(other!==e.currentTarget)other.open=false;});}}><summary className="market-account-trigger" aria-label="Account and lists menu" title={session&&mobile?mobile:undefined}><span className="market-account-avatar" aria-hidden="true"><MarketIcon name="user" size={20}/></span><span className="market-account-copy"><span className="market-account-greeting">{session?name?`Hello, ${name}`:'Hello':'Hello, Sign in'}</span><strong>Account &amp; Lists <span aria-hidden="true">⌄</span></strong></span></summary><div className={`market-profile-dropdown ${session?'is-signed-in':''}`}>{session?<><Link className="market-account-menu-item" href="/my-order-history/">My Order</Link><Link className="market-account-menu-item" href={account}>My Profile</Link><button type="button" className="market-account-menu-item" disabled={signingOut} onClick={logout}>{signingOut?'Logging out…':'Logout'}</button></>:<><div className="market-profile-intro"><h2>Hello User</h2><p>To access your Unimart account</p><Link href="/signup/" className="market-profile-primary">Sign Up</Link><p className="market-profile-signin">Already registered? <Link href="/signin/">Sign in</Link></p></div><Link className="market-profile-orders" href="/my-order-history/"><MarketIcon name="bag" size={21}/><span>My Orders</span></Link><Link className="market-profile-orders" href="/wishlist/"><MarketIcon name="heart" size={21}/><span>Wishlist</span></Link><button className="market-profile-delete" type="button" disabled title="Account deletion is not available yet.">Delete Account</button></>}</div></details>;
}
