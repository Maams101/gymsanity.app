# PWA & app store icons

Source artwork: `icon.svg` (purple gradient with "G" mark).

## Generate PNGs for `manifest.json`

The web manifest references these files (create them before store submission):

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192x192 | PWA / Android |
| `icon-512.png` | 512x512 | PWA splash / install |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

### Option A — Capacitor Assets (recommended for native + PWA)

1. Install once: `npm install -D @capacitor/assets`
2. Place a 1024x1024 PNG at `assets/icon-only.png` (export from `icon.svg` in Figma, Illustrator, or realfavicongenerator.net).
3. Run: `npx capacitor-assets generate --iconBackgroundColor '#6d28d9' --splashBackgroundColor '#faf8ff'`
4. Copy generated PWA sizes into `public/icons/` and re-run `npm run build`.

### Option B — Quick CLI (ImageMagick)

```bash
brew install imagemagick   # if needed
cd public/icons
for size in 192 512; do
  magick -background none icon.svg -resize ${size}x${size} icon-${size}.png
done
magick -background none icon.svg -resize 180x180 apple-touch-icon.png
```

### Option C — Online

Upload `icon.svg` to realfavicongenerator.net and download the Android Chrome + Apple Touch Icon pack into this folder.

## Native app icons

After PNGs exist, sync into Capacitor projects:

```bash
npm run cap:sync
```

Then replace iOS `AppIcon.appiconset` and Android `mipmap-*` using Xcode / Android Studio asset tools, or use `@capacitor/assets` as above.
