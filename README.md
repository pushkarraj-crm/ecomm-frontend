# D2C Marketplace — React seller app

## Run

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173/. Django runs at http://127.0.0.1:8000/. Vite proxies `/api` and `/media` to Django. Copy `.env.example` to `.env` to change the backend target. Production hosting must proxy these paths and serve `index.html` for frontend routes.

## Supported screens

The app includes the original styled dashboard, orders, inventory, product creation, product details, order details and four seller authentication screens. Store profile, bank/KYC, bulk catalog and earnings/payout tools are available from the sidebar.

Only the 10 cleaned templates in `src/templates/` are imported and bundled. Unsupported demo pages, navigation, notifications, label downloads, marketing tools, social login, order states, catalog filters, publishing controls and unused product fields have been removed from the active application. Original HTML files in `default/` remain as source backups and are not accessible as app routes. Shared assets are reused from `default/assets/`.

Supported order states are pending, shipped and delivered. Category and sub-category selectors load the backend category tree and submit the selected leaf category ID. API errors appear in the existing page/form area. Tokens are stored in sessionStorage; an expired session requires signing in again.

## Demo data

The local test seller owns 6 demo products and 8 variants, including 1 out-of-stock variant and 3 low-stock variants. Categories and subcategories:

- Clothing → T-Shirts
- Home & Kitchen → Lighting, Mugs
- Accessories → Backpacks, Water Bottles
- Footwear → Running Shoes

Local test credentials: `.local/test-seller.json` (ignored by Git). A SQLite backup was saved in `.local/db-before-demo-products.sqlite3` before seeding. Demo products were added directly to the local database; the test seller's approval and permissions were not changed. Catalog submissions still require backend seller approval. No real KYC, bank details, payments, payouts or orders were created.

## Verification

```powershell
npm test
npm run build
```

API tests cover pagination, validation errors, bearer authentication, multipart requests, expired sessions and network failures. Live API checks verified login, dashboard, orders, inventory, profile, analytics, earnings, bank, payouts, category hierarchy and stock save. Browser checks verified seller login and dependent category/sub-category selection.
