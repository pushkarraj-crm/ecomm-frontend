# Unimart Next.js storefront

This project migrates the supplied Unimart HTML template to Next.js 16 with React 19. The original HTML files and assets in the original template folder are retained as the template source. Build-time conversion renders their sections as React elements; the old jQuery/plugin bundles, preloaders and duplicated hidden menus are not shipped on the storefront.

## Local development

Use Node.js 22.9 or newer. Run these commands inside `D:\D2C Marketplace\Frontend`:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. The default API is `http://127.0.0.1:8000/api`. Change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if your backend uses another port or prefix, then restart the dev server. Keep the `/api` suffix and omit a trailing slash. This URL is public; never put API secrets in a `NEXT_PUBLIC_` variable.

The backend must allow the frontend origin (`http://127.0.0.1:3000`, and `http://localhost:3000` if used) in CORS, including Authorization and Content-Type headers and GET, POST, PATCH, DELETE and OPTIONS methods. Serve uploaded product images from a browser-accessible media URL. The frontend sends bearer tokens and does not require cross-origin cookies.

If npm on Windows is configured to use a failing Git Bash shell, use `npm --script-shell=cmd.exe run dev` (or `build`/`test`).

## Build and deploy on Vercel

```powershell
npm test
npm run build
npm start
```

Import this frontend repository into Vercel with the Next.js framework preset, the default `.next` output and `npm run build`. Product paths use `/<product-slug>/dp/<id>/`, for example `/demo-desk-lamp/dp/5/`. The backend slug is preferred; the product ID makes the link unique. Old `product-single-default/?product_id=5` links redirect in the browser after loading the product. New products work at runtime without rebuilding the frontend.

Set `NEXT_PUBLIC_API_BASE_URL` in Vercel to your public HTTPS backend URL including `/api`, then deploy. Local development keeps `http://127.0.0.1:8000/api`. A deployed site cannot access your computer's localhost backend. Allow the deployed frontend origin in the backend CORS settings.

Commit `generated/` and the prepared `public/` assets alongside the code; the Vercel build uses these files and does not require the original HTML folder or a running backend. To regenerate template assets locally, run `npm run prepare:template`. It finds the original source folder next to this project, or accepts `TEMPLATE_SOURCE_DIR`. ZIP packaging is not part of deployment.

## Connected features

The implementation follows `../apis.txt`:

- Products, categories, search, documented sorting, pagination, variant stock/prices/images, product view tracking and customer reviews.
- Customer and seller registration/login, password recovery/reset and logout.
- Customer profile, saved addresses, default address, cart quantities/removal and order history.
- Checkout using a saved structured address, Razorpay Checkout and server-side payment verification. Success is shown only after the verification endpoint succeeds.
- Seller dashboard, orders/status, invoice download, inventory updates, catalog creation/bulk import/template download, earnings, payout requests, analytics, KYC and bank details.

Wishlist is stored in the current browser because the document has no wishlist endpoint. Notifications, saved payment methods and the account review list are excluded because matching APIs are not documented. Undocumented token refresh is not attempted; an expired access token signs the user out. Backend authorization and stock/payment validation remain authoritative.

## Included pages

The production site contains 21 useful pages: home, shop, categories, product detail, cart, checkout, order confirmation, customer sign-in/sign-up/password reset, account information, order history, wishlist, seller sign-in/sign-up/dashboard, about, returns, privacy, terms and help.

Demo layouts, component showcases, blogs, portfolios, missing-page samples, duplicate product/shop/checkout layouts and unsupported account pages are excluded. Privacy, terms and help have normal root URLs. Unsupported/demo URLs return 404.

`lib/site-pages.mjs` is the explicit page allowlist. Local template preparation clears its generated output and recopies only referenced assets. Normal Vercel builds use the prepared assets directly. Original HTML source/backups are not deployed.

## Design and performance

The original branding, images, typography, colors, home sections and footer are reused. Interactive shopping/account content uses the original CSS classes with React state. Header behavior is implemented in React. Promotion banners, prices in banner artwork, contact information and legal/business copy remain template content: replace these with your store's real content before launch.

The build generates a trimmed stylesheet for the storefront and loads the full template stylesheet only on the retained store-information pages. Images below the fold load lazily, large homepage images are resized, and the first hero image has high loading priority. The homepage uses one public product request for its product sections. `migration-report.json` records output sizes; smaller HTML/CSS is not a measured real-user speed score.

## Verification and launch status

Automated tests cover API response/error handling, bearer authentication, session roles, input normalization and payment verification/rejection/cancellation. Tests use isolated mocks and never charge a payment. The app includes 21 store routes plus dynamic product URLs.

The running local API at `127.0.0.1:8000` was checked: public products returned the documented paginated shape with zero records, categories returned an empty list, protected cart requests returned 401 without a token, and CORS/preflight allowed the local frontend origin and authorization header. Browser checks verified search, sorting, the empty catalog and the cart sign-in redirect. Live authenticated flows and populated product responses still need integration testing with test accounts and inventory. Before launch, exercise customer registration/login, address/cart changes, seller permissions and a Razorpay **test-mode** payment with your backend, including cancellation, verification failure and out-of-stock responses. Configure Razorpay capture and webhook settings on the backend according to `apis.txt`; keep its secret keys exclusively on the backend.

To update template sections, edit the original HTML in the parent directory and rebuild. To change API-driven UI or interactions, edit `components/` and `lib/`. Generated JSON and copied public assets are regenerated by `scripts/prepare-template.mjs`.

## Product URLs

Product links use the backend's stored slug and stable ID, for example `/demo-desk-lamp/dp/5/`. Legacy `/product-single-default/?product_id=5` links and stale name segments redirect in the browser after loading the product. Sign-in return links use the canonical product path. The public catalog and detail API now expose `slug`. Vercel resolves product paths at runtime, so publishing new products or changing a slug does not require a frontend rebuild.
