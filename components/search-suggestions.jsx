
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,itemsOf,money,lowestPrice} from '@/lib/api.mjs';
import {productUrl} from '@/lib/product-url.mjs';
import MarketIcon from './market-icon';
export default function SearchSuggestions(){
 const [value,setValue]=useState(''),[options,setOptions]=useState([]),[open,setOpen]=useState(false);
 useEffect(()=>{let active=true;if(value.trim().length<2){setOptions([]);return}const timer=setTimeout(()=>request('/products/?search='+encodeURIComponent(value.trim())+'&page=1&page_size=5',{public:true}).then(data=>{if(active)setOptions(itemsOf(data))}).catch(()=>{if(active)setOptions([])}),300);return()=>{active=false;clearTimeout(timer)}},[value]);
 return <form className="market-search" role="search" action="/shop/" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}><button type="submit" aria-label="Search products"><MarketIcon name="search"/></button><input type="search" name="search" aria-label="Search products" maxLength={100} autoComplete="off" placeholder="Try a product, category or style" value={value} onChange={e=>{setValue(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)}/>{open&&options.length>0&&<div className="market-search-suggestions"><p>Suggested products</p>{options.map(p=><Link key={p.id} href={productUrl(p)} onClick={()=>setOpen(false)}><span>{p.name}</span><small>{money(lowestPrice(p))}</small></Link>)}<button type="submit">See all results for “{value}” →</button></div>}</form>
}
