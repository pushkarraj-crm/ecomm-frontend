import { StoreProvider } from '@/components/store-provider';
import Header from '@/components/header';
import './globals.css';
import './marketplace.css';
export const metadata = {
  title: { default: 'Unimart | Online Shopping', template: '%s | Unimart' },
  description:
    'Shop the latest products at Unimart. Manage your cart, delivery addresses and orders with secure Razorpay checkout.',
  icons: { icon: '/assets/images/favicon.png' },
};
export default async function RootLayout({ children }) {
  return (
    // Browser extensions can add attributes such as data-qb-installed before hydration.
    // Limit suppression to the root element; descendant mismatch warnings stay enabled.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('marketplace-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}",
          }}
        />
        <link rel="stylesheet" href="/template.css" />
        <link rel="stylesheet" href="/icons.css" />
      </head>
      <body className="rbt-header-sticky">
        <StoreProvider>
          <a href="#main-content" className="next-skip">
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <footer className="market-footer">
            <div>
              <strong>unimart</strong>
              <p>Your everyday marketplace.</p>
            </div>
            <nav aria-label="Footer shopping links">
              <a href="/shop/">Shop all products</a>
              <a href="/home/categories">All categories</a>
              <a href="/wishlist/">Your wishlist</a>
              <a href="/my-order-history/">Track your orders</a>
            </nav>
            <nav aria-label="Footer support links">
              <strong>Customer care</strong>
              <a href="/help-center/">Help centre</a>
              <a href="/return-policy/">Returns and exchanges</a>
              <a href="/privacy-policy/">Privacy policy</a>
              <a href="/terms-policy/">Terms and conditions</a>
              <a href="/about/">About us</a>
            </nav>
            <nav aria-label="Footer account links">
              <strong>Sell with Unimart</strong>
              <a href="/account-info/">Your account</a>
              <a href="https://d2c-seller-dashboard.vercel.app/signup">
                Become a seller
              </a>
            </nav>
          </footer>
          <div className="copyright-area copyright-style-1">
            <div className="container py-3">
              © {new Date().getFullYear()} Unimart. All rights reserved.
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
