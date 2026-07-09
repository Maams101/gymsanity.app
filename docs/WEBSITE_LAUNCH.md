# Launch Gymsanity at gymsanity.fit

Use this checklist to publish the **website** on Vercel with your custom domain. Mobile app store work is separate — see [MOBILE_LAUNCH.md](./MOBILE_LAUNCH.md) when ready.

**Estimated time:** 1–2 hours (mostly waiting on DNS).

---

## Prerequisites

- [ ] GitHub repo: `https://github.com/Maams101/gymsanity.app`
- [ ] Domain **gymsanity.fit** at your registrar (currently on Cloudflare)
- [ ] [Vercel](https://vercel.com) account
- [ ] [Neon](https://neon.tech) account (free tier)
- [ ] [Stripe](https://dashboard.stripe.com) account (test mode first, then live)

---

## Step 1 — Push latest code to GitHub

All recent features must be on `main` before Vercel can deploy them.

```bash
git add -A
git status   # review changes
git commit -m "Prepare production launch for gymsanity.fit"
git push origin main
```

---

## Step 2 — Create Neon production database

1. [neon.tech](https://neon.tech) → **New project** → name it `gymsanity-prod`.
2. Copy the **pooled** connection string (`postgresql://...?sslmode=require`).
3. From your machine (one time):

```bash
DATABASE_URL="postgresql://YOUR_NEON_URL" npx prisma db push
```

4. Optional — seed demo accounts for testing (not recommended for public prod):

```bash
DATABASE_URL="postgresql://YOUR_NEON_URL" npm run db:seed
```

---

## Step 3 — Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** `Maams101/gymsanity.app`.
2. Framework: **Next.js** (auto-detected).
3. Build command: `prisma generate && next build` (default from `package.json`).
4. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://gymsanity.fit` |
| `STRIPE_SECRET_KEY` | `sk_test_...` first, then `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook (step 5) |
| `STRIPE_PRICE_DIGITAL` | `price_...` from Stripe |
| `STRIPE_PRICE_ELITE` | `price_...` from Stripe |

5. Click **Deploy**. Note the `*.vercel.app` URL — test login there before switching DNS.

---

## Step 4 — Connect gymsanity.fit (DNS)

Your domain currently points to Cloudflare (`185.158.133.1`) and is **not** serving the app yet.

### Option A — DNS at Cloudflare (recommended if nameservers are already there)

1. Vercel project → **Settings** → **Domains** → Add `gymsanity.fit` and `www.gymsanity.fit`.
2. Vercel shows the records to create. Typical setup:

| Type | Name | Value |
|------|------|--------|
| `A` | `@` | `76.76.21.21` (use the IP Vercel shows) |
| `CNAME` | `www` | `cname.vercel-dns.com` |

3. In **Cloudflare DNS**, replace the existing `A` record for `@` with Vercel’s IP.
4. Set proxy status to **DNS only** (grey cloud) until the certificate is issued, then you can enable the orange cloud if desired.
5. Wait until Vercel shows **Valid** with HTTPS.

### Option B — DNS at your registrar

Follow the same records Vercel displays when you add the domain.

---

## Step 5 — Stripe webhooks (production URL)

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. URL: `https://gymsanity.fit/api/stripe/webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** → update `STRIPE_WEBHOOK_SECRET` in Vercel → **Redeploy**.

### Customer portal return URLs

Stripe → **Settings** → **Billing** → **Customer portal** → allowed return URLs:

- `https://gymsanity.fit/today`
- `https://gymsanity.fit/post-checkout`

---

## Step 6 — Verify production

After DNS propagates and Vercel redeploys with `NEXT_PUBLIC_APP_URL=https://gymsanity.fit`:

- [ ] `https://gymsanity.fit` loads the landing page
- [ ] Register → onboarding → subscribe flow works (Stripe test card: `4242 4242 4242 4242`)
- [ ] Login as coach → `/coach` desk loads
- [ ] Member `/today` tab shows day at a glance + WOD
- [ ] Webhook fires after checkout (check Stripe → Webhooks → event log)

---

## Step 7 — Go live with real payments

1. Switch Stripe keys from `sk_test_` / `pk_test_` to **live** keys in Vercel.
2. Create **live** products/prices; update `STRIPE_PRICE_*` env vars.
3. Add a **live** webhook endpoint (same URL).
4. Redeploy.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Check build logs; run `npm run build` locally |
| 500 on login/settings | Run `prisma db push` against Neon; tables may be missing |
| Stripe redirect wrong host | Set `NEXT_PUBLIC_APP_URL=https://gymsanity.fit` and redeploy |
| Domain shows Cloudflare 409 | DNS still points to old host; update A/CNAME to Vercel |
| Cookies not sticking | Ensure site is HTTPS; check `JWT_SECRET` is set |

---

## What runs where

```
gymsanity.fit (DNS → Vercel)
    └── Next.js app (this repo)
            └── Neon Postgres
            └── Stripe (payments)
```

For App Store / Google Play, a Capacitor wrapper loads this same URL — see [MOBILE_LAUNCH.md](./MOBILE_LAUNCH.md).
