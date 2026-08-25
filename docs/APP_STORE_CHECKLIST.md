# App Store and Google Play checklist

**Revised target launch:** **September 22, 2026** (working backward from today, Aug 25).

Previous July 31 target slipped; buffer assumes first-time Apple review + possible IAP-policy feedback.

Gymsanity is a Capacitor wrapper around `https://gymsanity.fit`. Companion doc: [MOBILE_LAUNCH.md](./MOBILE_LAUNCH.md).

---

## 0. Decision blocker (reply before iOS engineering)

Pick one and tell the agent (or counsel) so paywall / review notes can be finalized:

| Choice | Meaning | Engineering impact |
|--------|---------|-------------------|
| **A** | Multiplatform / account login only; purchases stay on web | Soften or remove in-app Subscribe CTAs on iOS; review notes explain web billing |
| **B** | Free app; no purchase UI in shell | Hide `/subscribe` CTAs when `getCapacitorPlatform() === "ios"` |
| **C** | Apple IAP (StoreKit / RevenueCat) on iOS; Stripe on web/Android | New native billing work; weeks of effort |
| **D** | Hybrid / physical coaching exception | Legal + App Review advice first |

**Until you reply:** do not submit iOS; Android can still proceed with Play Billing policy review in parallel.

---

## 1. Developer account enrollment

### Apple — click path (allow 24–48 hours after payment)

