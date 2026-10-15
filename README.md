# Unimart Next.js storefront

This project migrates the supplied Unimart HTML template to Next.js 16 with React 19. The original HTML files and assets in the parent folder are retained as the template source. Build-time conversion renders their sections as React elements; the old jQuery/plugin bundles, preloaders and duplicated hidden menus are not shipped on the storefront.

## Local development

Use Node.js 22.9 or newer. Run these commands inside `next-storefront`:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. The default API is `http://127.0.0.1:8000/api`. Change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if your backend uses another port or prefix, then restart the dev server. Keep the `/api` suffix and omit a trailing slash. This URL is public; never put API secrets in a `NEXT_PUBLIC_` variable.

The backend must allow the frontend origin (`http://127.0.0.1:3000`, and `http://localhost:3000` if used) in CORS, including Authorization and Content-Type headers and GET, POST, PATCH, DELETE and OPTIONS methods. Serve uploaded product images from a browser-accessible media URL. The frontend sends bearer tokens and does not require cross-origin cookies.

If npm on Windows is configured to use a failing Git Bash shell, use `npm --script-shell=cmd.exe run dev` (or `build`/`test`).

## Build and shared hosting

```powershell
npm test
npm run build
npm run preview
```

The build creates `out/index.html` and a folder with `index.html` for each route. Upload **the contents of `out`** to the domain's `public_html`, including `_next`, `assets`, and the hidden `.htaccess` file. Node.js is needed to build locally, but is not needed on the hosting server. Deploy at the domain root. The supplied Apache configuration enables compression, directory indexes, response headers and redirects for the old root `.html` URLs.

If Python 3 is available, `python scripts/package-export.py` bundles the completed export into `shared-hosting.zip`. The supplied ZIP is configured for the current localhost API; regenerate it after building with your production API URL.

Before a public deployment, set `NEXT_PUBLIC_API_BASE_URL` to your publicly reachable **HTTPS** backend URL and rebuild. A deployed website cannot use your computer's localhost backend: localhost refers to each visitor's own computer. Add the deployed HTTPS frontend origin to the backend CORS configuration. Replace the entire previous export together so HTML and JavaScript chunks match. Do not upload `node_modules`, `.next`, source files or environment files.

`npm run preview` serves the export on port 3000 for local checks. Stop the dev server first if it already uses that port. The original parent `index.html` belongs to the legacy site; the Next.js homepage is `out/index.html` after building.

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

Demo layouts, component showcases, blogs, portfolios, missing-page samples, duplicate product/shop/checkout layouts and unsupported account pages are excluded. Privacy, terms and help have normal root URLs. Old duplicate storefront URLs redirect to their retained equivalent on Apache. Unsupported/demo URLs return 404.

`lib/site-pages.mjs` is the explicit page allowlist. The build clears its own generated output and recopies only referenced assets so excluded pages and images do not remain in the export. Original HTML files in the parent folder remain as source/backups and are not uploaded. When replacing an existing deployment, remove its old page folders before uploading the new export; overwriting files alone cannot remove old demo pages.

## Design and performance

The original branding, images, typography, colors, home sections and footer are reused. Interactive shopping/account content uses the original CSS classes with React state. Header behavior is implemented in React. Promotion banners, prices in banner artwork, contact information and legal/business copy remain template content: replace these with your store's real content before launch.

The build generates a trimmed stylesheet for the storefront and loads the full template stylesheet only on the retained store-information pages. Images below the fold load lazily, large homepage images are resized, and the first hero image has high loading priority. The homepage uses one public product request for its product sections. `migration-report.json` records output sizes; smaller HTML/CSS is not a measured real-user speed score.

## Verification and launch status

Automated tests cover API response/error handling, bearer authentication, session roles, input normalization and payment verification/rejection/cancellation. Tests use isolated mocks and never charge a payment. The production export contains 21 routes.

The running local API at `127.0.0.1:8000` was checked: public products returned the documented paginated shape with zero records, categories returned an empty list, protected cart requests returned 401 without a token, and CORS/preflight allowed the local frontend origin and authorization header. Browser checks verified search, sorting, the empty catalog and the cart sign-in redirect. Live authenticated flows and populated product responses still need integration testing with test accounts and inventory. Before launch, exercise customer registration/login, address/cart changes, seller permissions and a Razorpay **test-mode** payment with your backend, including cancellation, verification failure and out-of-stock responses. Configure Razorpay capture and webhook settings on the backend according to `apis.txt`; keep its secret keys exclusively on the backend.

To update template sections, edit the original HTML in the parent directory and rebuild. To change API-driven UI or interactions, edit `components/` and `lib/`. Generated JSON and copied public assets are regenerated by `scripts/prepare-template.mjs`.
