# Mobile launch (Capacitor)

Gymsanity ships as a **Capacitor shell** that loads the production web app at [https://gymsanity.fit](https://gymsanity.fit). Native projects live in `ios/` and `android/`.

Full store checklist, assets, IAP strategy, and timeline: **[APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)**.

---

## Next 1–2 weeks (ordered)

| # | Owner | Action | Depends on |
|---|--------|--------|------------|
| 1 | **You** | Decide **Apple IAP vs web-only Stripe** (see checklist §3). Reply with A/B/C/D. | Counsel optional but recommended |
| 2 | **You** | Enroll **Apple Developer Program** ($99/yr) + accept Paid Apps agreement / tax / banking | Apple ID + 2FA |
| 3 | **You** | Enroll **Google Play Console** ($25) + identity verification | Google account |
| 4 | **You** | Create app records: bundle / package `fit.gymsanity.app` | Accounts approved |
| 5 | Agent / you | `npm run cap:sync` → run on **simulator + physical device**; smoke login, Today, session, Settings | Xcode / Android Studio installed |
| 6 | **You** | Capture store screenshots on 6.7" iPhone + Android phone (sizes in checklist) | Device or simulator |
| 7 | **You** | Seed **App Review demo account** on production (active Digital membership) | Neon / coach tools access |
| 8 | **You** | Upload TestFlight + Play **internal testing** builds; invite yourself | Signing + app records |
| 9 | Both | QA pass on real devices (checklist §6); fix blockers | Test builds |
| 10 | **You** | Submit Play (usually first), then App Review with review notes template | Demo account + assets |

**Hard blocker for iOS submit:** item **1** (IAP vs Stripe). Do not submit an iOS build that opens Stripe Checkout in-app until that decision is locked.

---

## You need to authorize / do

These require your accounts, money, identity, or legal judgment. The agent **cannot** do them.

| Item | Cost / effort | Why |
|------|----------------|-----|
| Apple Developer Program enrollment | $99/year | Certificates, TestFlight, App Store |
| App Store Connect: tax, banking, Paid Applications Agreement | Forms + bank | Required before paid / IAP; still needed for many free apps |
| Google Play Console enrollment + identity verification | $25 one-time | Play listing + signed AAB upload |
| Create App ID / app records (`fit.gymsanity.app`) | ~30 min | Bundle ID must match Capacitor `appId` |
| **Decision: IAP vs Stripe-only on iOS** | Strategy call | Guideline 3.1.1 risk; drives engineering |
| Lawyer review of `/privacy` and `/terms` | Legal | Store + Stripe compliance |
| Screenshots, feature graphic, final listing copy | Device time | Store submission assets |
| Production App Review demo user + password | Ops | Reviewers must log in |
| Xcode signing (team, provisioning) + Play upload keystore | One-time setup | Ship binaries |
| Payments for accounts / any future IAP product setup | Card | Enrollment + optional StoreKit |

Click-by-click enrollment: [APP_STORE_CHECKLIST.md §1](./APP_STORE_CHECKLIST.md#1-developer-account-enrollment).

---

## Agent can do without your accounts

| Item | Status |
|------|--------|
| Capacitor config (`appId`, production `server.url`, Stripe `allowNavigation`) | Done in repo |
| Launch + checklist docs, timeline, review-notes template | Done / maintained in `docs/` |
| PWA icons (`public/icons/`), `assets/icon-only.png` for `@capacitor/assets` | Icon-512 fixed; 1024 source in `assets/` |
| `lib/capacitor-shell.ts` helpers for future iOS paywall soft-gating | Ready for use after IAP decision |
| npm scripts `cap:sync` / `cap:open:*` | In `package.json` |
| Soften or remove in-app Subscribe / Stripe CTAs on iOS | **Waiting on your IAP decision** |
| Wire StoreKit / RevenueCat | **Waiting on decision C** |
| Push secrets, enroll accounts, spend money | Never |

---

## Prerequisites

- **Node.js** 18+ (same as the web app)
- **Xcode** 15+ (macOS) for iOS builds
- **Android Studio** Ladybug or newer with SDK 34+
- **Apple Developer Program** ($99/yr) and **Google Play Console** ($25 one-time) — see [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)

## Quick start

```bash
npm install
npm run cap:sync          # copy web placeholder + config into native projects
npm run cap:open:ios      # open Xcode
npm run cap:open:android  # open Android Studio
```

Build and run from Xcode or Android Studio on a simulator or device.

## Configuration

`capacitor.config.ts` sets:

| Setting | Value |
|---------|--------|
| `appId` | `fit.gymsanity.app` |
| `appName` | Gymsanity |
| `server.url` | `https://gymsanity.fit` |
| `webDir` | `capacitor-web` (placeholder; not used at runtime) |
| `allowNavigation` | `gymsanity.fit`, Stripe Checkout / Billing / JS hosts |

The WebView loads the live site. Local `capacitor-web/index.html` is only used if `server.url` is removed (e.g. for offline native bundles later).

### Local / staging URL

To point at a dev server instead of production, temporarily change `server.url` in `capacitor.config.ts`:

```ts
server: {
  url: "http://YOUR_LAN_IP:3000",
  cleartext: true,
},
```

Run `npm run dev`, then `npm run cap:sync` and rebuild the native app. **Do not commit cleartext / local URLs.**

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync config and web assets to `ios/` and `android/` |
| `npm run cap:open:ios` | Open the iOS project in Xcode |
| `npm run cap:open:android` | Open the Android project in Android Studio |
| `npm run icons:store` | Regenerate PWA `icon-512.png` from `assets/icon-only.png` |

## Icons and splash screens

1. Source 1024×1024 (no alpha): `assets/icon-only.png` (also used as iOS App Store icon today).
2. PWA sizes live in `public/icons/` — see `public/icons/README.md`.
3. Optional: `npm install -D @capacitor/assets` then `npx capacitor-assets generate` for full native mipmaps / splash.
4. Re-run `npm run cap:sync` after changing `capacitor.config.ts`.

## PWA (Add to Home Screen)

The web app also ships a manifest at `/manifest.json` with icons under `public/icons/`. Settings includes install instructions for browser-based PWA users.

## Legal pages (store requirement)

Public routes required by App Store / Play review:

- [Privacy Policy](/privacy) — `app/privacy/page.tsx`
- [Terms of Service](/terms) — `app/terms/page.tsx`

Linked from Settings and the marketing homepage footer. **Have a lawyer review** before submission.

## Payments in the native shell

Subscriptions are handled on the web via **Stripe Checkout**. Apple's App Store guidelines may require **In-App Purchase** if digital content is sold inside an iOS app without a qualifying exception. See [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md) §3.

Use `isCapacitorNative()` / `getCapacitorPlatform()` from `lib/capacitor-shell.ts` once you choose a strategy (e.g. hide Subscribe CTAs on iOS).

## Demo / App Review account

**Local / seed (dev only):**

| Email | Password | Role |
|-------|----------|------|
| `member@gymsanity.app` | `gymsanity123` | Member + active Digital |
| `coach@gymsanity.app` | `gymsanity123` | Coach |

Created by `npm run db:seed`. **Do not** put this password in App Store review notes for production.

**Production review account:** create a dedicated user (e.g. `review@gymsanity.fit`) with an **active Digital** membership, strong unique password, and paste into App Store Connect / Play “App access” using the template in the checklist. Prefer creating via coach tools or a one-off secure seed against Neon — never commit production passwords.

## Release workflow (summary)

1. Enroll developer accounts and create app records (bundle ID `fit.gymsanity.app`).
2. Finalize icons, screenshots, and store listing copy.
3. `npm run cap:sync` → archive in Xcode / build signed AAB in Android Studio.
4. Upload to App Store Connect and Google Play Console.
5. Provide demo credentials in review notes (template in checklist).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White screen on launch | Confirm `https://gymsanity.fit` is reachable; check `allowNavigation` includes Stripe domains. |
| Safe area / notch overlap | App uses `viewport-fit=cover` and `env(safe-area-inset-*)` in `AppShell` and bottom nav. |
| Cookies / login not persisting | Production is first-party `https://gymsanity.fit` in the WebView; retest login after cookie/session changes. |
| Camera onboarding fails | `NSCameraUsageDescription` (iOS) and `CAMERA` permission (Android) are already present. |
| Stripe Checkout blocked | Ensure `allowNavigation` includes `checkout.stripe.com` / `billing.stripe.com`; after IAP decision, may need Safari external open instead. |
