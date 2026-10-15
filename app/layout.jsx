import {Suspense} from 'react';
import {StoreProvider} from '@/components/store-provider';
import Header from '@/components/header';
import {TemplateNode} from '@/components/template';
import {getFooter} from '@/lib/templates.mjs';
import './globals.css';
export const metadata={title:{default:'Unimart | Online Shopping',template:'%s | Unimart'},description:'Shop the latest products at Unimart. Manage your cart, delivery addresses and orders with secure Razorpay checkout.',icons:{icon:'/assets/images/favicon.png'}};
export default async function RootLayout({children}) {
  const footer = await getFooter();
  return (
    // Browser extensions can add attributes such as data-qb-installed before hydration.
    // Limit suppression to the root element; descendant mismatch warnings stay enabled.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/template.css" />
        <link rel="stylesheet" href="/icons.css" />
      </head>
      <body className="rbt-header-sticky">
        <StoreProvider>
          <a href="#main-content" className="next-skip">Skip to content</a>
          <Header />
          <main id="main-content">{children}</main>
          <Suspense><TemplateNode node={footer} /></Suspense>
          <div className="copyright-area copyright-style-1">
            <div className="container py-3">© {new Date().getFullYear()} Unimart. All rights reserved.</div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
