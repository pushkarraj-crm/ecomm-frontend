import fs from 'node:fs/promises';
import path from 'node:path';
export async function routes(){return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated/routes.json'),'utf8'));}
export async function getTemplate(slug=''){const row=(await routes()).find(item=>item.slug===slug);if(!row)return null;return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated',row.file),'utf8'));}
export async function getFooter(){return JSON.parse(await fs.readFile(path.join(process.cwd(),'generated/footer.json'),'utf8'));}
