export const categoryOrder=['Women Wear','Mens Wear','Kids & Toys','Beauty & Care','Accessories','Home & Kitchen','Diwali','Stationery & Office','Bags','Footwear','Pet World','Health & Care','Sports'];
const ranks=new Map(categoryOrder.map((name,index)=>[name.toLowerCase(),index]));
export function orderedCategories(categories){return [...categories].sort((a,b)=>(ranks.get(a.name.toLowerCase())??999)-(ranks.get(b.name.toLowerCase())??999)||a.name.localeCompare(b.name));}
export function categoryPath(categories,id,parents=[]){for(const category of categories){const path=[...parents,category];if(String(category.id)===String(id))return path;const found=categoryPath(category.children||[],id,path);if(found.length)return found;}return [];}
export function matchesCategory(category,term){const needle=term.trim().toLowerCase();return !needle||category.name.toLowerCase().includes(needle)||(category.children||[]).some(child=>matchesCategory(child,needle));}
export function categoryIllustration(name){
 const n=name.toLowerCase();
 if(/women|mens|fashion|wear/.test(n)&&!n.includes('foot'))return 'shirt';
 if(/beauty|health/.test(n))return 'beauty';
 if(/kid|toy/.test(n))return 'toys';
 if(/kitchen|home|decor/.test(n))return 'home';
 if(/diwali|light/.test(n))return 'diwali';
 if(/stationery|office|book/.test(n))return 'books';
 if(/bag/.test(n))return 'bag';
 if(/foot|shoe/.test(n))return 'shoe';
 if(/pet/.test(n))return 'pet';
 if(/sport/.test(n))return 'sports';
 return 'accessories';
}
export function categorySuggestions(categories,term,limit=6){
 const needle=term.trim().toLowerCase();if(needle.length<2)return [];
 const matches=[];
 function visit(nodes,parents=[]){for(const category of nodes){const name=category.name.toLowerCase();if(name.includes(needle))matches.push({...category,breadcrumb:parents.map(parent=>parent.name).join(' / '),rank:name===needle?0:name.startsWith(needle)?1:2});visit(category.children||[],[...parents,category]);}}
 visit(categories);
 return matches.sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name)||a.breadcrumb.localeCompare(b.breadcrumb)).slice(0,limit);
}
