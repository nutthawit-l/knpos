import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

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

function parseWranglerJson(output: string): unknown {
  const startIndex = output.indexOf('[');
  const startObject = output.indexOf('{');
  
  let index = -1;
  if (startIndex !== -1 && startObject !== -1) {
    index = Math.min(startIndex, startObject);
  } else if (startIndex !== -1) {
    index = startIndex;
  } else if (startObject !== -1) {
    index = startObject;
  }

  if (index === -1) {
    throw new Error(`Could not find start of JSON in output: ${output}`);
  }

  const jsonStr = output.substring(index).trim();
  return JSON.parse(jsonStr);
}

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
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log(`Reading seed CSV: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  // Parse CSV (Header: image_url,name,category,thb,sgd)
  const products: Array<{
    originalUrl: string;
    name: string;
    category: string;
    thb: number;
    sgd: number | null;
    filename: string;
  }> = [];

  const bgColors = ['#8D6E63', '#A1887F', '#D7CCC8', '#FFA726', '#FFB74D', '#FFE082', '#A1887F', '#8D6E63'];

  // Slice first 15 products (index 1 to 15, since index 0 is header)
  const limit = Math.min(lines.length, 16);
  for (let i = 1; i < limit; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 4) continue;

    const originalUrl = cols[0].trim();
    const name = cols[1].trim();
    const category = cols[2].trim();
    const thb = parseFloat(cols[3].trim()) || 0;
    const sgd = cols[4] && cols[4].trim() !== '' ? parseFloat(cols[4].trim()) : null;

    const urlParts = originalUrl.split('/');
    const rawFilename = urlParts[urlParts.length - 1] || `image-${i}.jpg`;
    const ext = path.extname(rawFilename) || '.jpg';
    const filename = `seed-${path.basename(rawFilename, ext)}${ext}`;

    products.push({ originalUrl, name, category, thb, sgd, filename });
  }

  console.log(`Found ${products.length} products to seed.`);

  // 1. Fetch/Generate mock images and upload if missing in R2
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const filePath = path.join(tempDir, p.filename);
    
    // Ensure image is present locally
    if (fs.existsSync(filePath)) {
      console.log(`  -> Image already exists locally at seed/images/${p.filename}`);
    } else {
      console.log(`[${i+1}/${products.length}] Fetching ${p.name}...`);
      const success = await downloadImage(p.originalUrl, filePath);
      if (!success) {
        const bgColor = bgColors[i % bgColors.length];
        console.log(`  -> Downloading failed. Generating fallback placeholder for ${p.name} with color ${bgColor}...`);
        await generatePlaceholderImage(filePath, p.name, bgColor);
      } else {
        console.log(`  -> Downloaded successfully.`);
      }
    }

    // Check if uploaded to R2
    console.log(`Checking if image ${p.filename} already exists in ${envLabel} R2...`);
    let existsInR2 = false;
    const tempCheckPath = path.join(tempDir, `.check-${p.filename}`);
    try {
      execSync(`npx wrangler r2 object get ${BUCKET_NAME}/${p.filename} ${wranglerFlag} --file=${tempCheckPath}`, { stdio: 'ignore' });
      existsInR2 = true;
      if (fs.existsSync(tempCheckPath)) {
        fs.unlinkSync(tempCheckPath);
      }
    } catch {
      // Ignored
    }

    if (existsInR2) {
      console.log(`  -> Image ${p.filename} already exists in ${envLabel} R2, skipping upload.`);
    } else {
      console.log(`  -> Uploading ${p.filename} to ${envLabel} R2...`);
      execSync(`npx wrangler r2 object put ${BUCKET_NAME}/${p.filename} ${wranglerFlag} --file=${filePath}`, { stdio: 'inherit' });
    }
  }

  // 3. Setup categories in D1
  console.log(`Querying categories in ${envLabel} D1 database...`);
  const queryCategoriesCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id, name FROM category WHERE shop_id = 1" --json`;
  const categoriesResult = execSync(queryCategoriesCommand, { encoding: 'utf-8' });
  const categoriesJson = parseWranglerJson(categoriesResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const existingCategories: Array<{ id: number; name: string }> = 
    Array.isArray(categoriesJson) ? (categoriesJson[0]?.results || []) : (categoriesJson?.results || []);

  const categoryMap = new Map<string, number>();
  existingCategories.forEach(cat => categoryMap.set(cat.name, cat.id));

  const sqlLines: string[] = [];

  // Determine unique categories from CSV that don't exist in DB
  const csvCategories = Array.from(new Set(products.map(p => p.category)));
  const missingCategories = csvCategories.filter(cat => !categoryMap.has(cat));

  if (missingCategories.length > 0 && existingCategories.length === 0) {
    console.log(`Category table is empty. Inserting missing categories: ${missingCategories.join(', ')}`);
    missingCategories.forEach(catName => {
      sqlLines.push(`INSERT INTO category (shop_id, name) VALUES (1, '${catName.replace(/'/g, "''")}');`);
    });
  }

  // Write temporary SQL script to insert categories if there are any
  if (sqlLines.length > 0) {
    const tempSqlFile = 'cat_temp.sql';
    fs.writeFileSync(tempSqlFile, sqlLines.join('\n'));
    execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
    fs.unlinkSync(tempSqlFile);

    // Re-query categories to get correct IDs
    const updatedCategoriesResult = execSync(queryCategoriesCommand, { encoding: 'utf-8' });
    const updatedCategoriesJson = parseWranglerJson(updatedCategoriesResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
    const updatedCategories: Array<{ id: number; name: string }> = 
      Array.isArray(updatedCategoriesJson) ? (updatedCategoriesJson[0]?.results || []) : (updatedCategoriesJson?.results || []);
    
    updatedCategories.forEach(cat => categoryMap.set(cat.name, cat.id));
  }

  // 4. Query existing products in D1
  console.log(`Querying existing products in ${envLabel} D1 database...`);
  const queryProductsCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id, name FROM product WHERE shop_id = 1" --json`;
  const productsResult = execSync(queryProductsCommand, { encoding: 'utf-8' });
  const productsJson = parseWranglerJson(productsResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const existingProductsList: Array<{ id: number; name: string }> = 
    Array.isArray(productsJson) ? (productsJson[0]?.results || []) : (productsJson?.results || []);

  const existingProductsSet = new Set(existingProductsList.map(p => p.name));

  // 5. Generate and execute product seeding SQL statements
  const productSqlLines: string[] = [];

  products.forEach((p) => {
    const imageUrl = `${R2_PUBLIC_URL}/${p.filename}`;
    const categoryId = categoryMap.get(p.category) || null;

    if (existingProductsSet.has(p.name)) {
      console.log(`  -> Product "${p.name}" already exists, skipping insertion.`);
    } else {
      console.log(`  -> Preparing SQL to insert product "${p.name}"`);
      const catVal = categoryId !== null ? categoryId : 'NULL';
      productSqlLines.push(
        `INSERT INTO product (name, image_url, shop_id, category_id, stock) ` +
        `VALUES ('${p.name.replace(/'/g, "''")}', '${imageUrl}', 1, ${catVal}, 10);`
      );
    }

    // Always ensure prices are correct (insert or replace)
    productSqlLines.push(
      `INSERT OR REPLACE INTO product_price (product_id, currency_code, price) ` +
      `VALUES ((SELECT id FROM product WHERE name = '${p.name.replace(/'/g, "''")}' AND shop_id = 1), 'THB', ${p.thb});`
    );
    if (p.sgd !== null) {
      productSqlLines.push(
        `INSERT OR REPLACE INTO product_price (product_id, currency_code, price) ` +
        `VALUES ((SELECT id FROM product WHERE name = '${p.name.replace(/'/g, "''")}' AND shop_id = 1), 'SGD', ${p.sgd});`
      );
    }
  });

  if (productSqlLines.length > 0) {
    const tempSqlFile = 'prod_temp.sql';
    fs.writeFileSync(tempSqlFile, productSqlLines.join('\n'));
    console.log(`Executing product and price seed SQL in ${envLabel} D1...`);
    execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
    fs.unlinkSync(tempSqlFile);
  }

  console.log('Seeding completed successfully!');
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
