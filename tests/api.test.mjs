import test from 'node:test';
import assert from 'node:assert/strict';
import {request,keys,saveSession,readSession,clearSession,itemsOf,catalogQuery,lowestPrice,media,quantityValue,safeNext,validAddress} from '../lib/api.mjs';
const storage=new Map();
globalThis.window={dispatchEvent(){}};
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
test('catalog accepts both response shapes and uses documented search/sort pagination',()=>{
  assert.deepEqual(itemsOf([{id:1}]),[{id:1}]);assert.deepEqual(itemsOf({count:1,results:[{id:1}]}),[{id:1}]);
  const p=new URLSearchParams(catalogQuery({search:' blue shirt ',sort:'invalid',page:-2,pageSize:1000}));
  assert.equal(p.get('search'),'blue shirt');assert.equal(p.get('sort'),'newest');assert.equal(p.get('page'),'1');assert.equal(p.get('page_size'),'100');
  assert.equal(lowestPrice({variants:[{price:100,stock:0},{price:300,stock:2}]}),300);
});
test('validated quantities, addresses, media URLs, and return URLs',()=>{
  for(const value of [0,-1,1.5,'oops',4])assert.throws(()=>quantityValue(value,3));assert.equal(quantityValue(2,3),2);
  assert.equal(media('javascript:alert(1)'),'');assert.ok(media('/media/photo.webp').endsWith('/media/photo.webp'));
  assert.equal(safeNext('//evil.test'),'/account-info/');assert.equal(safeNext('/cart/'),'/cart/');assert.equal(safeNext('/\\evil.test'),'/account-info/');
  assert.ok(validAddress({address_line_1:'Road',city:'City',state:'State',postal_code:'123456'}));assert.equal(validAddress({address:'legacy'}),false);
});
test('customer and seller sessions are role checked',()=>{
  assert.throws(()=>saveSession({access:'a',refresh:'r',is_seller:true},'customer@example.test',false));
  saveSession({access:'a',refresh:'r',is_seller:false},'customer@example.test');assert.equal(readSession().seller,false);clearSession();assert.equal(readSession(),null);
});
test('requests send documented JSON and tokens only to protected endpoints',async()=>{
  storage.set(keys.access,'test-access');let call;
  globalThis.fetch=async(url,options)=>{call={url,options};return new Response('{}',{status:200});};
  await request('/customer/cart/add/',{method:'POST',body:{variant_id:7,quantity:2}});
  assert.deepEqual(JSON.parse(call.options.body),{variant_id:7,quantity:2});assert.equal(call.options.headers.get('Authorization'),'Bearer test-access');
  await request('/products/',{public:true});assert.equal(call.options.headers.has('Authorization'),false);
  await assert.rejects(()=>request('//evil.test'),/Invalid API path/);
});
test('expired sessions, validation errors, and outage responses are actionable',async()=>{
  storage.set(keys.access,'test-access');globalThis.fetch=async()=>new Response('{"detail":"expired"}',{status:401});await assert.rejects(request('/cart/'),/sign in again/);assert.equal(readSession(),null);
  globalThis.fetch=async()=>new Response('{"quantity":["Insufficient stock."]}',{status:400});await assert.rejects(request('/cart/update/1/',{method:'PATCH',body:{quantity:100}}),/Insufficient stock/);
  globalThis.fetch=async()=>new Response('{}',{status:429});await assert.rejects(request('/products/'),/Too many requests/);
  globalThis.fetch=async()=>new Response('<html>proxy error</html>',{status:502});await assert.rejects(request('/products/'),/unexpected response/);
});
