'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {orderedCategories} from '@/lib/categories.mjs';

const categoryUrl=id=>`/shop/?category=${encodeURIComponent(id)}`;
export default function CategoryNavbar({categories=[]}){
  const [active,setActive]=useState(null);
  const nav=useRef(null);
  useEffect(()=>{
    function outside(event){if(!nav.current?.contains(event.target))setActive(null);}
    function escape(event){if(event.key==='Escape'){nav.current?.querySelector('[aria-expanded="true"]')?.focus();setActive(null);}}
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  const selected=categories.find(category=>String(category.id)===active);
  const groups=selected?.children?.length?selected.children:selected?[selected]:[];
  return <nav className="market-mega-nav" aria-label="Shopping categories" ref={nav} onMouseLeave={()=>setActive(null)} onClick={event=>{if(event.target.closest('a'))setActive(null);}}>
    <div className="market-mega-tabs">{orderedCategories(categories).map(category=><button key={category.id} type="button" className={active===String(category.id)?'is-active':''} aria-expanded={active===String(category.id)} aria-controls="market-category-panel" onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches)setActive(String(category.id));}} onClick={()=>setActive(value=>value===String(category.id)?null:String(category.id))}>{category.name}</button>)}<Link href="/home/categories" onMouseEnter={()=>setActive(null)}>View all</Link></div>
    {selected&&<div id="market-category-panel" className="market-mega-panel" aria-label={`${selected.name} categories`}>
      <div className="market-mega-panel-heading"><Link href={categoryUrl(selected.id)}>Shop all {selected.name} <span aria-hidden="true">→</span></Link><button type="button" onClick={()=>setActive(null)} aria-label="Close categories">×</button></div>
      <div className="market-mega-columns">{groups.map(group=><section className="market-mega-column" key={group.id}><h2><Link href={categoryUrl(group.id)}>{group.name}</Link></h2><div className="market-mega-pills">{(group.children?.length?group.children:[{id:group.id,name:`Shop all ${group.name}`}]).map(child=><Link key={child.id} href={categoryUrl(child.id)}>{child.name}</Link>)}</div></section>)}</div>
    </div>}
  </nav>;
}
