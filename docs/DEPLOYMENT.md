# Deploy Gymsanity (Vercel + Neon + Stripe)

This guide connects **hosting**, **PostgreSQL**, and **payments** for production.

## 1. Database (Neon recommended)

1. Create a project at [neon.tech](https://neon.tech) (free tier is fine).
2. Copy the **connection string** (use the pooled `?sslmode=require` URL Prisma expects).
3. Set `DATABASE_URL` in Vercel (and locally in `.env`).

**Local Postgres** (optional):

```bash
docker compose up -d
# DATABASE_URL=postgresql://gymsanity:gymsanity@localhost:5432/gymsanity
npx prisma db push
```

## 2. Stripe products & prices

1. In [Stripe Dashboard](https://dashboard.stripe.com) → **Product catalog**, create products/prices that match your app plans (seed + registration currently use **Digital** and **Elite**).
2. For each plan, add a **recurring price** (monthly is typical). Copy each **Price ID** (`price_...`).
3. Put them in environment variables (Vercel + local):

   - `STRIPE_PRICE_DIGITAL`
   - `STRIPE_PRICE_ELITE`

4. Run seed (or update `Plan` rows in Prisma Studio) so `stripePriceId` is stored:

   ```bash
   npm run db:seed
   ```

   Seed reads the `STRIPE_PRICE_*` env vars and writes them to the `Plan` table.

## 3. Stripe webhooks

**Production**

1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. URL: `https://YOUR_DOMAIN/api/stripe/webhook`
3. Events to send:

   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel.

**Local testing**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the webhook signing secret the CLI prints as `STRIPE_WEBHOOK_SECRET` in `.env`.

## 4. Environment variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `JWT_SECRET` | Long random string (openssl rand -hex 32) |
| `NEXT_PUBLIC_APP_URL` | Public site URL, e.g. `https://gymsanity.fit` (no trailing slash) |
| `STRIPE_SECRET_KEY` | Secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook or `stripe listen` |
| `STRIPE_PRICE_DIGITAL` | etc. (optional if you set prices only via DB) |

`VERCEL_URL` is set automatically; `NEXT_PUBLIC_APP_URL` should still be your canonical URL for Stripe redirects.

## 5. Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add all env vars above.
3. **Build command** (default is fine if `package.json` has `prisma generate` in `build`):

   ```bash
   prisma generate && next build
   ```

4. First deploy: run against Neon:

   ```bash
   DATABASE_URL="your-neon-url" npx prisma db push
   ```

   Or add migrations later and use `prisma migrate deploy` in the build (after committing migrations).

5. Seed production **only if** you want demo accounts — otherwise create your coach user manually or add a one-off script.

## 6. Custom domain: **gymsanity.fit**

Use this when the app is on **Vercel** and you already own **gymsanity.fit** at your registrar (Namecheap, Cloudflare, Google Domains, etc.).

**Checklist (production)**

1. Vercel **Domains**: add `gymsanity.fit` (and optional `www`) until status is **Valid** with HTTPS.
2. Vercel env: `NEXT_PUBLIC_APP_URL=https://gymsanity.fit` — then **Redeploy**.
3. Stripe **Webhook** (live mode): `https://gymsanity.fit/api/stripe/webhook` + update `STRIPE_WEBHOOK_SECRET` on Vercel.
4. Stripe **Customer portal** return URLs: include `https://gymsanity.fit/dashboard` (and `/post-checkout` if you use it).

### 6.1 Add the domain in Vercel

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Domains**.
2. Add **`gymsanity.fit`** and, if you want it, **`www.gymsanity.fit`**.
3. Vercel will show the **exact DNS records** to create (IPs and hostnames can change—always follow what Vercel displays). Typical patterns:
   - **Apex** (`gymsanity.fit`): an **A** record (or ALIAS/ANAME at DNS providers that support it) pointing at Vercel’s load balancer.
   - **`www`**: a **CNAME** to **`cname.vercel-dns.com`** (or the hostname Vercel shows).

Official reference: [Vercel: Adding a domain](https://vercel.com/docs/concepts/projects/domains/add-a-domain).

### 6.2 Configure DNS at your registrar

1. Log into where **gymsanity.fit** is registered (or into **Cloudflare** if the domain uses their nameservers).
2. Create the records **exactly** as Vercel lists (no typos on the host: `@` or blank often means apex; `www` for the subdomain).
3. Save and wait for propagation (often a few minutes; can take longer).

In Vercel, wait until the domain shows **Valid** with a certificate issued.

### 6.3 Point the app at the real URL

In Vercel → **Settings** → **Environment Variables**, set:

```bash
NEXT_PUBLIC_APP_URL=https://gymsanity.fit
```

(No trailing slash. If you prefer **www** as canonical, use `https://www.gymsanity.fit` here and set the primary domain in Vercel accordingly.)

Redeploy the project (or **Deployments** → **⋯** → **Redeploy**) so the new URL is baked into the build where needed.

### 6.4 Stripe (production)

1. **Webhooks** — Endpoint URL must be  
   **`https://gymsanity.fit/api/stripe/webhook`**  
   (replace any old `localhost` or `*.vercel.app` test URL for live mode.)
2. Copy the new **Signing secret** into **`STRIPE_WEBHOOK_SECRET`** on Vercel.
3. **Customer portal** (if you use it): Stripe Dashboard → **Settings** → **Billing** → **Customer portal** — ensure allowed return URLs include  
   `https://gymsanity.fit/dashboard` (and `/www` variant if you use www).

### 6.5 Optional: apex vs www

In Vercel **Domains**, set one version as **primary** and turn on **redirect** from the other (e.g. `www` → `gymsanity.fit`) so links and SEO stay consistent.

---

## 7. Stripe Billing Portal (optional)

For **Manage billing** in the app, enable the **Customer portal** in Stripe Dashboard → **Settings** → **Billing** → **Customer portal**.

## 8. Behavior summary

- If **`STRIPE_SECRET_KEY` is set** and a plan has a **`stripePriceId`**, new signups go through **Checkout** before membership activates.
- If Stripe is **not** configured or plans have **no** price IDs, registration keeps the previous behavior (immediate active membership — good for local dev).

---

Questions: keep test mode (`sk_test_...`) until you’ve run a full test checkout and webhook flow end-to-end.
