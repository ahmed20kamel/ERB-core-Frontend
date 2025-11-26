# ⚠️ Required Favicon Files

## Files That Must Exist in /public

The following files are required to eliminate 404 errors:

### Required Files:
```
/public/
├── favicon.ico ✅ (MUST EXIST)
├── favicon-16x16.png ✅ (MUST EXIST)
├── favicon-32x32.png ✅ (MUST EXIST)
├── favicon-96x96.png ✅ (MUST EXIST - Additional size)
├── apple-touch-icon.png ✅ (MUST EXIST - 180x180)
├── android-chrome-192x192.png ✅ (MUST EXIST)
├── android-chrome-512x512.png ✅ (MUST EXIST)
└── site.webmanifest ✅ (Already exists)
```

## How to Generate

### Method 1: Online Tool (Recommended)
1. Go to: **https://realfavicongenerator.net/**
2. Upload: `logo.png` (from `/public` folder)
3. Generate all sizes
4. Download package
5. Extract ALL files to `/public` folder (root, no subfolders)

### Method 2: ImageMagick
```bash
cd frontend/public
magick logo.png -resize 16x16 favicon-16x16.png
magick logo.png -resize 32x32 favicon-32x32.png
magick logo.png -resize 96x96 favicon-96x96.png
magick logo.png -resize 180x180 apple-touch-icon.png
magick logo.png -resize 192x192 android-chrome-192x192.png
magick logo.png -resize 512x512 android-chrome-512x512.png
magick logo.png -define icon:auto-resize=16,32,48 favicon.ico
```

## Important Notes

- ✅ All files must be in `/public` root (not in subfolders)
- ✅ File names are case-sensitive (lowercase)
- ✅ Next.js serves files from `/public` at root URL (`/`)
- ✅ After adding files, clear `.next` cache and rebuild

## Verification

After adding files, verify:
1. No 404 errors in browser console
2. Favicon appears in browser tab
3. DevTools → Application → Manifest (all green ✓)