1. Open [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/).
2. Sign in with the Apple ID you want as **Account Holder** (prefer a company/brand ID, not a personal throwaway).
3. Enable **Two-Factor Authentication** if prompted ([appleid.apple.com](https://appleid.apple.com)).
4. Choose **Individual** or **Organization** → continue → pay **$99 USD**.
5. Wait for approval email.
6. Open [App Store Connect](https://appstoreconnect.apple.com) → **Agreements, Tax, and Banking**:
   - [ ] Accept **Paid Applications Agreement**
   - [ ] Complete **Tax** forms
   - [ ] Add **Banking**
7. [developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list) → **+** → **App IDs** → type **App** → description `Gymsanity` → Bundle ID **Explicit**: `fit.gymsanity.app` → register.
8. App Store Connect → **Apps** → **+** → **New App**:
   - Platforms: iOS
   - Name: `Gymsanity`
   - Primary language: English (U.S.)
   - Bundle ID: `fit.gymsanity.app`
   - SKU: `gymsanity-ios` (internal; not shown to users)
   - User Access: Full Access

### Google Play — click path (often same day; identity verify may take longer)

1. Open [play.google.com/console/signup](https://play.google.com/console/signup).
2. Pay **$25 USD** one-time registration.
3. Complete **Account details** and **Identity verification** (government ID / org docs as prompted).
4. **Create app**:
   - App name: `Gymsanity`
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free (membership sold via Stripe/web or Play Billing later)
5. Finish console tasks before production:
   - [ ] **Store listing**
   - [ ] **Data safety** (align with `https://gymsanity.fit/privacy`)
   - [ ] **Target audience**
   - [ ] **Content rating** questionnaire
   - [ ] **App access** (demo credentials if login-gated)

Package name in Gradle is already `fit.gymsanity.app` — do not change it after first upload.

---

## 2. Required assets

### App icon

| Platform | Requirement | Repo status |
|----------|-------------|-------------|
| iOS | 1024×1024 PNG, **no alpha**, no rounded corners | `ios/.../AppIcon-512@2x.png` and `assets/icon-only.png` |
| Android listing | 512×512 PNG | Generate from `assets/icon-only.png` (`sips -z 512 512`) |
| PWA | 192 + 512 | `public/icons/icon-192.png`, `icon-512.png` (512 fixed Aug 2026) |

Source mark: `public/icons/icon.svg`. Full native mipmap regeneration: see `public/icons/README.md` / `@capacitor/assets`.

### Screenshots (minimum)

**iOS (iPhone 6.7")** — e.g. iPhone 15/16 Pro Max simulator: **1290 × 2796 px**, at least **3** screenshots.

Suggested scenes:

1. Today / workout of the day
2. Active session with rest timer
3. Recovery or day-at-a-glance
4. Settings / integrations (optional)
5. Coach view (optional, if targeting coaches)

**Android (phone)** — **1080 × 1920** minimum (or 1080×2340), at least **2** screenshots.

Also prepare:

- [ ] **Feature graphic** (Android): 1024 × 500
- [ ] **Promo text** (Android, 80 chars) and **short description** (80 chars)
- [ ] **Full description** (~4000 chars max both stores)

### Draft listing copy (edit before submit)

**Short description (≤80 chars):**

```text
Train for sanity — programming, recovery, and coaching in one place.
```

**Promo text (≤80 chars, Play):**

```text
Programming, recovery, and coaching — built for consistent training.
```

**Full description (draft):**

```text
Gymsanity helps you train consistently without burning out.

• Daily programming and session tracking with rest timers
• Recovery and day-at-a-glance views so you know when to push or pull back
• Coaching workflows for members working with a coach
• Account sync across web and mobile — log in with your Gymsanity membership

Privacy Policy: https://gymsanity.fit/privacy
Terms: https://gymsanity.fit/terms
Support: support@gymsanity.fit
```

Adjust the payments sentence after the IAP decision (do not promise in-app purchase unless you ship StoreKit).

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

**Recommendation before submit:**

1. Decide with counsel: **web-only billing** vs **IAP on iOS**.
2. If web-only: remove or soften in-app Subscribe CTAs on iOS build (use `getCapacitorPlatform()` in `lib/capacitor-shell.ts`), or open Safari to the website with clear "manage membership on gymsanity.fit" copy.
3. Prepare a **Review Notes** paragraph explaining cross-platform account and where payment occurs.

**Google Play:** Similar policies for digital subscriptions; Play Billing required for in-app purchase of digital subs unless using eligible alternative billing in specific regions.

---

## 4. Submission timeline (working backward from Sep 22)

Assume **1–2 weeks** for first-time review + fixes.

| Date | Milestone |
|------|-----------|
| **Aug 25–27** | **You:** IAP decision reply; start Apple + Google enrollment |
| **Aug 28–30** | Accounts approved; create `fit.gymsanity.app` records; legal pages confirmed live |
| **Aug 31 – Sep 2** | Screenshots + feature graphic; listing copy finalized |
| **Sep 3–5** | `cap:sync`, TestFlight internal, Play internal testing track |
| **Sep 6–10** | QA on real devices: login, session, Stripe/portal behavior per IAP decision, camera onboarding, safe areas |
| **Sep 11** | Submit **Android** production (often faster review) |
| **Sep 12–13** | Submit **iOS** App Review with demo account + strategy notes |
| **Sep 14–21** | Address review feedback; resubmit if needed |
| **Sep 22** | Target **go-live** both stores |

Buffer: If Apple rejects on IAP policy, fallback (web-only soft-gate or IAP) may push launch into early October.

---

## 5. App Review demo account template

Paste into **App Store Connect → App Review Information** and Google Play **App access**.

```
Demo account (required for review):

Email:    review@gymsanity.fit
Password: [STRONG_TEMP_PASSWORD — set in production only]

Notes:
- This account has an active Digital membership (no payment required in-app).
- Login → Today tab shows workout of the day.
- Tap a session to see exercise tracking and rest timer.
- Settings → Privacy Policy and Terms are linked at /privacy and /terms.
- Camera onboarding: optional; skip if camera unavailable in simulator.
- Subscriptions are managed on https://gymsanity.fit (Stripe); no IAP in this build.
  (Update this bullet if you ship Apple IAP.)

Contact for review questions: support@gymsanity.fit
```

**Dev seed (local only — never submit these to Apple/Google):**

- `member@gymsanity.app` / `gymsanity123` (active Digital)
- `coach@gymsanity.app` / `gymsanity123`

**Before submit:**

- [ ] Create `review@gymsanity.fit` (or similar) on **production** with active membership
- [ ] Verify password login works in Capacitor WebView on a device
- [ ] Confirm demo data includes at least one program / WOD on Today
- [ ] Rotate or disable the review password after approval if desired

---

## 6. Technical pre-submission checklist

- [ ] `npm run build` passes
- [ ] `npm run cap:sync` run after any config change
- [ ] Version / build number incremented in Xcode (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`) and `android/app/build.gradle` (`versionName` / `versionCode`)
- [ ] iOS: `NSCameraUsageDescription` present (already set for onboarding assessment)
- [ ] Android: `INTERNET` + optional `CAMERA` (already in manifest; camera not required)
- [ ] No hardcoded secrets in native projects
- [ ] Privacy Policy matches Data safety / App Privacy nutrition labels
- [ ] Export compliance: app uses HTTPS only → typically no encryption registration (confirm in questionnaire)
- [ ] `capacitor.config.ts` `server.url` is `https://gymsanity.fit` (no cleartext)
- [ ] Stripe domains allowed in `allowNavigation` (or external Safari if web-only strategy)

---

## 7. Post-launch

- [ ] Monitor crash reports (Xcode Organizer, Play Vitals)
- [ ] Respond to store reviews within 48 hours
- [ ] Plan OTA updates via web deploy (Capacitor loads production URL—no store update needed for most web changes)
