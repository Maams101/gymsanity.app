# Mobile launch (Capacitor)

Gymsanity ships as a **Capacitor shell** that loads the production web app at [https://gymsanity.fit](https://gymsanity.fit). Native projects live in `ios/` and `android/`.

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

## Icons and splash screens

1. Replace placeholder artwork in `public/icons/` (see `public/icons/README.md`).
2. Generate native assets with `@capacitor/assets` or Xcode / Android Studio asset catalogs.
3. Re-run `npm run cap:sync` after updating `capacitor.config.ts`.

## PWA (Add to Home Screen)

The web app also ships a manifest at `/manifest.json` with icons under `public/icons/`. Settings includes install instructions for browser-based PWA users.

## Legal pages (store requirement)

Public routes required by App Store / Play review:

- [Privacy Policy](/privacy) — `app/privacy/page.tsx`
- [Terms of Service](/terms) — `app/terms/page.tsx`

Linked from Settings and the marketing homepage footer. **Have a lawyer review** before submission.

## Payments in the native shell

Subscriptions are handled on the web via **Stripe Checkout** (Safari / Chrome Custom Tabs). Apple's App Store guidelines may require **In-App Purchase** if digital content is sold inside an iOS app without a qualifying "reader" or multiplatform exception. See [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md) for strategy notes.

## Release workflow (summary)

1. Enroll developer accounts and create app records (bundle ID `fit.gymsanity.app`).
2. Finalize icons, screenshots, and store listing copy.
3. `npm run cap:sync` → archive in Xcode / build signed AAB in Android Studio.
4. Upload to App Store Connect and Google Play Console.
5. Provide demo credentials in review notes (template in checklist).

Full timeline and asset sizes: **[APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)**.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White screen on launch | Confirm `https://gymsanity.fit` is reachable; check `allowNavigation` in config for Stripe domains. |
| Safe area / notch overlap | App uses `viewport-fit=cover` and `env(safe-area-inset-*)` in `AppShell` and bottom nav. |
| Cookies / login not persisting | Ensure production uses `SameSite` cookies compatible with WebView; test login flow on device. |
| Camera onboarding fails | Grant camera permission in iOS/Android project `Info.plist` / `AndroidManifest.xml` when you enable native permissions. |
