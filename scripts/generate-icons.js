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
