import {Suspense} from 'react';
import MarketHome from '@/components/market-home';
export default function Home(){return <Suspense fallback={<div className="next-state">Loading your marketplace…</div>}><MarketHome/></Suspense>;}
