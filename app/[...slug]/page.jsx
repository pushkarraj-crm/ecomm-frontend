import { notFound, redirect } from 'next/navigation';
import { getTemplate, routes } from '@/lib/templates.mjs';
import PageContent from '@/components/page-content';
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await routes())
    .filter((row) => row.slug)
    .map((row) => ({ slug: row.slug.split('/') }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getTemplate(slug.join('/'));
  return {
    title: page?.title || 'Page not found',
    ...(/account|checkout|signin|signup|seller|wishlist|my-|notifications/.test(
      page?.slug || '',
    )
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
export default async function Page({ params }) {
  const { slug } = await params;
  const path = slug.join('/');
  const sellerRoutes = {
    'seller-signin': 'login',
    'seller-signup': 'signup',
    'seller-dashboard': '',
  };
  if (path in sellerRoutes)
    redirect('https://d2c-seller-dashboard.vercel.app/' + sellerRoutes[path]);
  const page = await getTemplate(path);
  if (!page) notFound();
  return <PageContent page={page} />;
}
