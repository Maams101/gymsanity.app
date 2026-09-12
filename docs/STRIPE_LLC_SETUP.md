# Connect Gymsanity LLC Stripe (production)

This app uses a **single Stripe merchant account** (not Stripe Connect). “Connected to Gymsanity LLC” means production at [gymsanity.fit](https://gymsanity.fit) uses **live** API keys, products/prices, and webhooks from the Stripe account whose **Business name** is Gymsanity LLC.

**Do not paste `sk_live_…` or webhook secrets into chat.** Set them only in the [Vercel Dashboard](https://vercel.com) → Project → **Settings** → **Environment Variables**.

Related: [DEPLOYMENT.md](./DEPLOYMENT.md), [WEBSITE_LAUNCH.md](./WEBSITE_LAUNCH.md).

---

## What you need access to

| Access | Why |
|--------|-----|
| Stripe Dashboard for **Gymsanity LLC** | Live keys, products/prices, webhook, Customer Portal, Apple Pay domain |
| Vercel project that deploys **gymsanity.fit** | Set/update Production env vars and redeploy |
| Production DB (Neon) | Write `stripePriceId` on `Plan` rows (seed or Prisma Studio) |

No paid Stripe upgrade is required for standard Checkout + webhooks. Apple Pay needs domain verification (free in Dashboard).

---

## Environment variables (complete list)

Set these for **Production** on Vercel (and optionally Preview). Match **live** vs **test** consistently — never mix `sk_live` with `pk_test` or test `price_` IDs.

| Variable | Required | Notes |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes | `sk_live_…` (prod) or `sk_test_…` (local/test) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (embedded checkout) | Matching `pk_live_…` / `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_…` from the **live** endpoint for `https://gymsanity.fit/api/stripe/webhook` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://gymsanity.fit` (no trailing slash) |
| `STRIPE_PRICE_DIGITAL` | Yes* | Recurring price → plan slug `digital` |
| `STRIPE_PRICE_SESSIONS_1` | Yes* | One-time price → `sessions-1` ($180) |
| `STRIPE_PRICE_SESSIONS_6` | Yes* | One-time price → `sessions-6` |
| `STRIPE_PRICE_SESSIONS_12` | Yes* | One-time price → `sessions-12` |
| `STRIPE_PRICE_SESSIONS_24` | Yes* | One-time price → `sessions-24` |
| `STRIPE_PRICE_ELITE` | No | Legacy; not used by current seed / offered plans |

\*Price env vars are used by `npm run db:seed` to populate `Plan.stripePriceId`. You can instead set `stripePriceId` directly in the DB (Prisma Studio). Checkout only works when the plan row has a price ID.

Also required for the app (not Stripe-specific): `DATABASE_URL`, `JWT_SECRET`.

---

## Checklist — Gymsanity LLC → production

### 1. Confirm the right Stripe account

1. Open [dashboard.stripe.com](https://dashboard.stripe.com) while logged in as the Gymsanity LLC owner/admin.
2. **Settings** → **Business** (or account switcher): business name should be **Gymsanity LLC**.
3. Toggle to **Live mode** (not Test).

### 2. Create live products & prices

In **Product catalog**, create prices that match offered plans:

| App plan slug | Billing | Suggested product |
|---------------|---------|-------------------|
| `digital` | **Recurring** (e.g. monthly) | Digital membership |
| `sessions-1` | **One-time** | 1 × 1:1 session ($180) |
| `sessions-6` | **One-time** | 6 × 1:1 sessions |
| `sessions-12` | **One-time** | 12 × 1:1 sessions |
| `sessions-24` | **One-time** | 24 × 1:1 sessions |

Copy each **Price ID** (`price_…`). Recurring vs one-time must match the app (`Plan.billingType`).

### 3. Copy live API keys

**Developers** → **API keys** (Live mode):

- Secret key → `STRIPE_SECRET_KEY`
- Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Paste into **Vercel** only (Production environment).

### 4. Webhook endpoint (live)

1. **Developers** → **Webhooks** → **Add endpoint** (Live mode).
2. URL: `https://gymsanity.fit/api/stripe/webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel.

### 5. Customer Portal

**Settings** → **Billing** → **Customer portal** → enable and allow return URLs:

- `https://gymsanity.fit/today`
- `https://gymsanity.fit/post-checkout`

### 6. Apple Pay

Apple Pay is enabled on the Gymsanity LLC **Default** payment method configuration.

**Payment method domains** (required for Embedded Checkout on your site):

- `gymsanity.fit` — registered & Apple Pay **active**
- `www.gymsanity.fit` — registered & Apple Pay **active**

Also served at `public/.well-known/apple-developer-merchantid-domain-association` for classic domain association.

**Shopper requirements:** Safari (or supported browser) on a device with Apple Pay set up, over HTTPS. Apple Pay does not appear in all browsers (e.g. typical Chrome on Windows).

Dashboard: [Payment method domains](https://dashboard.stripe.com/settings/payment_method_domains) (Live mode).

### 7. Point production DB at live prices

Either:

```bash
# With live STRIPE_PRICE_* set in the shell env pointing at Neon:
DATABASE_URL="postgresql://…" npm run db:seed
```

Or update each offered plan’s `stripePriceId` in Prisma Studio / SQL. Seed also creates demo users — prefer direct DB updates on a live DB that already has real members.

### 8. Redeploy

After changing Vercel env vars, **Redeploy** Production so `NEXT_PUBLIC_*` values are baked into the client bundle.

---

## Confirm success

1. Stripe Dashboard (Live) → Business name = **Gymsanity LLC**.
2. Vercel env: `STRIPE_SECRET_KEY` starts with `sk_live_`, publishable with `pk_live_`, prices are from **that** live account (not a personal/test account).
3. Careful live smoke test: complete a small/refundable checkout (or use Stripe’s live test carefully), then:
   - Stripe → **Webhooks** → endpoint shows **200** for `checkout.session.completed`
   - Member membership/credits activate in the app
4. **Manage billing** on `/today` opens the Customer Portal for paying customers.

---

## Local / test (unchanged)

Keep `.env` on `sk_test_` / `pk_test_` and use:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the CLI-printed `whsec_…` as local `STRIPE_WEBHOOK_SECRET`.

---

## What an agent or teammate can vs cannot do

| Can do without your secrets | Must do as Gymsanity LLC / Vercel admin |
|-----------------------------|----------------------------------------|
| Document env vars & Dashboard steps | Log into LLC Stripe and create live products |
| Keep code/docs accurate | Copy live keys + webhook secret into **Vercel** (not chat) |
| Update `.env.example` / checklists | Confirm Business name and live mode |
| | Link price IDs on production `Plan` rows |
| | Redeploy and smoke-test checkout |

Repo ownership of keys cannot prove LLC identity — only the Stripe account you log into does.
