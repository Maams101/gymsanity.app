# Native / store icon source

`icon-only.png` — **1024×1024**, RGB, **no alpha**. Used for:

- App Store Connect marketing icon (same asset as iOS `AppIcon.appiconset`)
- Input for `@capacitor/assets` / `npm run icons:store`

Do not commit temporary cleartext Capacitor configs. After replacing this file, regenerate PWA sizes:

```bash
npm run icons:store
```
