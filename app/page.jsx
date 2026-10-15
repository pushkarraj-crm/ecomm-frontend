import PageContent from '@/components/page-content';
import {getTemplate} from '@/lib/templates.mjs';
export default async function Home(){return <PageContent page={await getTemplate('')}/>;}
