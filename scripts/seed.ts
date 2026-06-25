import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import crypto from 'crypto';

// Disable TLS reject unauthorized for local developer testing image downloads
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Check CLI arguments for --remote
const isRemote = process.argv.includes('--remote');
const wranglerFlag = isRemote ? '--remote' : '--local';
const envLabel = isRemote ? 'remote' : 'local';

// Read config from wrangler.toml
const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf-8');
const r2PublicUrlMatch = wranglerConfig.match(/R2_PUBLIC_URL\s*=\s*"([^"]+)"/);
const R2_PUBLIC_URL = isRemote
  ? (r2PublicUrlMatch ? r2PublicUrlMatch[1] : 'https://pub-591d7a44897c44de8e396920cfc7042b.r2.dev')
  : '/api/images';

const bucketNameMatch = wranglerConfig.match(/bucket_name\s*=\s*"([^"]+)"/);
const BUCKET_NAME = bucketNameMatch ? bucketNameMatch[1] : 'charnipos-images';

const tempDir = path.resolve(process.cwd(), 'seed/images');
const csvPath = path.resolve(process.cwd(), 'seed/flyaway-seed.csv');

async function generatePlaceholderImage(filePath: string, text: string, bgColor: string) {
  const svgText = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${bgColor}" />
      <text x="100" y="110" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${text}</text>
    </svg>
  `;

  await sharp(Buffer.from(svgText))
    .png()
    .toFile(filePath);
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.warn(`Could not download image from ${url}:`, err);
    return false;
  }
}

async function run() {
  console.log(`Resetting ${envLabel} D1 database schema...`);
  execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./schema.sql`, { stdio: 'inherit' });

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  console.log(`Reading seed CSV: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  // Parse CSV (Header: image_url,name,thb,sgd)
  const products: Array<{
    originalUrl: string;
    name: string;
    thb: number;
    sgd: number | null;
    filename: string;
  }> = [];

  const bgColors = ['#8D6E63', '#A1887F', '#D7CCC8', '#FFA726', '#FFB74D', '#FFE082', '#A1887F', '#8D6E63'];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 3) continue;

    const originalUrl = cols[0].trim();
    const name = cols[1].trim();
    const thb = parseFloat(cols[2].trim()) || 0;
    const sgd = cols[3] && cols[3].trim() !== '' ? parseFloat(cols[3].trim()) : null;

    const urlParts = originalUrl.split('/');
    const rawFilename = urlParts[urlParts.length - 1] || `image-${i}.jpg`;
    const ext = path.extname(rawFilename) || '.jpg';
    const filename = `seed-${path.basename(rawFilename, ext)}${ext}`;

    products.push({ originalUrl, name, thb, sgd, filename });
  }

  console.log(`Found ${products.length} products to seed.`);

  console.log('Fetching/Generating mock images and uploading to local R2...');
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const filePath = path.join(tempDir, p.filename);
    
    console.log(`[${i+1}/${products.length}] Processing ${p.name}...`);
    if (fs.existsSync(filePath)) {
      console.log(`  -> Image already exists locally at seed/images/${p.filename}, skipping download.`);
    } else {
      const success = await downloadImage(p.originalUrl, filePath);
      if (!success) {
        const bgColor = bgColors[i % bgColors.length];
        console.log(`  -> Downloading failed. Generating fallback placeholder for ${p.name} with color ${bgColor}...`);
        await generatePlaceholderImage(filePath, p.name, bgColor);
      } else {
        console.log(`  -> Downloaded successfully.`);
      }
    }

    console.log(`  -> Uploading to ${envLabel} R2 bucket ${BUCKET_NAME}...`);
    execSync(`npx wrangler r2 object put ${BUCKET_NAME}/${p.filename} ${wranglerFlag} --file=${filePath}`, { stdio: 'inherit' });
  }

  // Generate SQL file for seeding
  console.log('Preparing D1 seed SQL statements...');
  const sqlLines: string[] = [];

  // 0. Seed default shop and user
  const defaultShopId = 1;
  const defaultUserId = 1;
  const defaultShopName = 'Charni Test Shop';
  const defaultEmail = 'test@example.com';
  const defaultPassword = 'password123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(defaultPassword + salt).digest('hex');

  sqlLines.push(
    `INSERT INTO shop (id, name) VALUES (${defaultShopId}, '${defaultShopName}');`
  );
  sqlLines.push(
    `INSERT INTO "user" (id, email, password_hash, password_salt, is_verified) ` +
    `VALUES (${defaultUserId}, '${defaultEmail}', '${hash}', '${salt}', 1);`
  );
  sqlLines.push(
    `INSERT INTO shop_member (shop_id, user_id, role) VALUES (${defaultShopId}, ${defaultUserId}, 'owner');`
  );
  sqlLines.push(
    `INSERT INTO event (id, shop_id, name, country, start_date, end_date, booth_rental, travel, accommodation, food_allowance) ` +
    `VALUES (1, ${defaultShopId}, 'Pop-up Craft Fair 2026', 'Thailand', '2026-03-01', '2026-03-31', 1500, 500, 1000, 200);`
  );
  sqlLines.push(
    `INSERT INTO event_member (event_id, user_id, role) VALUES (1, ${defaultUserId}, 'event_creator');`
  );

  // Seed categories
  const categoriesList = ['Frame card', 'Hat', 'Head band', 'Flower'];
  categoriesList.forEach((catName, index) => {
    const catId = index + 1;
    sqlLines.push(
      `INSERT INTO category (id, shop_id, name) VALUES (${catId}, ${defaultShopId}, '${catName}');`
    );
  });

  // Helper function to map product names/IDs to category IDs and starting stock
  const getProductCategoryAndStock = (pid: number, name: string): { catId: number; stock: number } => {
    const n = name.toLowerCase();
    let catId = 1; // Default to 'Frame card'
    if (n.includes('hat')) catId = 2;
    else if (n.includes('band')) catId = 3;
    else if (n.includes('flower') || n.includes('cherry')) catId = 4;

    let stock = 0;
    if (pid === 1) stock = 24;
    else if (pid === 2) stock = 8;
    else if (pid === 3) stock = 0;
    else if (pid === 4) stock = 42;
    else {
      stock = (pid * 7) % 35;
    }
    return { catId, stock };
  };

  // 1. Insert Products and Prices
  products.forEach((p, idx) => {
    const productId = idx + 1;
    const imageUrl = `${R2_PUBLIC_URL}/${p.filename}`;
    const { catId, stock } = getProductCategoryAndStock(productId, p.name);
    sqlLines.push(
      `INSERT INTO product (id, name, image_url, shop_id, category_id, stock) ` +
      `VALUES (${productId}, '${p.name.replace(/'/g, "''")}', '${imageUrl}', ${defaultShopId}, ${catId}, ${stock});`
    );
    sqlLines.push(
      `INSERT INTO product_price (product_id, currency_code, price) ` +
      `VALUES (${productId}, 'THB', ${p.thb});`
    );
    if (p.sgd !== null) {
      sqlLines.push(
        `INSERT INTO product_price (product_id, currency_code, price) ` +
        `VALUES (${productId}, 'SGD', ${p.sgd});`
      );
    }
  });

  // 2. Insert Transactions
  // We match product IDs which start at 1 up to products.length
  // Note: 
  // ID 1: Frame card resin (THB 220, SGD 15)
  // ID 2: Frame card stand (THB 250, SGD 20)
  // ID 7: Frame card morudoll M (THB 350, SGD 25)
  // ID 9: Cherry S (THB 90, SGD 5)
  // ID 10: Cat head band M (THB 120, SGD 10)
  // ID 11: Cat head band S (THB 90, SGD 5)
  // ID 12: Flower head band (THB 90, SGD 12)
  // ID 14: Doll hat M (THB 200, SGD 12)
  // ID 15: Keyring (THB 150, SGD null)
  // ID 18: Flower S (THB 120, SGD null)
  const transactions = [
    { currency: 'THB', income: 400.0, sold: 3, items: [{ pid: 1, qty: 1, price: 220 }, { pid: 9, qty: 2, price: 90 }] },
    { currency: 'SGD', income: 30.0, sold: 2, items: [{ pid: 2, qty: 1, price: 20 }, { pid: 10, qty: 1, price: 10 }] },
    { currency: 'THB', income: 420.0, sold: 3, items: [{ pid: 15, qty: 2, price: 150 }, { pid: 18, qty: 1, price: 120 }] },
    { currency: 'SGD', income: 36.0, sold: 3, items: [{ pid: 12, qty: 2, price: 12 }, { pid: 14, qty: 1, price: 12 }] },
    { currency: 'THB', income: 530.0, sold: 3, items: [{ pid: 7, qty: 1, price: 350 }, { pid: 11, qty: 2, price: 90 }] },
  ];

  transactions.forEach((tx, idx) => {
    const txId = idx + 1;
    sqlLines.push(
      `INSERT INTO "order" (id, currency_code, total_income, total_product_sold, event_id, created_at) ` +
      `VALUES (${txId}, '${tx.currency}', ${tx.income}, ${tx.sold}, 1, datetime('now'));`
    );
    tx.items.forEach((item) => {
      sqlLines.push(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
        `VALUES (${txId}, ${item.pid}, ${item.qty}, ${item.price});`
      );
    });
  });

  const sqlFile = 'seed_temp.sql';
  fs.writeFileSync(sqlFile, sqlLines.join('\n'));

  console.log(`Executing seed SQL in ${envLabel} D1...`);
  execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${sqlFile}`, { stdio: 'inherit' });

  // Cleanup
  console.log('Cleaning up temporary SQL file...');
  fs.unlinkSync(sqlFile);

  console.log('Seeding completed successfully!');
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
