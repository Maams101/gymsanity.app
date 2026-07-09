# App Store and Google Play checklist

Target launch: **July 31, 2026**

Gymsanity is a Capacitor wrapper around `https://gymsanity.fit`. Use this checklist for enrollment, assets, review, and timeline.

---

## 1. Developer account enrollment

### Apple (allow 24-48 hours for approval)

- [ ] Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) — **$99/year**
- [ ] Enable **Two-Factor Authentication** on the Apple ID
- [ ] Accept **Paid Applications Agreement** in App Store Connect → Agreements, Tax, and Banking
- [ ] Add banking and tax forms (required before paid apps; still needed for free apps with IAP later)
- [ ] Create **App ID** / bundle identifier: `fit.gymsanity.app`
- [ ] Create app record in **App Store Connect** → Apps → New App

### Google Play (usually same day)

- [ ] Register at [play.google.com/console](https://play.google.com/console/) — **$25 one-time**
- [ ] Complete **Developer account** identity verification
- [ ] Create app → default language, app name **Gymsanity**, package `fit.gymsanity.app`
- [ ] Fill **Data safety** form (align with Privacy Policy)
- [ ] Complete **Target audience** and **Content rating** questionnaires

---

## 2. Required assets

### App icon

| Platform | Requirement |
|----------|-------------|
| iOS | 1024x1024 PNG, no alpha, no rounded corners (Apple applies mask) |
| Android | 512x512 PNG for Play listing; adaptive icon foreground + background in project |

Source: `public/icons/icon.svg` → generate via `public/icons/README.md` or `@capacitor/assets`.

### Screenshots (minimum)

**iOS (iPhone 6.7")** — e.g. iPhone 15 Pro Max simulator: **1290 x 2796 px**, at least **3** screenshots.

Suggested scenes:

1. Today / workout of the day
2. Active session with rest timer
3. Recovery or day-at-a-glance
4. Settings / integrations (optional)
5. Coach view (optional, if targeting coaches)

**Android (phone)** — **1080 x 1920** minimum (or 1080x2340), at least **2** screenshots.

Also prepare:

- [ ] **Feature graphic** (Android): 1024 x 500
- [ ] **Promo text** (Android, 80 chars) and **short description** (80 chars)
- [ ] **Full description** (~4000 chars max both stores)

### Store listing URLs

- [ ] Privacy Policy URL: `https://gymsanity.fit/privacy`
- [ ] Terms URL (optional on Play, recommended): `https://gymsanity.fit/terms`
- [ ] Support URL or email: `support@gymsanity.fit`
- [ ] Marketing URL: `https://gymsanity.fit`

---

## 3. Apple IAP / companion app strategy

**Current model:** Membership is sold via **Stripe on the web** (subscribe flow, Stripe Checkout, customer portal).

**Risk:** Apple Guideline **3.1.1** requires In-App Purchase for digital goods/services consumed in the app unless an exception applies.

**Common paths for fitness / coaching apps:**

| Strategy | Notes |
|----------|--------|
| **A. Reader / account-based (multiplatform)** | If users purchase on the web and the app only accesses existing membership (login), some apps qualify—Apple scrutiny varies. Document clearly in review notes that purchase happens on the website. |
| **B. Free app + web signup only** | App is free; no purchase UI in the app. Link to web for account creation is restricted—avoid "buy here" buttons. Stripe Checkout opened from in-app links may still trigger review questions. |
| **C. Apple IAP for iOS** | Add StoreKit / RevenueCat for iOS subscriptions; keep Stripe for web/Android. Higher engineering cost, 15-30% fee. |
| **D. Physical / hybrid services** | 1:1 in-person coaching may qualify for external payment in limited cases—get legal/App Review advice if Elite includes live coaching. |

**Recommendation before July 31:**

1. Decide with counsel: **web-only billing** vs **IAP on iOS**.
2. If web-only: remove or soften in-app Subscribe CTAs on iOS build, or use Safari view to web with clear "manage membership on gymsanity.fit" copy.
3. Prepare a **Review Notes** paragraph explaining cross-platform account and where payment occurs.

**Google Play:** Similar policies for digital subscriptions; Play Billing required for in-app purchase of digital subs unless using eligible alternative billing in specific regions.

---

## 4. Submission timeline (working backward from July 31)

Assume **1-2 weeks** for first-time review + fixes.

| Date | Milestone |
|------|-----------|
| **Jul 9-11** | Enroll Apple + Google accounts; finalize bundle ID; legal pages live on production |
| **Jul 12-14** | Replace placeholder icons; capture screenshots on 6.7" iPhone + Pixel emulator |
| **Jul 15-17** | `cap:sync`, TestFlight internal build, Android internal testing track |
| **Jul 18-21** | QA on real devices: login, session, Stripe portal link, camera onboarding, bottom nav safe areas |
| **Jul 22** | Submit **Android** production (often faster review) |
| **Jul 23-24** | Submit **iOS** to App Review with demo account |
| **Jul 25-30** | Address review feedback, resubmit if needed |
| **Jul 31** | Target **go-live** both stores |

Buffer: If Apple rejects IAP policy, have a **fallback** (web-only build or IAP integration) that pushes launch to mid-August.

---

## 5. App Review demo account template

Paste into **App Store Connect → App Review Information** and Google Play **App access** section.

```
Demo account (required for review):

Email:    review+gymsanity@YOURDOMAIN.com
Password: [STRONG_TEMP_PASSWORD]

Notes:
- This account has an active Digital membership (no payment required in-app).
- Login → Today tab shows workout of the day.
- Tap a session to see exercise tracking and rest timer.
- Settings → Privacy Policy and Terms are linked at /privacy and /terms.
- Camera onboarding: optional; skip if camera unavailable in simulator.
- Subscriptions are managed on https://gymsanity.fit (Stripe); no IAP in this build.

Contact for review questions: support@gymsanity.fit
```

**Before submit:**

- [ ] Seed demo user in production DB with active membership
- [ ] Verify password login works in Capacitor WebView
- [ ] Confirm demo data includes at least one program / WOD

---

## 6. Technical pre-submission checklist

- [ ] `npm run build` passes
- [ ] `npm run cap:sync` run after any config change
- [ ] Version / build number incremented in Xcode and `android/app/build.gradle`
- [ ] iOS: `NSCameraUsageDescription` if camera onboarding enabled
- [ ] Android: `INTERNET` permission (default); camera permission if needed
- [ ] No hardcoded secrets in native projects
- [ ] Privacy Policy matches Data safety / App Privacy nutrition labels
- [ ] Export compliance: app uses HTTPS only → typically no encryption registration (confirm in review questionnaire)

---

## 7. Post-launch

- [ ] Monitor crash reports (Xcode Organizer, Play Vitals)
- [ ] Respond to store reviews within 48 hours
- [ ] Plan OTA updates via web deploy (Capacitor loads production URL—no store update needed for most web changes)
