# ELARAA E-Commerce

Full-stack rebuild of the ELARAA static site: Next.js storefront + Express/Prisma/PostgreSQL backend, plus a full admin panel.

**Status: Phase 1 (storefront) and Phase 2 (admin panel) complete and verified end-to-end** against a real database.
Production build (`npm run build -w frontend`) passes clean — all 33 routes (storefront + admin) compile and prerender successfully.

## Admin login

```
URL:      http://localhost:3000/admin
Email:    admin@elaraa.example
Password: ElaraaAdmin123!
```

Created by `npm run prisma:seed` (see `backend/prisma/seed.ts`). Change this password before any shared/deployed use.

## Database

This dev machine turned out to already have a native PostgreSQL 18 install running as a Windows service
(port 5432), so that's what's actually configured in `backend/.env` right now — a dedicated `elaraa` role/database
was created, isolated from other projects on this machine. `docker-compose.yml` is still included and fully
valid if you'd rather run Postgres in a container instead (Docker Desktop wasn't installed when this was built);
either way, `backend/.env`'s `DATABASE_URL` is the only thing that needs to point at your actual instance.

## Prerequisites

- Node.js 20+ (this machine has v24)
- A running PostgreSQL instance (native install, already set up here — or `docker compose up -d` if you prefer)

## Setup

```bash
npm install                          # installs all workspaces (root/backend/frontend/shared)
cp backend/.env.example backend/.env       # then fill in DATABASE_URL + generate real JWT secrets
cp frontend/.env.example frontend/.env.local
npm run prisma:migrate               # creates tables (already applied on this machine)
npm run prisma:seed                  # loads the real ELARAA catalog (7 earring lines) + admin user — already seeded here
npm run dev:backend                  # http://localhost:4000
npm run dev:frontend                 # http://localhost:3000 (separate terminal)
```

