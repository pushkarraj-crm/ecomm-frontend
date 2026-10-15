import test from 'node:test';
import assert from 'node:assert/strict';
import {productUrl,parseProductPath} from '../lib/product-url.mjs';
test('uses the backend slug and stable ID in an Amazon-style product path',()=>{
  assert.equal(productUrl({id:5,slug:'demo-desk-lamp',name:'Different display name'}),'/demo-desk-lamp/dp/5/');
  assert.deepEqual(parseProductPath('/demo-desk-lamp/dp/5/'),{slug:'demo-desk-lamp',id:'5'});
});
test('same-named products have distinct URLs and invalid IDs cannot generate links',()=>{
  assert.notEqual(productUrl({id:1,slug:'lamp'}),productUrl({id:2,slug:'lamp'}));
  assert.throws(()=>productUrl({id:'../5',slug:'lamp'}));
  assert.equal(parseProductPath('/lamp/dp/nope/'),null);
  assert.equal(parseProductPath('/product-single-default/'),null);
});


test('products added after deployment resolve without build-time catalog enumeration', async () => {
  const {getTemplate} = await import('../lib/templates.mjs');
  const page = await getTemplate('new-product/dp/987654');
  assert.equal(page.kind, 'product');
  assert.equal(page.productId, '987654');
  assert.equal(page.productSlug, 'new-product');
  assert.equal(await getTemplate('removed-demo-page'), null);
});
