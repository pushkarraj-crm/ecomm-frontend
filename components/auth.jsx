'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { request, safeNext, saveSession } from '@/lib/api.mjs';
import { useStore } from './store-provider';
import { Button, Field } from './ui';
export default function Auth({ mode = 'login', seller = false }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const query = useSearchParams(), router = useRouter(), { notify } = useStore();
  const reset = mode === 'reset', register = mode === 'register', tokenReset = reset && query.has('uid') && query.has('token');
  async function submit(e) {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget)); data.email = data.email?.trim();
    try {
      if (reset) { await request(tokenReset ? '/auth/reset-password/' : '/auth/forgot-password/', { method:'POST', public:true, body:tokenReset ? {uid:query.get('uid'),token:query.get('token'),new_password:data.new_password} : {email:data.email} }); setMessage(tokenReset ? 'Password updated. You can now sign in.' : 'If an account exists, reset instructions have been sent.'); return; }
      if (register) { await request(seller ? '/auth/seller/register/' : '/auth/register/', {method:'POST',public:true,body:data}); if (seller) { notify('Seller account created. Please sign in.'); router.push('/seller-signin/'); return; } }
      let session;
      try { session = await request(seller ? '/auth/seller/login/' : '/auth/customer/login/', {method:'POST',public:true,body:{email:data.email,password:data.password}}); }
      catch(e) { if(register) { notify('Your account was created. Please sign in.'); router.push('/signin/'); return; } throw e; }
      saveSession(session,data.email,seller); router.replace(safeNext(query.get('next'),seller ? '/seller-dashboard/' : '/'));
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  const heading = reset ? tokenReset ? 'Set a New Password' : 'Reset Password' : register ? `Create ${seller ? 'Seller ' : ''}Account` : `${seller ? 'Seller ' : ''}Sign In`;
  return <section className="rbt-component-area rbt-section-gap2"><div className="container"><div className="rbt-login-form next-auth"><h1 className="h3">{heading}</h1><p className="description">{reset ? 'Manage access to your account.' : 'Welcome to Unimart. Enter your details to continue.'}</p>{message ? <div role="status"><p>{message}</p><Link className="rbt-btn" href="/signin/">Sign in</Link></div> : <form onSubmit={submit}>{register && (seller ? <Field label="Business name" name="business_name" required={false} /> : <><Field label="Full name" name="name" autoComplete="name" /><Field label="Mobile number" name="mobile_number" type="tel" autoComplete="tel" /></>)}{!tokenReset && <Field label="Email address" name="email" type="email" autoComplete="email" />}{(!reset || tokenReset) && <Field label={tokenReset ? 'New password' : 'Password'} name={tokenReset ? 'new_password' : 'password'} type="password" autoComplete={register || tokenReset ? 'new-password' : 'current-password'} />}{error && <p className="next-error" role="alert">{error}</p>}<Button type="submit" disabled={busy} className="w-100">{busy ? 'Please wait…' : reset ? tokenReset ? 'Save password' : 'Send reset instructions' : register ? 'Create account' : 'Sign in'}</Button></form>}<div className="mt--24">{!reset && <p>{register ? 'Already registered?' : 'New here?'} <Link href={`/${seller ? 'seller-' : ''}${register ? 'signin' : 'signup'}/`}>{register ? 'Sign in' : 'Create an account'}</Link></p>}{!register && !reset && <Link href="/reset-password/">Forgot password?</Link>}{seller && <p className="mt--16"><Link href="/signin/">Customer sign in</Link></p>}</div></div></div></section>;
}
