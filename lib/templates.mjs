import { parseProductPath } from './product-url.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
export async function routes(){return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated/routes.json'),'utf8'));}
export async function getTemplate(slug=''){const productPath=parseProductPath(slug);if(productPath){const template=await getTemplate('product-single-default');return {...template,productId:productPath.id,productSlug:productPath.slug};}const row=(await routes()).find(item=>item.slug===slug);if(!row)return null;return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated',row.file),'utf8'));}
export async function getFooter(){return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated/footer.json'),'utf8'));}
