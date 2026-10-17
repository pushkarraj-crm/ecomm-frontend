import {Suspense} from 'react';
import CategoryDirectory from '@/components/category-directory';
export const metadata={title:'All Categories',description:'Browse fashion, beauty, home, bags, footwear, sports and more at Unimart.'};
export default function CategoriesPage(){return <Suspense fallback={<div className="next-state" role="status">Loading categories…</div>}><CategoryDirectory/></Suspense>;}
