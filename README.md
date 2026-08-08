# Gymsanity App

V1 web app for **digital programming**, **membership plans**, and **group + 1:1 booking** with credit-based private coaching.

- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma + **PostgreSQL**, **Stripe** subscriptions
- **Auth:** JWT in an httpOnly cookie (`JWT_SECRET` in `.env`)

## Quick start (local)

1. Install [Node.js](https://nodejs.org/) 18+ (includes `npm`).

2. Copy env (if you don’t have `.env` yet):

```bash
cp .env.example .env
```

3. Install dependencies, then **start Postgres and prepare the DB** (requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running):

```bash
npm install
npm run db:setup
```

This runs `docker compose up -d`, waits for Postgres, `prisma db push`, and `db:seed`.

**Manual equivalent:** `docker compose up -d` → `npx prisma db push` → `npm run db:seed`  
**Stop Postgres:** `docker compose down` (data stays in the Docker volume until you remove it.)

4. Run the app and open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

The default `.env.example` uses `postgresql://gymsanity:gymsanity@localhost:5432/gymsanity` matching `docker-compose.yml`.

### Production: host + DB + Stripe + domain

**Fast path to gymsanity.fit:** [docs/WEBSITE_LAUNCH.md](./docs/WEBSITE_LAUNCH.md)

Full reference (**Neon, Vercel, Stripe, DNS**): [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — see **§6 Custom domain**.

### Demo accounts (after seed)

| Role   | Email               | Password       |
|--------|---------------------|----------------|
| Coach  | coach@gymsanity.app | gymsanity123   |
| Member | member@gymsanity.app | gymsanity123  |

The member account is on the **Hybrid** plan with **2** 1:1 credits and sample program + slots.

## What’s implemented

- Landing, register (plan choice: Digital / Hybrid / Elite 1:1), login, logout  
- Member **dashboard** (membership, credits, next session, upcoming bookings)  
- **Programs** with sessions, exercises, optional reflection note, mark complete  
- **Booking** for future slots (group capacity, 1:1 uses credits)  
- **Coach desk:** create slots, list upcoming bookings, mark complete / no-show  
- **Soundtrack:** member playlists (songs + optional links + notes); Spotify embeds when applicable  
- **Exercise library & program builder (coach):** reusable exercises with cues; draft/publish programs built from library blocks  
- **Stripe Checkout** for plans that have a `stripePriceId`; webhooks activate membership + credits  
- **Manage billing** (Stripe Customer Portal) when `stripeCustomerId` exists  

## Payments & environments

- **Without** `STRIPE_SECRET_KEY` **or** without `stripePriceId` on a plan → registration grants an **active** membership immediately (handy for local dev).  
- **With** Stripe keys and price IDs on plans → new members complete **Checkout** before access activates.  

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for live keys, webhooks, and Vercel.

Product and UX rationale for **music + programming** features: [docs/FEATURES.md](./docs/FEATURES.md).

## Scripts

| Command        | Action                    |
|----------------|---------------------------|
| `npm run dev`  | Dev server (Turbopack)    |
| `npm run build`| Production build          |
| `npx prisma db push` | Sync schema to DB   |
| `npm run db:seed`    | Seed demo data      |
| `npm run db:studio`  | Prisma Studio       |

---

Founded by **Aliou Barry** — Gymsanity: train for sanity.