To generate real JWT secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (run twice, once each for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`).

## Deploying to production

Target setup: **Vercel** for the frontend (free tier, git-push deploys, built for Next.js) + **Railway** for the backend and Postgres (managed DB, ~$5–20/month). Launching on the free subdomains each platform provides (e.g. `elaraa.vercel.app` / `elaraa-backend.up.railway.app`) — no custom domain required to go live; one can be pointed at either service later with zero code changes. Real email sending is deferred for now — `SMTP_*` stays blank, so verification/reset/order emails continue landing in Ethereal's web-viewable test inbox rather than a real mailbox. Swap in real SMTP creds in Railway's env vars whenever that's ready.

Both cookie-based sessions (`refreshToken`, guest `cartSessionToken`) and the `<Image>` remote-pattern allowlist are already environment-aware for this split-domain setup — see `isProd` branches in `backend/src/controllers/{auth,cart}.controller.ts` and `frontend/next.config.js`.

### 1. Push to GitHub

This repo isn't a git repository yet. From `elaraa-ecommerce/`:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new (private, recommended — it contains real customer/order logic even if no secrets) GitHub repository and push:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. Backend + Postgres on Railway

1. [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo** → select this repo.
2. Add a **PostgreSQL** plugin to the project (Railway generates `DATABASE_URL` automatically — copy its reference into the backend service's env vars as `DATABASE_URL`, Railway supports referencing it directly).
3. On the backend service → Settings:
   - **Root Directory**: leave as the repo root (this is an npm-workspaces monorepo — installing from a `backend/`-only root directory won't resolve the `@elaraa/shared` workspace dependency).
   - **Build Command**: `npm install && npm run build:backend`
   - **Start Command**: `cd backend && node dist/index.js` (must `cd` first — `UPLOAD_DIR` and the Prisma client resolve relative to the process's working directory, matching local dev where the backend always runs from `backend/`).
4. **Variables** tab — set everything from `backend/.env.example`, notably:
   - `NODE_ENV=production`
   - `DATABASE_URL` — reference the Postgres plugin's connection string.
   - `CLIENT_URL` — the Vercel frontend's URL once you have it (step 3). CORS will reject the frontend's requests until this is set correctly.
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate fresh ones, don't reuse the dev placeholders: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Leave `SMTP_*` blank per the note above.
5. **Add a Volume** (Settings → Volumes) mounted at `/app/backend/uploads` (adjust if Railway's build root differs — it should match wherever `cd backend` lands). Without this, every redeploy wipes uploaded product/category photos, since Railway's filesystem is otherwise ephemeral.
6. After the first successful deploy, run the Prisma migration once against the production DB — either via Railway's shell (Service → the "⋯" menu → Shell) running `npm run prisma:migrate:prod -w backend`, or by pointing your local `DATABASE_URL` at the Railway Postgres instance temporarily and running the same command from your machine.
7. Seed the production admin user the same way (`npm run prisma:seed -w backend`) — **then change the seeded admin password immediately after first login**, since `ElaraaAdmin123!` is public in this repo's history.
8. Note the backend's public URL (Settings → Networking → Generate Domain) — you'll need it for the frontend.

### 3. Frontend on Vercel

1. [vercel.com](https://vercel.com) → New Project → import the same GitHub repo.
2. **Root Directory**: `elaraa-ecommerce/frontend` (Vercel auto-detects Next.js and still resolves the `@elaraa/shared` workspace correctly by installing from the monorepo root — don't override the install command).
3. **Environment Variables**: `NEXT_PUBLIC_API_URL` = the Railway backend URL from step 2.8 (e.g. `https://elaraa-backend.up.railway.app`).
4. Deploy. Once it's live, copy the resulting `*.vercel.app` URL back into Railway's `CLIENT_URL` (step 2.4) and redeploy the backend so CORS allows it.

### 4. Verify

- Visit the Vercel URL, confirm the homepage renders real product data (proves the frontend can reach the backend + images resolve through the new `remotePatterns` entry).
- Register an account, log in, add to cart, and refresh the page — confirms the cross-domain `SameSite=None` cookies are working (this is the step most likely to silently fail if `CLIENT_URL`/`NEXT_PUBLIC_API_URL` are mismatched or `https` isn't in effect yet).
- Log into `/admin` with the seeded credentials, upload a product photo, then hard-refresh — confirms the Volume is actually mounted (uploads persisting) rather than being silently dropped on the ephemeral filesystem.
- Place a real COD test order end-to-end.

### Known gaps to revisit later

- **Real email** — currently Ethereal only (see above); swap `SMTP_*` for a real provider (Resend, Brevo, SendGrid, etc.) when ready.
- **Payments** — Cash on Delivery only; Razorpay is stubbed behind `PaymentProvider` but needs real API keys.
- **Custom domain** — either platform can have one attached later (Vercel: Project → Domains; Railway: Service → Networking) with no code changes required.

## What's in the admin panel (`/admin`)

- **Dashboard** — revenue, order/customer counts, low-stock alerts, pending reviews, recent orders.
- **Products** — full CRUD, variant management (metal/back-type/stock), multi-image upload with primary-image selection.
- **Categories** — CRUD with product counts.
- **Inventory** — stock levels across every variant, manual restock/adjustment with an audit log (`InventoryLog`).
- **Orders** — full list + detail, status transitions with audit history; COD orders auto-mark `PAID` on `DELIVERED`; `RETURNED`/`CANCELLED` auto-restocks inventory.
- **Customers** — list with lifetime order count/spend, detail view with addresses + order history.
- **Reviews** — moderation queue (approve/reject/delete), product rating recalculates automatically.
- **Coupons** — percentage/fixed-amount codes with min-order and usage-limit rules.
- **Discounts** — store-wide or category-scoped percentage/fixed discounts.
- **Banners** — image upload with placement (home hero/promo, shop top) and scheduling fields.
- **Newsletter** — subscriber list with CSV export.
- **Messages** — contact-form submissions with status workflow (new/read/responded/archived).
- **Settings** — key-value site settings (shipping fee, free-shipping threshold, GST rate, SEO defaults).

All destructive deletes (products, categories, coupons) are FK-safe: if a row is referenced by real order history, the API deactivates it instead of deleting and tells the admin why, rather than failing with a raw database error.

## What's real vs. placeholder

- **Cash on Delivery** is the only working payment method. Razorpay is architected behind a `PaymentProvider` interface (`backend/src/services/payment/`) but not wired up — needs real API keys (Phase 3).
- **Email** sends for real via Ethereal (nodemailer's test SMTP sandbox) — verification/reset emails work end-to-end, but land in a web-viewable Ethereal inbox (URL logged to the backend console), not a real mailbox. Swap to a real SMTP provider via `backend/.env` when ready.
- **Uploads** are stored on local disk (`backend/uploads/`) behind a `StorageProvider` interface, ready to swap to S3/Cloudinary later.
- **Blog** pages are still deferred (needs admin content authoring — the `BlogPost` table exists but has no admin UI yet).
- **Invoice download / customer profile editing** are not built yet.
- 6 of the 7 seeded products have description copy written to match the ELARAA brand voice for this seed (only "Delicate Drops" had real copy in the static site) — review before treating as final.

## What was verified this session

**Phase 1 (storefront):**
- Auth: register → Ethereal verification email → login → authenticated `/me` → cookie-based refresh rotation.
- Cart: guest cart (cookie-based) → add/update/remove → merge into account cart on login.
- Checkout: real stock validation, GST (3%) + shipping calc, order creation, inventory decrement, cart clear, confirmation email — tested both as a guest and as a logged-in user.
- Every storefront page renders real data from the database and compiles cleanly in a production build.

**Phase 2 (admin panel):**
- Role guard: unauthenticated → redirected to `/login`; authenticated non-admin → redirected away; admin → dashboard, with the storefront header/cart drawer correctly hidden on all `/admin` routes.
- Product CRUD, variant add/remove, image upload, all confirmed persisting to the database and reflected back on the public storefront.
- FK-safe delete confirmed on both a real code path (deleting a product with order history correctly deactivates instead of throwing a raw Postgres error) and the reverse (a product with no orders hard-deletes).
- Order status update → COD auto-marked `PAID` on `DELIVERED`, verified via the actual UI click-through, not just the API.
- Review moderation, coupon/discount/banner creation, newsletter export, contact-status workflow, and settings save — each exercised through the real UI and cross-checked against the database afterward.
- One real bug caught and fixed during verification: `api.put()` was called by the Settings page but never defined in `api-client.ts` — added and re-verified.
- Full production build (`next build`) passes with all 33 routes compiling and prerendering — caught and fixed one real type error (an over-narrowed `as const` literal type) that dev mode had silently let through.
