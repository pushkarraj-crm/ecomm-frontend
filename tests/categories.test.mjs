import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryPath,orderedCategories,matchesCategory} from '../lib/categories.mjs';
const roots=[{id:8,name:'Custom category',children:[]},{id:2,name:'Sports',children:[]},{id:1,name:'Women Wear',children:[{id:3,name:'Ethnic Wear',children:[{id:4,name:'Kurta Set',children:[]}]}]}];
test('category browsing resolves complete breadcrumb paths and unknown IDs safely',()=>{assert.deepEqual(categoryPath(roots,'4').map(c=>c.id),[1,3,4]);assert.deepEqual(categoryPath(roots,'404'),[]);});
test('category search includes parents when a nested product category matches',()=>{assert.equal(matchesCategory(roots[2],' KURTA '),true);assert.equal(matchesCategory(roots[2],'sports'),false);assert.equal(matchesCategory(roots[2],''),true);});
test('category ordering retains existing custom categories without mutating API data',()=>{assert.deepEqual(orderedCategories(roots).map(c=>c.id),[1,2,8]);assert.deepEqual(roots.map(c=>c.id),[8,2,1]);});
