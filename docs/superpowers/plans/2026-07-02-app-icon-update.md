# PWA & Favicon App Icon Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the app favicon and PWA icons using the new mascot logo, implementing safe-zone padding for PWA maskable icons using a custom matching gradient background.

**Architecture:** A Node.js build-time script processes the downloaded JPEG using `sharp` to output the standard, maskable, and favicon assets, then updates the web application configuration and PWA manifest.

**Tech Stack:** Node.js, sharp, Vite, React, TypeScript

## Global Constraints

- PWA icons must be PNG format and located in the `public/` directory.
- Browser favicon must be a PNG format file named `favicon.png`.
- Maskable PWA icons must include safe-zone padding (~10%) with background matching the source image's gradient.
- The build must succeed (`pnpm build`) and correctly include PWA manifest icons.

---

### Task 1: Create Asset Generation and Verification Scripts

**Files:**
- Create: [scripts/generate-icons.js](file:///home/tie/Projects/knpos/scripts/generate-icons.js)
- Create: [scripts/verify-icons.js](file:///home/tie/Projects/knpos/scripts/verify-icons.js)

**Interfaces:**
- Consumes: [public/new_app_icon_source.jpg](file:///home/tie/Projects/knpos/public/new_app_icon_source.jpg)
- Produces:
  - `public/favicon.png` (32x32 px)
  - `public/pwa-192x192.png` (192x192 px)
  - `public/pwa-512x512.png` (512x512 px)
  - `public/pwa-192x192-maskable.png` (192x192 px, padded with gradient)
  - `public/pwa-512x512-maskable.png` (512x512 px, padded with gradient)

- [ ] **Step 1: Write the asset generation script**
  Create `scripts/generate-icons.js` to resize the source image to the target formats. For maskable icons, scale the source image down to 80% and composite it onto a matching linear gradient background (from `#FEE9B2` on the left to `#FEB1C5` on the right) rendered via SVG.

  Write the file content:
  ```javascript
  import sharp from 'sharp';
  import fs from 'fs';
  import path from 'path';

  const sourcePath = 'public/new_app_icon_source.jpg';

  async function generateGradientBg(width, height) {
    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#FEE9B2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FEB1C5;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
      </svg>
    `;
    return Buffer.from(svg);
  }

  async function run() {
    console.log('Generating app icons from:', sourcePath);

    // 1. Generate Favicon (32x32)
    await sharp(sourcePath)
      .resize(32, 32)
      .toFile('public/favicon.png');
    console.log('Generated favicon.png');

    // 2. Generate PWA 192x192 (any)
    await sharp(sourcePath)
      .resize(192, 192)
      .toFile('public/pwa-192x192.png');
    console.log('Generated pwa-192x192.png');

    // 3. Generate PWA 512x512 (any)
    await sharp(sourcePath)
      .resize(512, 512)
      .toFile('public/pwa-512x512.png');
    console.log('Generated pwa-512x512.png');

    // 4. Generate PWA 192x192 Maskable (padded 80%)
    const padSize192 = Math.round(192 * 0.8); // 154
    const offset192 = Math.round((192 - padSize192) / 2); // 19
    const bgBuffer192 = await generateGradientBg(192, 192);
    const foreground192 = await sharp(sourcePath)
      .resize(padSize192, padSize192)
      .toBuffer();
    await sharp(bgBuffer192)
      .composite([{ input: foreground192, top: offset192, left: offset192 }])
      .toFile('public/pwa-192x192-maskable.png');
    console.log('Generated pwa-192x192-maskable.png');

    // 5. Generate PWA 512x512 Maskable (padded 80%)
    const padSize512 = Math.round(512 * 0.8); // 410
    const offset512 = Math.round((512 - padSize512) / 2); // 51
    const bgBuffer512 = await generateGradientBg(512, 512);
    const foreground512 = await sharp(sourcePath)
      .resize(padSize512, padSize512)
      .toBuffer();
    await sharp(bgBuffer512)
      .composite([{ input: foreground512, top: offset512, left: offset512 }])
      .toFile('public/pwa-512x512-maskable.png');
    console.log('Generated pwa-512x512-maskable.png');

    console.log('All icons generated successfully!');
  }

  run().catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
  ```

- [ ] **Step 2: Write the verification script**
  Create `scripts/verify-icons.js` using `sharp` to check that all generated files exist, are of PNG format, and have the correct dimensions.

  Write the file content:
  ```javascript
  import sharp from 'sharp';
  import fs from 'fs';

  const expectedIcons = [
    { path: 'public/favicon.png', width: 32, height: 32 },
    { path: 'public/pwa-192x192.png', width: 192, height: 192 },
    { path: 'public/pwa-512x512.png', width: 512, height: 512 },
    { path: 'public/pwa-192x192-maskable.png', width: 192, height: 192 },
    { path: 'public/pwa-512x512-maskable.png', width: 512, height: 512 },
  ];

  async function verify() {
    for (const icon of expectedIcons) {
      if (!fs.existsSync(icon.path)) {
        throw new Error(`File not found: ${icon.path}`);
      }
      const meta = await sharp(icon.path).metadata();
      if (meta.format !== 'png') {
        throw new Error(`Expected PNG format for ${icon.path}, got ${meta.format}`);
      }
      if (meta.width !== icon.width || meta.height !== icon.height) {
        throw new Error(`Expected ${icon.width}x${icon.height} for ${icon.path}, got ${meta.width}x${meta.height}`);
      }
      console.log(`Verified: ${icon.path} is correct (${icon.width}x${icon.height} PNG)`);
    }
    console.log('All assets verified successfully!');
  }

  verify().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
  ```

- [ ] **Step 3: Run the asset generation script**
  Run: `node scripts/generate-icons.js`
  Expected: Successful exit and output log confirming the creation of all five icon files.

- [ ] **Step 4: Run the verification script**
  Run: `node scripts/verify-icons.js`
  Expected: Outputs "All assets verified successfully!"

- [ ] **Step 5: Commit task assets**
  Run:
  ```bash
  git add scripts/generate-icons.js scripts/verify-icons.js public/*.png
  git commit -m "feat(assets): generate new app icons and verification script"
  ```

---

### Task 2: Update App Configuration and Build the PWA

**Files:**
- Modify: [index.html](file:///home/tie/Projects/knpos/index.html)
- Modify: [vite.config.ts](file:///home/tie/Projects/knpos/vite.config.ts)

**Interfaces:**
- Consumes: `public/favicon.png` and PWA icon assets
- Produces: Updated HTML index and Vite PWA configuration

- [ ] **Step 1: Update index.html favicon tag**
  Modify line 5 in `index.html` to point to the new `favicon.png`:
  ```html
  <link rel="icon" type="image/png" href="/favicon.png" />
  ```

- [ ] **Step 2: Update vite.config.ts PWA configuration**
  Update `vite.config.ts` to include `favicon.png` and map both `any` and `maskable` versions of the generated PWA icons.

  Target chunk at line 13:
  ```typescript
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Charni POS',
        short_name: 'Charni POS',
        description: 'Progressive Web App Point of Sale',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
  ```

- [ ] **Step 3: Run the verification script again**
  Run: `node scripts/verify-icons.js`
  Expected: Verification passes successfully.

- [ ] **Step 4: Build the production bundle**
  Run: `pnpm build`
  Expected: Successful compilation of typescript and vite build without errors.

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add index.html vite.config.ts
  git commit -m "feat(pwa): configure vite PWA manifest and favicon for new icons"
  ```
