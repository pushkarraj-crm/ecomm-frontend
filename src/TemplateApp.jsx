import React, { useEffect, useMemo, useState } from 'react';

import parse, { domToReact, attributesToProps } from 'html-react-parser';

import { useLocation, useNavigate } from 'react-router-dom';

import { api, session, saveSession, clearSession, download, rows } from './api.js';

import { AccountTools } from './AccountTools.jsx';

const templates = Object.fromEntries(Object.entries(import.meta.glob('./templates/**/*.html', { query: '?raw', import: 'default' })).map(([key, load]) => [key.replace('./templates/', '../default/'), load]));

const money = n => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'}).format(Number(n || 0));

const text = node => node?.type === 'text' ? node.data : node?.children?.map(text).join('') || '';

const hasClass = (node, c) => node.attribs?.class?.split(/\s+/).includes(c);

function ancestor(node, test) { for (let p = node.parent; p; p=p.parent) if (test(p)) return p; return null; }

function Status({error, message, busy}) { return error ? <div className="alert alert-danger" role="alert">{error}</div> : message ? <div className="alert alert-success" role="status">{message}</div> : busy ? <div className="text-muted p-3" role="status">Loading…</div> : null; }

export default function TemplateApp() {

  const location=useLocation(), navigate=useNavigate();

  const [html,setHtml]=useState(''), [error,setError]=useState(''), [message,setMessage]=useState(''), [busy,setBusy]=useState(false), [user,setUser]=useState(session());

  const [data,setData]=useState({}), [revision,setRevision]=useState(0), [page,setPage]=useState(1), [orderTab,setOrderTab]=useState('pending'), [search,setSearch]=useState(''), [period,setPeriod]=useState('last_30_days'), [tool,setTool]=useState(''), [passwordVisible,setPasswordVisible]=useState(false), [categoryParent,setCategoryParent]=useState('');

  let file=decodeURIComponent(location.pathname).replace(/^\/(?:default\/)?/,'') || 'index.html';

  if (file === 'apps-ecommerce-orders.html') file='orders.html';

  const isAuth=/auth-(signin|signup|pass-reset|pass-change)/.test(file);

  const authFile=file.includes('/') ? file : `Extra Pages/${file}`;

  useEffect(() => { const fn=()=>setUser(session()); window.addEventListener('session-change',fn); return ()=>window.removeEventListener('session-change',fn); },[]);

  useEffect(() => { let active=true; setError(''); setMessage(''); setHtml(''); setSearch(''); setCategoryParent(''); setPage(1); const key=templates[`../default/${file}`] ? file : authFile; const load=templates[`../default/${key}`]; if (!load) {setError('This page is not available. Return to the dashboard.'); return;} load().then(source => { if(active) setHtml(source.replace(/\r\n?/g,'\n')); }); return ()=>{active=false;}; },[file]);

  const reload=()=>setRevision(n=>n+1);

  useEffect(() => {

    if (!user?.access || isAuth) { setData({}); return; }

    const controller=new AbortController(); let paths;

    if(file==='index.html') paths={dashboard:'/seller/dashboard/',analytics:`/seller/analytics/?period=${period}`,profile:'/seller/profile/'};

    else if(file==='orders.html' || file==='apps-ecommerce-order-details.html' || file.startsWith('apps-invoices')) paths={orders:`/seller/orders/?page=${new URLSearchParams(location.search).get('page') || page}${file==='orders.html' && ['pending','shipped','delivered'].includes(orderTab)?`&status=${orderTab}`:''}`};

    else if(file==='apps-ecommerce-products.html') paths={inventory:`/seller/inventory/?page=${page}`,summary:'/seller/inventory/summary/'};

    else if(file==='apps-ecommerce-add-product.html') paths={categories:'/products/categories/'};

    else if(file==='apps-ecommerce-product-details.html') {const id=new URLSearchParams(location.search).get('id'); paths=id ? {product:`/products/${encodeURIComponent(id)}/`} : {};}

    else if(file==='apps-ecommerce-seller-details.html' || file==='Extra Pages/pages-profile-settings.html') paths={profile:'/seller/profile/'};

    else paths={};

    setBusy(Object.keys(paths).length>0); setError(''); setData({});

    Promise.allSettled(Object.entries(paths).map(async ([key,path])=>[key,await api(path,{signal:controller.signal})])).then(results=>{ if(controller.signal.aborted)return; const next={}; const errors=[]; results.forEach(r=>r.status==='fulfilled' ? next[r.value[0]]=r.value[1] : errors.push(r.reason.message)); setData(next); setError(errors.join(' · ')); setBusy(false); });

    return ()=>controller.abort();

  },[file,user?.access,page,orderTab,revision,period,location.search,isAuth]);

  async function action(fn, success) {setBusy(true);setError('');setMessage('');try {await fn();if(success)setMessage(success);reload();}catch(e){setError(e.message);}finally{setBusy(false);}}

  async function logout() { if(user?.access) await action(async()=>{await api('/auth/logout/',{method:'POST',body:{refresh:user.refresh}});clearSession();navigate('/Extra%20Pages/auth-signin-basic.html');}); else navigate('/Extra%20Pages/auth-signin-basic.html'); }

  async function authSubmit(event) {event.preventDefault(); const f=event.currentTarget; const field=id=>f.querySelector(`#${id}`)?.value || ''; await action(async()=>{if(file.includes('signin')) {const result=await api('/auth/seller/login/',{method:'POST',body:{email:field('username'),password:field('password-input')}});saveSession(result);navigate('/');} else if(file.includes('signup')) {await api('/auth/seller/register/',{method:'POST',body:{email:field('useremail'),password:field('password-input'),owner_full_name:field('username')}});setMessage('Seller account created. You can now sign in.');} else if(file.includes('pass-reset')) {await api('/auth/forgot-password/',{method:'POST',body:{email:field('email')}});setMessage('Password reset instructions requested. Check your email.');} else {const q=new URLSearchParams(location.search); if(field('password-input')!==field('confirm-password-input')) throw Error('Passwords must match.'); await api('/auth/reset-password/',{method:'POST',body:{uid:q.get('uid'),token:q.get('token'),new_password:field('password-input')}});setMessage('Password updated. You can now sign in.');}});}

  async function productSubmit(event) {event.preventDefault();const f=event.currentTarget;const value=id=>f.querySelector(`#${id}`)?.value || '';await action(async()=>{const body=new FormData();body.append('name',value('product-title-input'));body.append('description',value('ckeditor-classic'));body.append('category',value('choices-category-input'));body.append('variants',JSON.stringify([{size:value('manufacturer-name-input'),color:value('manufacturer-brand-input'),price:Number(value('product-price-input')),stock:Number(value('stocks-input'))}]));f.querySelectorAll('input[type=file]').forEach(input=>Array.from(input.files).forEach(file=>{if(file.size>2*1024*1024)throw Error('Each image must be at most 2 MB.');body.append('variant_0_images',file);}));await api('/seller/catalog/single/',{method:'POST',body});f.reset();},'Product submitted for review.');}

  function navigateLink(event, href) { if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(href); }

  const selectedId=new URLSearchParams(location.search).get('id');

  const selectedOrder=rows(data.orders).find(o=>String(o.id)===selectedId);

  const showTool=name=>setTool(name);

  const options={replace(node){

    if(node.type==='script') return node.children?.some(c=>c.data?.includes('getFullYear')) ? <>{new Date().getFullYear()}</> : <></>;

    if(node.type!=='tag')return;

    const a=node.attribs || {};

    for(const key of Object.keys(a)) if(/^on/i.test(key) || !/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(key)) delete a[key];

    if(node.name==='option') delete a.selected;

    const id=a.id, content=text(node).trim(), inMain=ancestor(node,n=>hasClass(n,'page-content'));

    const children=()=>domToReact(node.children || [],options);

    const render=(extra={},newChildren=children())=>React.createElement(node.name,{...attributesToProps(a),...extra},...(['input','img','br','hr','meta','link'].includes(node.name)?[]:[newChildren]));

    if(id==='preloader')return <></>;

    if(id==='back-to-top')return render({onClick:()=>window.scrollTo({top:0,behavior:'smooth'})});

    if(id==='topnav-hamburger-icon')return render({onClick:()=>{ if(window.innerWidth<1025)document.body.classList.toggle('vertical-sidebar-enable');else document.documentElement.setAttribute('data-sidebar-size',document.documentElement.getAttribute('data-sidebar-size')==='sm'?'lg':'sm'); }});

    if(hasClass(node,'vertical-overlay'))return render({onClick:()=>document.body.classList.remove('vertical-sidebar-enable')});

    if(id==='password-addon')return render({onClick:()=>setPasswordVisible(!passwordVisible)});

    if(a.type==='password')return render({type:passwordVisible?'text':'password',required:true});

    if(id==='username' && isAuth && file.includes('signin'))return render({type:'email',required:true});

    if(node.name==='form' && isAuth)return render({action:undefined,noValidate:false,onSubmit:authSubmit},<><Status error={error} message={message} busy={busy}/>{children()}</>);

    if(node.name==='button' && isAuth && a.type==='submit')return render({disabled:busy});

    if(node.name==='button' && isAuth && !a.id && a.type==='button')return render({disabled:true,title:'Social sign-in is not provided by the backend.'});

    if(id==='live-product-detail')return <ProductDetail product={data.product}/>;
    if(node.name==='a') {
      if(['#profile','#bank','#bulk','#earnings'].includes(a.href))return render({onClick:e=>{e.preventDefault();showTool(a.href.slice(1));}});

      if(file==='apps-ecommerce-order-details.html' && inMain && /Invoice/.test(content))return render({href:'#',onClick:e=>{e.preventDefault();if(selectedOrder)action(()=>download(`/seller/orders/${selectedOrder.id}/invoice/`,`invoice-${selectedOrder.id}.pdf`));}});

      if(/log\s?out/i.test(content))return render({href:'#',onClick:e=>{e.preventDefault();logout();}});

      if(/pages-profile(?:-settings)?\.html/.test(a.href || ''))return render({href:'#',onClick:e=>{e.preventDefault();showTool('profile');}});

      if(content==='Dashboards' && a.href==='#sidebarDashboards')return render({href:'/index.html',onClick:e=>navigateLink(e,'/index.html')});

      const sidebar=ancestor(node,n=>hasClass(n,'navbar-menu'));

      if(sidebar && a.href==='#') {

        const map={'Inventory':'/apps-ecommerce-products.html','Catalog Uploas':'/apps-ecommerce-add-product.html','Business Dashbaord':'/index.html','Saller Insight':'/index.html','Payment':'earnings'};

        if(map[content])return render({href:map[content],onClick:e=>{e.preventDefault();map[content]==='earnings'?showTool('earnings'):navigate(map[content]);}});

        if(/bank|kyc/i.test(content))return render({href:'#',onClick:e=>{e.preventDefault();showTool('bank');}});

      }

      if(a.href && /\.html(?:[?#]|$)/.test(a.href) && !/^https?:/.test(a.href)) {let href=a.href.replace(/^(\.\.\/)+/,'');if(href.startsWith('auth-') || (file.startsWith('Extra Pages/') && templates[`../default/Extra Pages/${href}`]))href=`Extra Pages/${href}`;return render({href:`/${href}`,onClick:e=>navigateLink(e,`/${href}`)});}

      if(/^javascript:/i.test(a.href || ''))return render({href:'#',onClick:e=>e.preventDefault()});

    }

    if(hasClass(node,'container-fluid') && hasClass(node.parent,'page-content'))return render({},<><Status error={error} message={message} busy={busy}/>{!user?.access && <div className="alert alert-info">Sign in to load your store data. <a href="/Extra%20Pages/auth-signin-basic.html" onClick={e=>navigateLink(e,'/Extra%20Pages/auth-signin-basic.html')}>Seller sign in</a></div>}{children()}</>);

    if(file==='index.html' && inMain){

      if(node.name==='h4' && content.startsWith('Good Morning'))return render({},`Good Morning, ${data.profile?.store_name || 'PR Enterprises'}!`);

      if(node.name==='span' && ancestor(node,n=>hasClass(n,'card-animate'))){const card=ancestor(node,n=>hasClass(n,'card-animate'));const c=text(card);const d=data.dashboard;const val=c.includes('Pending Orders')?d?.pending_orders:c.includes('Out Of Stocks')?d?.inventory?.out_of_stock:c.includes('Low Stocks')?d?.inventory?.low_stock:undefined;if(node.parent?.name==='h4')return render({},val??'—');}

      if(node.name==='a' && a.href==='#' && ancestor(node,n=>hasClass(n,'card-animate'))){const c=text(ancestor(node,n=>hasClass(n,'card-animate')));return render({onClick:e=>{e.preventDefault(); if(c.includes('Downlaod Labels'))setError('Shipping label downloads are not available in the supplied API.');else navigate(c.includes('Stocks')?'/apps-ecommerce-products.html':'/orders.html');}});}

      if(node.name==='h5' && node.children?.some(n=>hasClass(n,'counter-value'))){const c=text(node.parent);const d=data.dashboard,an=data.analytics;return render({},c.includes('Orders')?d?.total_orders??'—':c.includes('Earnings')?d?money(d.earnings?.net_paid_sales):'—':c.includes('Refunds')?d?money(d.earnings?.processed_refunds):'—':an?`${an.conversion_rate}%`:'—');}

      if(node.name==='button' && ['ALL','1M','6M','1Y'].includes(content))return render({onClick:()=>{if(content==='1M')setPeriod('last_30_days');else {const end=new Date();const start=new Date(end);start.setDate(start.getDate()-(content==='6M'?179:365));const iso=d=>d.toLocaleDateString('en-CA');setPeriod(`custom&start_date=${iso(start)}&end_date=${iso(end)}`);}}});

      if(id==='customer_impression_charts')return <RevenueChart trends={data.analytics?.trends || []}/>;

    }

    if(file==='orders.html' && inMain){

      if(node.name==='a' && a['data-bs-toggle']==='tab' && ['#pending','#shipped','#delivered'].includes(a.href))return render({onClick:()=>{setOrderTab(a.href.slice(1));setPage(1);},className:(a.class || '').replace(/\bactive\b/g,'')+(orderTab===a.href.slice(1)?' active':'')},<>{content.replace(/\d+/g,'').trim()} {['pending','shipped','delivered'].includes(a.href.slice(1)) && orderTab===a.href.slice(1)?<span className="badge bg-danger-subtle text-danger rounded-pill ms-1">{data.orders?.count??rows(data.orders).length}</span>:null}</>);

      if(hasClass(node,'tab-pane') && ['pending','shipped','delivered'].includes(id))return render({className:`tab-pane${orderTab===id?' active':''}`},<>{['onhold','cancelled','readytoship'].includes(id)?<p className="text-muted p-3">This fulfillment state is not available in the supplied backend. Use Pending or Shipped to manage orders.</p>:<>{children()}<Pagination data={data.orders} page={page} setPage={setPage}/></>}</>);

      if(node.name==='tbody')return <OrderRows page={page} orders={rows(data.orders).filter(o=>!search || JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))} action={action} navigate={navigate} busy={busy}/>;

      if(node.name==='input' && hasClass(node,'search'))return render({value:search,onChange:e=>setSearch(e.target.value)});

      if(node.name==='form')return render({onSubmit:e=>e.preventDefault()});

    }

    if(file==='apps-ecommerce-products.html' && inMain){

      if(id==='table-product-list-all' || id==='table-product-list-published')return <InventoryTable data={data.inventory} action={action} page={page} setPage={setPage} busy={busy} search={search}/>;

      if(node.name==='input' && (a.type==='search'||a.placeholder?.includes('Search')))return render({value:search,onChange:e=>setSearch(e.target.value)});

      if(node.name==='span' && hasClass(node,'badge'))return render({},'');

      if(node.name==='button' && content==='Remove')return render({disabled:true,title:'Product deletion is not exposed by the backend.'});

    }

    if(file==='apps-ecommerce-add-product.html' && inMain){

      if(id==='createproduct-form')return render({onSubmit:productSubmit,noValidate:false});

      if(id==='ckeditor-classic')return <textarea className="form-control" id={id} required rows={8} aria-label="Product description"/>;

      if(id==='choices-category-input') {const categories=rows(data.categories);const parent=categories.find(c=>String(c.id)===categoryParent);const subcategories=parent?.children || parent?.subcategories || [];return <><label className="form-label" htmlFor="category-parent-input">Category</label><select id="category-parent-input" className="form-select mb-3" required value={categoryParent} onChange={e=>setCategoryParent(e.target.value)}><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="form-label" htmlFor={id}>Sub-category</label><select id={id} key={categoryParent} className="form-select" required disabled={!parent}><option value="">Choose sub-category</option>{subcategories.length ? categoryRows(subcategories).map(c=><option key={c.id} value={c.id}>{c.name}</option>):parent && <option value={parent.id}>{parent.name} (General)</option>}</select></>;}

      if(node.name==='label' && a.for==='manufacturer-name-input')return render({},'Size');

      if(node.name==='label' && a.for==='manufacturer-brand-input')return render({},'Color');

      if(['manufacturer-name-input','manufacturer-brand-input'].includes(id))return render({placeholder:id.includes('name')?'Enter variant size':'Enter variant color',required:true});

      if(['stocks-input','product-price-input'].includes(id))return render({type:'number',min:id==='stocks-input'?0:0.01,step:id==='stocks-input'?1:0.01});

      if(id==='product-price-addon')return render({},'₹');

      if(node.name==='button' && a.type==='submit')return render({disabled:busy || !user?.access});

      if(id==='dropzone-preview')return <></>;

      if(id==='choices-publish-status-input')return <select className="form-select" id={id} disabled><option>Pending review</option></select>;

      if(['choices-publish-visibility-input','datepicker-publish-input','product-discount-input','meta-title-input','meta-keywords-input','meta-description-input'].includes(id))return render({disabled:true,title:'This field is not supported by the current backend.'});

    }

    if(file==='apps-ecommerce-order-details.html' && inMain){

      if(node.name==='h5' && /^Order #/.test(content))return render({},selectedOrder?`Order #${selectedOrder.order_id}`:'Select an order');

      if(hasClass(node,'card') && /Customer Details|Billing Address|Shipping Address|Payment Details/.test(content)){const title=/Customer Details/.test(content)?'Customer Details':/Billing Address/.test(content)?'Billing Address':/Shipping Address/.test(content)?'Shipping Address':'Payment Details';return render({},<><div className="card-header"><h5 className="card-title mb-0">{title}</h5></div><div className="card-body">{selectedOrder ? title==='Customer Details'?<><h6>{selectedOrder.customer.name}</h6><p>{selectedOrder.customer.email}</p><p>{selectedOrder.customer.phone}</p></>:title.includes('Address')?<p>{Object.values(selectedOrder.customer.address).filter(Boolean).join(', ')}</p>:<><p>{selectedOrder.payment_status}</p><p>{money(selectedOrder.total_amount)}</p></>:<p>—</p>}</div></>);}

      if(hasClass(node,'card') && /Order Status/.test(content))return render({},<><div className="card-header"><h5 className="card-title mb-0">Order Status</h5></div><div className="card-body">{selectedOrder?.status || '—'}</div></>);

      if(node.name==='tbody')return <tbody>{selectedOrder?.items?.map((item,i)=><tr key={i}><td>{item.product_name}<p className="text-muted mb-0">{item.color} / {item.size}</p></td><td>{money(item.price)}</td><td>{item.quantity}</td><td>—</td><td className="text-end">{money(item.price*item.quantity)}</td></tr>) || <tr><td colSpan={4}>Select an order from the orders page to view live details.</td></tr>}</tbody>;

    }

    if(file==='apps-ecommerce-product-details.html' && inMain){

      const p=data.product;

      if(node.name==='h4' && content.includes('Full Sleeve'))return render({},p?.name || '—');

      if(node.name==='h5' && node.parent && /Price :|Available Stocks :|No. of Orders :|Total Revenue :/.test(text(node.parent))){const c=text(node.parent);return render({},!p?'—':c.includes('Price')?money(Math.min(...p.variants.map(v=>Number(v.price)))):c.includes('Stocks')?p.variants.reduce((n,v)=>n+v.stock,0):'—');}

      if(node.name==='div' && hasClass(node,'swiper-wrapper'))return render({},p?.variants.flatMap(v=>v.images || []).map(im=><div className="swiper-slide" key={im.id}><img src={im.image} className="img-fluid d-block" alt={p.name}/></div>) || []);

      if(node.name==='div' && /^(Description|Reviews)/.test(a.id || ''))return render({},p?.description || '—');

      if(node.name==='div' && hasClass(node,'text-muted') && /5.50k Customer Review|Seller :|Published :/.test(content))return render({},'—');

      if(node.name==='a' && a.title==='Edit')return render({href:'#',onClick:e=>{e.preventDefault();setError('Product editing is not available in the supplied API.');}});

    }

    if(file==='apps-ecommerce-seller-details.html' && inMain && node.name==='h5' && hasClass(node,'fs-16'))return render({},data.profile?.store_name || '—');

  }};

  useEffect(()=>{if(!html)return;const source=new DOMParser().parseFromString(html,'text/html');document.title=source.title; const links=[];source.head.querySelectorAll('link[rel=stylesheet]').forEach(link=>{let href=link.getAttribute('href');if(href?.includes('assets/'))href='/'+href.split('assets/')[1];if(href && !Array.from(document.querySelectorAll('link[rel=stylesheet]')).some(el=>el.getAttribute('href')===href)){const el=document.createElement('link');el.rel='stylesheet';el.href=href;document.head.append(el);links.push(el);}});return()=>links.forEach(el=>el.remove());},[html]);

  const body=useMemo(()=>html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.replace(/(?:\.\.\/)?assets\//g,'/') || '',[html]);

  return <>{body?parse(body,options):<div className="p-4"><Status error={error} busy={!error}/>{error && <a href="/" onClick={e=>navigateLink(e,'/')}>Back to dashboard</a>}</div>}{tool && <AccountTools name={tool} close={()=>setTool('')} change={setTool}/>}</>;

}

function categoryRows(list,prefix=''){return list.flatMap(c=>[{...c,name:prefix+c.name},...categoryRows(c.children || c.subcategories || [],prefix+'— ')]);}

function Pagination({data,page,setPage}){return <div className="d-flex justify-content-end align-items-center gap-3 p-3"><button className="btn btn-light btn-sm" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page}</span><button className="btn btn-light btn-sm" disabled={!data?.next} onClick={()=>setPage(page+1)}>Next</button></div>;}

function OrderRows({orders,action,navigate,busy,page}){return <tbody className="align-top">{orders.length?orders.map(o=><tr key={o.id}><td>{o.items?.map(i=>i.product_name).join(', ')}<small className="d-block">Order ID: {o.order_id}</small></td><td><a href={`/apps-ecommerce-order-details.html?id=${o.id}`} onClick={e=>{e.preventDefault();navigate(`/apps-ecommerce-order-details.html?id=${o.id}&page=${page}`);}}>{o.id}</a></td><td>{o.items?.map(i=>i.variant_id).join(', ')}</td><td>—</td><td>{o.items?.reduce((n,i)=>n+i.quantity,0)}</td><td>{o.items?.map(i=>i.size).join(', ')}</td><td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td><td><select className="form-select form-select-sm mb-2" aria-label={`Status for order ${o.id}`} value={o.status} disabled={busy} onChange={e=>action(()=>api(`/seller/orders/update/${o.id}/`,{method:'PATCH',body:{status:e.target.value}}),'Order status updated.')}>{['pending','shipped','delivered'].map(s=><option key={s}>{s}</option>)}</select><button className="btn btn-outline-primary btn-sm" onClick={()=>action(()=>download(`/seller/orders/${o.id}/invoice/`,`invoice-${o.id}.pdf`))}>Invoice</button></td></tr>):<tr><td colSpan={7} className="text-center p-4">No orders found.</td></tr>}</tbody>;}

function InventoryTable({data,action,page,setPage,busy,search}){const list=rows(data).filter(v=>!search || v.product_name.toLowerCase().includes(search.toLowerCase()));return <><div className="table-responsive"><table className="table table-nowrap align-middle"><thead className="table-light"><tr><th>Product</th><th>Size / Color</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead><tbody>{list.map(v=><tr key={v.id}><td>{v.product_name}<small className="d-block text-muted">#{v.id}</small></td><td>{v.size} / {v.color}</td><td>{money(v.price)}</td><td><form className="d-flex gap-2" onSubmit={e=>{e.preventDefault();const stock=Number(new FormData(e.currentTarget).get('stock'));action(()=>api(`/seller/inventory/${v.id}/`,{method:'PATCH',body:{stock}}),'Stock updated.');}}><input className="form-control form-control-sm" aria-label={`Stock for ${v.id}`} key={`${v.id}-${v.stock}`} name="stock" type="number" min={0} step={1} required defaultValue={v.stock} style={{width:85}}/><button className="btn btn-success btn-sm" disabled={busy}>Save</button></form></td><td><a href={`/apps-ecommerce-product-details.html?id=${v.product_id}`}>View</a></td></tr>)}{!list.length&&<tr><td colSpan={5} className="text-center p-4">No products found.</td></tr>}</tbody></table></div><Pagination data={data} page={page} setPage={setPage}/></>;}

function RevenueChart({trends}){useEffect(()=>{if(!window.ApexCharts || !trends.length)return;const chart=new window.ApexCharts(document.getElementById('customer_impression_charts'),{chart:{height:370,type:'line',toolbar:{show:false}},colors:['#405189','#0ab39c','#f06548'],series:[{name:'Orders',data:trends.map(t=>t.orders)},{name:'Earnings (INR)',data:trends.map(t=>t.sales)},{name:'Clicks',data:trends.map(t=>t.clicks)}],xaxis:{categories:trends.map(t=>t.date)},stroke:{width:2,curve:'smooth'},dataLabels:{enabled:false}});chart.render();return()=>chart.destroy();},[trends]);return <div id="customer_impression_charts" className="apex-charts" dir="ltr" style={{minHeight:370}}/>;}


function ProductDetail({product}) { if(!product)return <div className="card card-body">Product not found.</div>;return <div className="card"><div className="card-body"><div className="row gx-lg-5"><div className="col-xl-4">{product.variants.flatMap(v=>v.images || []).map(im=><img className="img-fluid mb-3 rounded" key={im.id} src={im.image} alt={product.name}/>)}</div><div className="col-xl-8"><h4>{product.name}</h4><p className="text-muted mt-3">{product.description}</p><div className="table-responsive"><table className="table align-middle"><thead className="table-light"><tr><th>Size</th><th>Color</th><th>Price</th><th>Stock</th></tr></thead><tbody>{product.variants.map(v=><tr key={v.id}><td>{v.size}</td><td>{v.color}</td><td>{money(v.price)}</td><td>{v.stock}</td></tr>)}</tbody></table></div><p className="text-muted">Return policy: {product.return_policy==='no_return'?'No returns':`${product.return_days} days`}</p></div></div></div></div>; }
