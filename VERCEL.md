# Vercel deployment

Import this repository as its own Vercel project. The included vercel.json selects the correct framework and build command. The storefront uses Next.js server rendering and supports new product slug routes without rebuilding. The seller dashboard uses Vite and includes SPA routing and self-contained static assets.

Set the API environment variable before deploying the connected app:

- Storefront: NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND/api
- Seller dashboard: VITE_API_BASE_URL=https://YOUR-BACKEND/api

Set it for Production and Preview, then redeploy: public frontend variables are compiled at build time. Do not put Django secret keys, database credentials or payment secrets in frontend variables. Without a backend URL the frontend can deploy, but API features show a configuration error.

In Django, configure ALLOWED_HOSTS for its own hostname and CORS_ALLOWED_ORIGINS for both Vercel app origins. Preview deployment hostnames also need to be permitted if testing protected API calls there. Use publicly reachable HTTPS media URLs for images.

Local development continues to use the local backend. Vercel cannot reach 127.0.0.1 on your computer.

Suggested free testing backend: Render web service, Neon PostgreSQL and external image storage such as Cloudinary. Render's local filesystem is temporary; do not use local SQLite or uploaded media for persistent cloud data.
