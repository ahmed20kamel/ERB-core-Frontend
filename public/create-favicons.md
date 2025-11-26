# Create Favicon Files

To create the required favicon files from the logo, use one of these methods:

## Method 1: Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload `logo-light.png` or `LITE.png`
3. Configure settings:
   - iOS: 180x180px
   - Android: 192x192px and 512x512px
   - Windows: 16x16, 32x32, 48x48
4. Download and extract all files to `/public` folder

## Method 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then run:
cd frontend/public

# Create favicon sizes from logo-light.png
magick logo-light.png -resize 16x16 favicon-16x16.png
magick logo-light.png -resize 32x32 favicon-32x32.png
magick logo-light.png -resize 48x48 favicon-48x48.png

# Create apple touch icon
magick logo-light.png -resize 180x180 apple-touch-icon.png

# Create Android icons
magick logo-light.png -resize 192x192 android-chrome-192x192.png
magick logo-light.png -resize 512x512 android-chrome-512x512.png

# Create favicon.ico (multi-size)
magick logo-light.png -define icon:auto-resize=16,32,48 favicon.ico
```

## Method 3: Using Python (PIL/Pillow)
```python
from PIL import Image

logo = Image.open('logo-light.png')

# Create favicon sizes
sizes = [16, 32, 48]
for size in sizes:
    resized = logo.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(f'favicon-{size}x{size}.png')

# Create apple touch icon
apple = logo.resize((180, 180), Image.Resampling.LANCZOS)
apple.save('apple-touch-icon.png')

# Create Android icons
android_192 = logo.resize((192, 192), Image.Resampling.LANCZOS)
android_192.save('android-chrome-192x192.png')

android_512 = logo.resize((512, 512), Image.Resampling.LANCZOS)
android_512.save('android-chrome-512x512.png')
```

## Required Files After Generation:
- favicon.ico (multi-size: 16x16, 32x32, 48x48)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png

