'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {itemsOf} from '@/lib/api.mjs';
import {orderedCategories,categoryPath,matchesCategory} from '@/lib/categories.mjs';
import {useResource} from './store-provider';
import {Empty,ErrorState,Loading} from './ui';
import CategoryArt from './category-art';
const directoryUrl=id=>'/home/categories'+(id?'?category='+encodeURIComponent(id):'');
const shopUrl=id=>'/shop/?category='+encodeURIComponent(id);
export default function CategoryDirectory(){
 const resource=useResource('/products/categories/',{public:true}),query=useSearchParams(),[search,setSearch]=useState('');
 const roots=orderedCategories(itemsOf(resource.data)),selectedId=query.get('category'),path=categoryPath(roots,selectedId),selected=path.at(-1);
 const visible=(selected?selected.children||[]:roots).filter(category=>matchesCategory(category,search));
 return <section className="market-directory"><div className="market-directory-inner"><nav className="market-directory-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href={directoryUrl()}>All categories</Link>{path.map(category=><span key={category.id}><span aria-hidden="true"> / </span><Link href={directoryUrl(category.id)} aria-current={category.id===selected?.id?'page':undefined}>{category.name}</Link></span>)}</nav>
 <div className="market-directory-heading"><div><h1>{selected?.name||'All Categories'}</h1><p>{selected?'Discover every style and essential in '+selected.name+'.':'Find your favourites, one category at a time.'}</p></div><Link className="market-outline-button" href={selected?shopUrl(selected.id):'/shop/'}>{selected?'Shop all '+selected.name:'Shop all products'} <span aria-hidden="true">→</span></Link></div>
 {resource.loading?<Loading text="Loading categories…"/>:resource.error?<ErrorState error={resource.error} retry={resource.reload}/>:selectedId&&!selected?<Empty title="Category not found"><Link href={directoryUrl()}>Browse all categories</Link></Empty>:<><div className="market-directory-toolbar"><label><span className="sr-only">Search categories</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search categories…" maxLength={100}/></label><span aria-live="polite">{visible.length} {selected?'subcategories':'categories'}</span></div>{visible.length?<div className="market-directory-grid">{visible.map((category,index)=><article key={category.id} className={'market-directory-card tone-'+index%6}><Link className="market-directory-card-link" href={category.children?.length?directoryUrl(category.id):shopUrl(category.id)}><span className="market-directory-art">{category.image?<img src={category.image} alt="" width="112" height="112" loading="lazy"/>:<CategoryArt name={category.name}/>}</span><h2>{category.name}</h2><span className="market-directory-card-caption">{category.children?.length?category.children.length+' subcategories':'Explore products'} <span aria-hidden="true">→</span></span></Link>{selected&&category.children?.length>0&&<div className="market-directory-leaves">{category.children.filter(leaf=>!search||matchesCategory(leaf,search)||category.name.toLowerCase().includes(search.toLowerCase())).map(leaf=><Link key={leaf.id} href={leaf.children?.length?directoryUrl(leaf.id):shopUrl(leaf.id)}>{leaf.name}</Link>)}</div>}</article>)}</div>:selected&&!search?<div className="market-directory-leaf"><CategoryArt name={selected.name}/><h2>Explore {selected.name}</h2><Link className="market-shop-button" href={shopUrl(selected.id)}>View products →</Link></div>:<Empty title="No matching categories"><p>Try another category name.</p></Empty>}</>}
 </div></section>;
}
