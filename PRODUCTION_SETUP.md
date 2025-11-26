# Production Setup Guide

## ✅ Completed Setup

### 1. Metadata & SEO
- ✅ Complete metadata configuration in `app/layout.tsx`
- ✅ Open Graph tags for social media
- ✅ Twitter Card tags
- ✅ Theme color configuration
- ✅ Viewport settings

### 2. Favicon & Icons
- ✅ Favicon SVG created (`/public/favicon.svg`)
- ✅ Favicon configuration in layout
- ✅ Apple touch icon configuration
- ✅ Manifest file created

### 3. Logo Integration
- ✅ Logo SVG placeholder created
- ✅ Logo added to Navbar
- ✅ Company name display in header
- ✅ Splash screen with logo

### 4. Splash Screen
- ✅ Professional splash screen component
- ✅ Loading animations
- ✅ Auto-hide on page load

## 📋 Required Actions Before Production

### 1. Replace Logo Files

Replace the placeholder logo files with your actual company logo:

```bash
# Required files to replace:
/public/logo.svg          # Main logo (SVG - recommended)
/public/logo.png          # Main logo (PNG, 80x80px minimum)
/public/logo-dark.png     # Dark mode variant (PNG)
/public/logo-light.png    # Light mode variant (PNG)
```

### 2. Generate Favicon Files

Generate favicon files from your logo:

```bash
# Required favicon files:
/public/favicon.ico              # Multi-size ICO file (16x16, 32x32, 48x48)
/public/favicon-16x16.png        # 16x16 PNG
/public/favicon-32x32.png        # 32x32 PNG
```

**Tools to generate favicons:**
- https://realfavicongenerator.net/
- https://favicon.io/

### 3. Generate Apple & Android Icons

```bash
# Apple icons:
/public/apple-touch-icon.png    # 180x180px

# Android icons:
/public/android-chrome-192x192.png  # 192x192px
/public/android-chrome-512x512.png  # 512x512px
```

### 4. Create OG Image

Create an Open Graph image for social media sharing:

```bash
/public/og-image.png  # 1200x630px recommended
```

**Content should include:**
- Company logo
- System name: "Procurement System"
- Company name
- Professional design matching brand

### 5. Update Company Information

Update the following files with your actual company information:

#### `app/layout.tsx`
- Replace "Your Company Name" with actual company name
- Update `NEXT_PUBLIC_APP_URL` environment variable
- Update metadata descriptions

#### `components/layout/Navbar.tsx`
- Update company name in header

#### `components/ui/SplashScreen.tsx`
- Update company name in splash screen

#### `public/site.webmanifest`
- Update app name and description

### 6. Environment Variables

Create `.env.production` file:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 7. Update robots.txt

Update `public/robots.txt` with your actual domain:

```
Sitemap: https://your-domain.com/sitemap.xml
```

## 🎨 Logo Specifications

### SVG Logo
- Recommended format for all use cases
- Should work in both light and dark modes
- Scalable without quality loss

### PNG Logos
- Minimum size: 80x80px
- Recommended: 256x256px for high DPI displays
- Format: PNG with transparency
- Color profile: sRGB

### Favicon
- Format: ICO (multi-size) or SVG
- Sizes: 16x16, 32x32, 48x48
- Should be recognizable at small sizes

## 📱 Testing Checklist

Before going to production, test:

- [ ] Logo displays correctly in Navbar (desktop & mobile)
- [ ] Favicon appears in browser tab
- [ ] Splash screen shows and hides correctly
- [ ] OG image displays correctly when sharing on social media
- [ ] Apple touch icon works on iOS devices
- [ ] Android icons work on Android devices
- [ ] Page title displays correctly
- [ ] Meta description appears in search results
- [ ] Theme color matches brand

## 🚀 Deployment Checklist

- [ ] All logo files replaced
- [ ] All favicon files generated
- [ ] OG image created
- [ ] Company name updated everywhere
- [ ] Environment variables set
- [ ] robots.txt updated
- [ ] All tests passed
- [ ] Performance optimized
- [ ] SEO verified

## 📝 Notes

- The system uses SVG logos as fallback if PNG files are missing
- Splash screen automatically hides after page load
- All metadata is configured for optimal SEO
- Theme colors match the design system

