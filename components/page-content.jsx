import dynamic from 'next/dynamic';
import {Suspense} from 'react';
import Template from './template';
import TemplateInteractions from './template-interactions';
import {HomeProducts} from './home-products';
const Catalog=dynamic(()=>import('./catalog'));
const Product=dynamic(()=>import('./product'));
const Cart=dynamic(()=>import('./cart'));
const Account=dynamic(()=>import('./account'));
const Orders=dynamic(()=>import('./account').then(m=>m.Orders));
const Wishlist=dynamic(()=>import('./wishlist'));
const Checkout=dynamic(()=>import('./checkout'));
const ThankYou=dynamic(()=>import('./checkout').then(m=>m.ThankYou));
const Auth=dynamic(()=>import('./auth'));
const Seller=dynamic(()=>import('./seller'));
const Categories=dynamic(()=>import('./catalog').then(m=>m.Categories));
export default function PageContent({page}){
  let content;
  switch(page.kind){
    case 'home':content=<HomeProducts><TemplateInteractions><Template nodes={page.nodes}/></TemplateInteractions></HomeProducts>;break;
    case 'catalog':content=<Catalog/>;break;
    case 'product':content=<Product/>;break;
    case 'cart':content=<Cart/>;break;
    case 'account':content=<Account/>;break;
    case 'orders':content=<Orders/>;break;
    case 'wishlist':content=<Wishlist/>;break;
    case 'checkout':content=<Checkout/>;break;
    case 'thankyou':content=<ThankYou/>;break;
    case 'auth':content=<Auth mode={page.mode} seller={page.seller}/>;break;
    case 'reset':content=<Auth mode="reset"/>;break;
    case 'seller':content=<Seller/>;break;
    case 'categories':content=<Categories/>;break;
    default:content=<TemplateInteractions><link rel="stylesheet" href="/full-template.css"/><Template nodes={page.nodes}/></TemplateInteractions>;
  }
  return <Suspense fallback={<div className="next-state" role="status">Loading…</div>}>{content}</Suspense>;
}
