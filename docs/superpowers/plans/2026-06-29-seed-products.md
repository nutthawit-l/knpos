# Product Seeding Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a TypeScript script `seed/seed-products.ts` that reads the top 15 products from `seed/flyaway-seed.csv` and inserts them into the D1 database (local/remote) while checking and uploading images to R2 selectively.

**Architecture:** A standalone TypeScript script run via `tsx`. It queries existing categories and products to avoid duplicate insertions, verifies object existence in R2 by listing bucket contents first to prevent re-uploading, and executes inserts using temporary SQL files with `wrangler d1 execute`.

**Tech Stack:** TypeScript, tsx, wrangler CLI, Node fs/path/child_process, sharp (image fallback generation).

## Global Constraints
- Target Node/TS execution via `tsx`
- Must bind all products to `shop_id = 1`
- Must only seed top 15 products from `seed/flyaway-seed.csv`
- Must optimize R2 uploads by checking existing R2 keys using single `wrangler r2 object list --json` query

---

### Task 1: Create `seed/seed-products.ts` script

**Files:**
- Create: `seed/seed-products.ts`

**Interfaces:**
- Consumes: `seed/flyaway-seed.csv`
- Produces: None (Executed via CLI command `npx tsx seed/seed-products.ts`)

- [ ] **Step 1: Write the implementation code**

Create `seed/seed-products.ts` with the following content:

```typescript
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

  // 1. Fetch the list of already uploaded images in R2 to avoid re-upload
  console.log(`Checking existing R2 objects in ${envLabel} bucket ${BUCKET_NAME}...`);
  let uploadedKeys: string[] = [];
  try {
    const listOutput = execSync(`npx wrangler r2 object list ${BUCKET_NAME} ${wranglerFlag} --json`, { encoding: 'utf-8' });
    const listJson = JSON.parse(listOutput);
    if (Array.isArray(listJson)) {
      uploadedKeys = listJson.map((obj: any) => obj.key);
    }
  } catch (err) {
    console.warn(`Could not list R2 objects in bucket ${BUCKET_NAME}:`, err);
  }

  // 2. Fetch/Generate mock images and upload if missing in R2
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
    if (uploadedKeys.includes(p.filename)) {
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
  const categoriesJson = JSON.parse(categoriesResult);
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
    const updatedCategoriesJson = JSON.parse(updatedCategoriesResult);
    const updatedCategories: Array<{ id: number; name: string }> = 
      Array.isArray(updatedCategoriesJson) ? (updatedCategoriesJson[0]?.results || []) : (updatedCategoriesJson?.results || []);
    
    updatedCategories.forEach(cat => categoryMap.set(cat.name, cat.id));
  }

  // 4. Query existing products in D1
  console.log(`Querying existing products in ${envLabel} D1 database...`);
  const queryProductsCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id, name FROM product WHERE shop_id = 1" --json`;
  const productsResult = execSync(queryProductsCommand, { encoding: 'utf-8' });
  const productsJson = JSON.parse(productsResult);
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
```

- [ ] **Step 2: Run verification**

Run the TypeScript script using `tsx` directly on the local database and verify that it parses and runs successfully. Note: Make sure the shop with `id = 1` and/or categories already exist (or are empty for the category setup).
Run: `npx tsx seed/seed-products.ts`

- [ ] **Step 3: Commit the script**

```bash
git add seed/seed-products.ts
git commit -m "feat(seed): add seed-products.ts script to seed top 15 products"
```

---

### Task 2: Update `Makefile` and Verify Seeding Targets

**Files:**
- Modify: `Makefile`

**Interfaces:**
- Consumes: `seed/seed-products.ts`
- Produces: `make seed-products`, `make remote-seed-products` commands

- [ ] **Step 1: Modify Makefile**

Update the `seed-products` and `remote-seed-products` targets in `Makefile` (lines 25-29) to point to the new TypeScript script:

```diff
-seed-products:
-    # Read flyaway-seed.csv and add top 15 rows to product table, all products are bind to shop_id=1
+seed-products:
+	npx tsx seed/seed-products.ts

-remote-seed-products:
-    # Read flyaway-seed.csv and add top 15 rows to product table, all products are bind to shop_id=1
+remote-seed-products:
+	npx tsx seed/seed-products.ts --remote
```

- [ ] **Step 2: Run verification command**

Run local migration followed by product seeding, then query D1 to verify the products are present.

1. Reset DB: `make migrate`
2. Since shop `id = 1` must be handled/created:
   Insert shop `id = 1` first:
   `npx wrangler d1 execute charnipos-db --local --command="INSERT INTO shop (id, name) VALUES (1, 'Charni Test Shop')"`
3. Seed products: `make seed-products`
4. Query D1 to verify products and categories:
   `npx wrangler d1 execute charnipos-db --local --command="SELECT COUNT(*), category_id FROM product GROUP BY category_id"`
   Expected: 15 products total, mapped to categories correctly.

- [ ] **Step 3: Commit and push**

```bash
git add Makefile
git commit -m "chore(make): link seed-products and remote-seed-products to TS script"
```
