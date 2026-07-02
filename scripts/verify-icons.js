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
