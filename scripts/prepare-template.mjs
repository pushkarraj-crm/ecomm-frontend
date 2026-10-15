import fs from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
import {PurgeCSS} from 'purgecss';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {rootPages,informationPages,legacyAliases} from '../lib/site-pages.mjs';
const project=process.cwd(), source=path.resolve(project,'..'), generated=path.join(project,'generated'), publicDir=path.join(project,'public');
const scriptProject=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(project!==scriptProject)throw new Error('Run template preparation from the next-storefront directory.');
// These paths contain only rebuildable output. Verify each target before removing it.
for(const relative of ['generated','public/assets','out']){
  const target=path.resolve(project,relative);
  if(!target.startsWith(project+path.sep)||target===project)throw new Error('Invalid build output path.');
  await fs.rm(target,{recursive:true,force:true});
}
await fs.mkdir(generated,{recursive:true});await fs.mkdir(publicDir,{recursive:true});
const rootFiles=rootPages.map(name=>name+'.html');
const extraFiles=informationPages.map(name=>name+'.html');
const routes=new Map(rootFiles.map(n=>[n,n==='index.html'?'/':'/'+n.slice(0,-5)+'/']));
for(const name of extraFiles)routes.set(name,'/'+name.slice(0,-5)+'/');
for(const [name,target]of Object.entries(legacyAliases))routes.set(name+'.html','/'+target+'/');
const assetPaths=new Set(), imagePaths=new Set();let homeIndex=0;
function assetUrl(value){if(!value)return value;const normalized=value.replace(/^(\.\.\/)+/,'').replace(/^\.\//,'');if(normalized.startsWith('assets/')){let decoded;try{decoded=path.posix.normalize(decodeURIComponent(normalized));}catch{return '';}if(!decoded.startsWith('assets/'))return '';assetPaths.add(decoded);return '/'+normalized;}return value;}
function href(value){if(!value)return '#';if(/^(https?:|mailto:|tel:|#)/i.test(value))return value;const [file,tail='']=value.split(/(?=[?#])/);const name=file.split('/').pop();return routes.has(name)?routes.get(name)+tail:name?.endsWith('.html')?'/shop/':value;}
const attrMap={class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',maxlength:'maxLength',colspan:'colSpan',rowspan:'rowSpan',viewbox:'viewBox',fillrule:'fillRule',cliprule:'clipRule',strokewidth:'strokeWidth',strokelinecap:'strokeLinecap',strokelinejoin:'strokeLinejoin',crossorigin:'crossOrigin',autoplay:'autoPlay',playsinline:'playsInline',frameborder:'frameBorder',allowfullscreen:'allowFullScreen',srcset:'srcSet',contenteditable:'contentEditable',datetime:'dateTime'};
const boolAttrs=new Set(['disabled','required','multiple','readOnly','autoPlay','muted','loop','controls','hidden','open','allowFullScreen']);
function style(value){const result={};for(const part of value.split(';')){const i=part.indexOf(':');if(i<0)continue;const key=part.slice(0,i).trim(),v=part.slice(i+1).trim();if(!key||!v)continue;result[key.startsWith('--')?key:key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v.replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(_,url)=>`url(${assetUrl(url)})`);}return result;}
function convert(node,home=false){
  if(node.type==='text'){const text=node.data.replace(/\s+/g,' ');return text.trim()?text:null;}
  if(!node.name||['script','style','noscript','iframe'].includes(node.name))return null;
  const attrs=node.attribs||{},classes=(attrs.class||'').split(/\s+/);
  if(home&&classes.includes('rbt-product-card'))return {component:'HomeProduct',index:homeIndex++};
  if(classes.includes('swiper')){const wrapper=(node.children||[]).find(n=>n.attribs?.class?.split(/\s+/).includes('swiper-wrapper'));if(wrapper)return {component:'Carousel',props:{className:classes.filter(c=>c!=='swiper').join(' ')},children:(wrapper.children||[]).map(n=>convert(n,home)).filter(Boolean)};}
  if(classes.some(c=>/^swiper-(pagination|button)/.test(c))||classes.includes('rbt-swiper-arrow')||classes.includes('rbt-preloader'))return null;
  const props={};
  for(let[key,value]of Object.entries(attrs)){
    if(/^on/i.test(key)||key==='srcset'||key==='selected'||key==='data-cfemail')continue;
    key=attrMap[key]||key.replace(/^(stroke|fill|clip)-([a-z])/g,(_,a,b)=>a+b.toUpperCase());
    if(key==='className'){value=value.split(/\s+/).filter(c=>!['rbt-scroll-trigger','fade_in','zoom_in','rbt-select-activation'].includes(c)&&!c.startsWith('@@')).join(' ');}
    if(key==='style'){props.style=style(value);continue;}
    if(key==='href')value=href(value);
    if(['src','poster'].includes(key))value=assetUrl(value);
    if(key==='value'&&['input','textarea','select'].includes(node.name))key='defaultValue';
    if(key==='checked'){props.defaultChecked=true;continue;}
    props[key]=boolAttrs.has(key)?true:value;
  }
  if(node.name==='img'){props.loading='lazy';props.decoding='async';props.alt=props.alt||'';if(props.src?.startsWith('/assets/'))imagePaths.add(props.src.slice(1));}
  if(node.name==='a'&&props['data-bs-target']&&!['tab','pill','collapse'].includes(props['data-bs-toggle'])){
    const target=props['data-bs-target'];if(/signin|signup/i.test(target))props.href='/signin/';else if(/cart/i.test(target))props.href='/cart/';else if(/wish/i.test(target))props.href='/wishlist/';else props.href='/shop/';delete props['data-bs-target'];delete props['data-bs-toggle'];
  }
  if(node.name==='a'&&/javascript:/i.test(props.href||''))props.href='/shop/';
  if(home&&node.name==='a'){
    const label=(node.children||[]).filter(n=>n.type==='text').map(n=>n.data).join(' ').trim();
    if(attrs.href?.includes('shop-by-category.html'))props.href='/shop/?search='+encodeURIComponent(label);
    if(props.href==='#'&&!props['data-bs-toggle'])props.href=label==='New Arrivals'?'/shop/?sort=newest':'/shop/';
  }
  if(node.name==='form'){delete props.action;return {component:'Form',props,children:(node.children||[]).map(n=>convert(n,home)).filter(Boolean)};}
  return {tag:node.name,props,children:(node.children||[]).map(n=>convert(n,home)).filter(Boolean)};
}
function kindFor(name){if(name==='index')return 'home';if(['shop','all-products','products-even-list-shop','cart-builder','shop-by-brands','brand-list'].includes(name))return name==='cart-builder'?'cart':'catalog';if(name.startsWith('product-single')||name==='quick-view')return 'product';if(name==='cart')return 'cart';if(name==='account-info')return 'account';if(name==='my-order-history')return 'orders';if(name.includes('wishlist'))return 'wishlist';if(name==='checkout-thankyou')return 'thankyou';if(name.startsWith('checkout-'))return 'checkout';if(['categories-list','shop-by-categories'].includes(name))return 'categories';if(name==='seller-dashboard')return 'seller';if(/^(seller-)?(signin|signup)$/.test(name))return 'auth';if(name==='reset-password')return 'reset';if(['notifications','account-notifications','my-payment-methods','my-reviews'].includes(name))return 'unsupported';return 'template';}
const manifest=[];let originalHomeBytes=0, homeTreeBytes=0;
const skipped='header,footer,script,.modal,.rbt-preloader,.popup-mobile-menu,.rbt-offcanvas-cat-side-menu,.rbt-cart-side-menu,.rbt-special-offprds-side-menu,.rbt-comparison-message-area,.rbt-quickview-sidenav-area,.rbt-cookies,.rbt-newsletter-area,.rbt-toolbar,.rbt-toaster,.rbt-progress-parent,.close_side_menu,.common-close_search_dropdown,.rbt-minicart-bottom-section,.copyright-area';
let footer;
for(const [folder,files]of [['',rootFiles],['Extra Pages',extraFiles]]){
  for(const file of files){
    const name=file.slice(0,-5);if(folder&&rootFiles.includes(file))continue;
    const raw=await fs.readFile(path.join(source,folder,file),'utf8'),$=load(raw),kind=folder?'template':kindFor(name),slug=name==='index'?'':name;
    $('.rbt-blogs-area,.rbt-instapost-area').remove();
    if(kind==='home'){
      const removedLabels=new Set(['Cookie Settings','Sell Your Services on Unimart','Sell on Unimart Business','Sell Your Apps on Unimart','Become an Affilate','Advertise Your Products','Sell-Publish with Us','Unimart Affiliation Program','Careers for Unimart','Inverstor Relations','Unimart Devices','Customer reviews','Social Responsibility','Store Locations','Unimart Near Me','Unimart Dealership']);
      $('footer a').each((_,el)=>{const link=$(el),label=link.text().trim();if(removedLabels.has(label))link.closest('li').remove();else if(['Sell on Unimart','Become an Unimart Vendor'].includes(label))link.attr('href','seller-signup.html');});
    }
    const title=($('title').text()||name.replaceAll('-',' ')).replace(/\s*\|.*$/,'').replace('Platforn','Platform');
    let nodes=[];
    if(kind==='home'||kind==='template'){
      $('body').children().each((_,el)=>{const item=$(el);if(item.is(skipped)||item.is('.rbt-filter-offcanvas-area'))return;if(!['div','main','section','article'].includes(el.name))return;if(kind==='home'&&!item.hasClass('rbt-component-area')&&!item.hasClass('rbt-breadcrumb-two')&&!item.hasClass('rbt-breadcrumb-area')&&el.name!=='main')return;nodes.push(convert(el,kind==='home'));});
      if(!nodes.length)nodes=[{tag:'section',props:{className:'next-state'},children:[{tag:'h1',props:{className:'h3'},children:['Template unavailable']},{tag:'p',props:{},children:['The supplied source file contains a missing-page response rather than a template.']}]}];
    }
    if(kind==='home'){
      footer=convert($('footer').first()[0]);originalHomeBytes=Buffer.byteLength(raw);
      const firstHero=findFirstImage(nodes);if(firstHero){firstHero.props.loading='eager';firstHero.props.fetchPriority='high';}
      homeTreeBytes=Buffer.byteLength(JSON.stringify(nodes));
    }
    const record={slug,title,kind,name,seller:name.startsWith('seller-'),mode:name.endsWith('signup')?'register':'login',nodes};
    const filename=(slug||'home').replaceAll('/','__')+'.json';await fs.writeFile(path.join(generated,filename),JSON.stringify(record));manifest.push({slug,title,kind,file:filename});
  }
}
function findFirstImage(nodes){for(const node of nodes){if(node?.tag==='img')return node;if(node?.children){const found=findFirstImage(node.children);if(found)return found;}}}
await fs.writeFile(path.join(generated,'footer.json'),JSON.stringify(footer));
await fs.writeFile(path.join(generated,'routes.json'),JSON.stringify(manifest));
// Copy only referenced assets, plus CSS dependencies and the shared logo/favicon.
assetPaths.add('assets/images/logo/logo.webp');assetPaths.add('assets/images/favicon.png');
const cssInputs=['assets/css/vendor/bootstrap.min.css','assets/css/style.min.css','assets/css/plugins/fontawesome-all.min.css'];
for(const cssFile of cssInputs){const css=await fs.readFile(path.join(source,cssFile),'utf8');for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){if(/^(data:|https?:|\/\/)/.test(match[1]))continue;const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(cssFile),match[1].split(/[?#]/)[0]));if(resolved.startsWith('assets/'))assetPaths.add(resolved);}}
let copied=0;for(const asset of assetPaths){const input=path.join(source,asset),output=path.join(publicDir,asset);try{await fs.mkdir(path.dirname(output),{recursive:true});const stat=await fs.stat(input);let current;try{current=await fs.stat(output);}catch{}if(!current||current.size!==stat.size){await fs.copyFile(input,output);copied++;}}catch{/* Missing template assets are recorded below; they are not invented. */}}
const content=['generated/home.json','generated/footer.json','components/**/*.{jsx,js}','app/**/*.{jsx,css}'];
const purged=await new PurgeCSS().purge({content,css:cssInputs.map(p=>path.join(source,p)),safelist:{standard:[/^next-/,/^col-/,/^row/,/^swiper-/,/^tab-/,/^accordion/,/^active$/, /^show$/, /^collapse$/, /^container/, /^gap-/,/^d-/,/^mt--/,/^mb--/,/^h[1-6]$/],deep:[/^next-/]},fontFace:false,keyframes:true,variables:false});
// Keep the original design tokens and selectors while removing unrelated Bootstrap utilities.
function cssUrls(css,index){return css.replace(/url\(['\"]?([^)'\"\s]+)['\"]?\)/g,(all,url)=>{if(/^(data:|https?:|\/)/.test(url))return all;return 'url(/'+path.posix.normalize(path.posix.join(path.posix.dirname(cssInputs[index]),url))+')';});}
await fs.writeFile(path.join(publicDir,'template.css'),purged.slice(0,2).map((x,i)=>cssUrls(x.css,i)).join('\n'));
await fs.writeFile(path.join(publicDir,'full-template.css'),(await Promise.all(cssInputs.slice(0,2).map(async (file,index)=>cssUrls(await fs.readFile(path.join(source,file),'utf8'),index)))).join('\n'));
await fs.writeFile(path.join(publicDir,'icons.css'),cssUrls(purged[2].css,2));
const home=JSON.parse(await fs.readFile(path.join(generated,'home.json'),'utf8'));
const homeImages=[];function visit(nodes){for(const n of nodes){if(n?.tag==='img'&&n.props.src?.startsWith('/assets/')&&!n.props.src.endsWith('.svg'))homeImages.push(n);if(n?.children)visit(n.children);}}visit(home.nodes);
let savedBytes=0;for(const n of homeImages){const src=path.join(source,n.props.src.slice(1));try{const info=await sharp(src).metadata();n.props.width=info.width;n.props.height=info.height;if(info.width>1200||info.size>200000){const relative='assets/optimized/'+path.basename(src,path.extname(src))+'.webp';const target=path.join(publicDir,relative);await fs.mkdir(path.dirname(target),{recursive:true});await sharp(src).resize({width:1200,withoutEnlargement:true}).webp({quality:78}).toFile(target);n.props.src='/'+relative;savedBytes+=Math.max(0,(await fs.stat(src)).size-(await fs.stat(target)).size);}}catch{}}
await fs.writeFile(path.join(generated,'home.json'),JSON.stringify(home));
const report={routes:manifest.length,originalHomeBytes,homeTemplateTreeBytes:homeTreeBytes,removedLegacyScripts:true,copiedAssets:copied,optimizedHomeImageBytesSaved:savedBytes,cssBytes:Buffer.byteLength(purged.slice(0,2).map(x=>x.css).join('\n'))};
await fs.writeFile(path.join(project,'migration-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
