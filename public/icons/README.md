# PWA & app store icons

Source artwork: `icon.svg` (purple gradient with "G" mark).  
Store-grade 1024×1024 (no alpha): `../../assets/icon-only.png`.

## Generate PNGs for `manifest.json`

The web manifest references these files:

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `icon-192.png` | 192×192 | PWA / Android | Present |
| `icon-512.png` | 512×512 | PWA splash / install | Present (must be true 512²) |
| `apple-touch-icon.png` | 180×180 | iOS home screen | Present |

### Option A — from repo 1024 source (fastest)

```bash
npm run icons:store
```

This resizes `assets/icon-only.png` → `public/icons/icon-512.png` via `sips` (macOS).

### Option B — Capacitor Assets (native + PWA)

1. Install once: `npm install -D @capacitor/assets`
2. Ensure `assets/icon-only.png` is your 1024×1024 master.
3. Run: `npx capacitor-assets generate --iconBackgroundColor '#6d28d9' --splashBackgroundColor '#faf8ff'`
4. Copy generated PWA sizes into `public/icons/` if needed and re-run `npm run build`.

### Option C — ImageMagick

```bash
brew install imagemagick   # if needed
cd public/icons
for size in 192 512; do
  magick -background none icon.svg -resize ${size}x${size} icon-${size}.png
done
magick -background none icon.svg -resize 180x180 apple-touch-icon.png
```

Note: SVG→PNG with alpha may be rejected for the **iOS App Store** 1024 icon. Prefer `assets/icon-only.png` (no alpha) for store uploads.

### Option D — Online

Upload `icon.svg` to realfavicongenerator.net and download the Android Chrome + Apple Touch Icon pack into this folder.

## Native app icons

iOS App Store icon already lives at:

`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024).

After changing the master, sync Capacitor and/or regenerate Android mipmaps with `@capacitor/assets`, then:

```bash
npm run cap:sync
```
