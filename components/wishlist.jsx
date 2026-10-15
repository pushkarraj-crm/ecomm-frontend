'use client';
import {useEffect,useState} from 'react';
import {request} from '@/lib/api.mjs';
import {useStore} from './store-provider';
import {ProductCard} from './catalog';
import {Empty,Loading} from './ui';
export default function Wishlist(){const{wishlist,ready}=useStore();const[products,setProducts]=useState([]),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false);useEffect(()=>{if(!ready)return;const controller=new AbortController();setLoading(true);Promise.allSettled(wishlist.map(id=>request('/products/'+encodeURIComponent(id)+'/',{public:true,signal:controller.signal}))).then(results=>{if(controller.signal.aborted)return;setProducts(results.filter(r=>r.status==='fulfilled').map(r=>r.value));setFailed(results.some(r=>r.status==='rejected'));setLoading(false);});return()=>controller.abort();},[wishlist,ready]);return <section className="rbt-section-gap2"><div className="container"><h1 className="h3">My Wishlist</h1><p>Saved in this browser.</p>{loading?<Loading/>:!wishlist.length?<Empty title="Save your favourites"/>:<><div className="row">{products.map(p=><div className="col-lg-3 col-sm-6 col-6 mt--24" key={p.id}><ProductCard product={p}/></div>)}</div>{failed&&<p role="status">Some saved products are unavailable. Please try again later.</p>}</>}</div></section>;}
