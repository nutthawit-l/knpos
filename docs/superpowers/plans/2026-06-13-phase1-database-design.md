# Phase 1 Database Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Cloudflare D1 and R2, create serverless API endpoints for the product catalog, and create a data seeding script.

**Architecture:** We use Cloudflare Pages Functions (`functions/api/...`) which run on the Edge and natively bind to D1 and R2 configured in `wrangler.toml`. A Node.js script using the `wrangler` CLI will act as the data seeder.

**Tech Stack:** Cloudflare D1, Cloudflare R2, Cloudflare Pages Functions, TypeScript.

---

### Task 1: D1 Database Initialization & Schema

**Files:**
- Create: `schema.sql`
- Modify: `wrangler.toml`

- [ ] **Step 1: Write the failing test (Validation via wrangler)**

Run: `npx wrangler d1 execute charnipos-db --local --command="SELECT * FROM Product;"`
Expected: FAIL (Database not found or table doesn't exist)

- [ ] **Step 2: Write minimal implementation (schema.sql)**

```sql
-- schema.sql
DROP TABLE IF EXISTS Product;
CREATE TABLE Product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tha_price REAL NOT NULL,
    sgp_price REAL,
    idn_price REAL,
    deu_price REAL,
    jpn_price REAL,
    chn_price REAL,
    twn_price REAL,
    kor_price REAL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 3: Update wrangler.toml to bind D1**

Append this to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "charnipos-db"
database_id = "00000000-0000-0000-0000-000000000000" # Placeholder, actual ID will be replaced
```

- [ ] **Step 4: Create and apply local D1 database**

Run: `npx wrangler d1 execute charnipos-db --local --file=./schema.sql`
Expected: PASS (Executes successfully)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx wrangler d1 execute charnipos-db --local --command="SELECT * FROM Product;"`
Expected: PASS (Returns empty result without error)

- [ ] **Step 6: Commit**

```bash
git add schema.sql wrangler.toml
git commit -m "feat: init D1 database schema for Product"
```

### Task 2: R2 Bucket Configuration

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Write the failing test**

Run: `npx wrangler r2 object get charnipos-images/test.txt --local`
Expected: FAIL (Bucket does not exist)

- [ ] **Step 2: Update wrangler.toml to bind R2**

Append this to `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "charnipos-images"
```

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add charnipos-images R2 bucket binding"
```

### Task 3: API Route GET /api/products

**Files:**
- Create: `functions/api/products.ts`

- [ ] **Step 1: Write the failing test**

In a separate terminal, start: `npx wrangler pages dev dist`
Run: `curl -i http://localhost:8788/api/products`
Expected: FAIL (404 Not Found)

- [ ] **Step 2: Write minimal implementation**

```typescript
// functions/api/products.ts
export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM Product ORDER BY created_at DESC"
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `curl -i http://localhost:8788/api/products`
Expected: PASS (200 OK, `[]`)

- [ ] **Step 4: Commit**

```bash
git add functions/api/products.ts
git commit -m "feat: GET /api/products endpoint"
```

### Task 4: API Route POST /api/products

**Files:**
- Modify: `functions/api/products.ts`

- [ ] **Step 1: Write the failing test**

Run: `curl -X POST -F "name=Test" -F "tha_price=100" -F "image_url=https://test.com/img.jpg" http://localhost:8788/api/products`
Expected: FAIL (405 Method Not Allowed)

- [ ] **Step 2: Write minimal implementation**

Append this to `functions/api/products.ts`:

```typescript
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();
    
    // In Phase 1, we expect the CSV seed to happen outside, but for the AddProduct UI (Phase 2), 
    // it will upload a file here. We'll handle the file upload logic in Phase 2.
    // For now, allow direct insertion via API.
    
    const name = formData.get("name") as string;
    const thaPrice = parseFloat(formData.get("tha_price") as string);
    const sgpPrice = formData.get("sgp_price") ? parseFloat(formData.get("sgp_price") as string) : null;
    const idnPrice = formData.get("idn_price") ? parseFloat(formData.get("idn_price") as string) : null;
    const deuPrice = formData.get("deu_price") ? parseFloat(formData.get("deu_price") as string) : null;
    const jpnPrice = formData.get("jpn_price") ? parseFloat(formData.get("jpn_price") as string) : null;
    const chnPrice = formData.get("chn_price") ? parseFloat(formData.get("chn_price") as string) : null;
    const twnPrice = formData.get("twn_price") ? parseFloat(formData.get("twn_price") as string) : null;
    const korPrice = formData.get("kor_price") ? parseFloat(formData.get("kor_price") as string) : null;
    const imageUrl = formData.get("image_url") as string;

    if (!name || isNaN(thaPrice) || !imageUrl) {
        return new Response("Missing required fields", { status: 400 });
    }

    const { success } = await context.env.DB.prepare(
      `INSERT INTO Product (name, tha_price, sgp_price, idn_price, deu_price, jpn_price, chn_price, twn_price, kor_price, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name, thaPrice, sgpPrice, idnPrice, deuPrice, jpnPrice, chnPrice, twnPrice, korPrice, imageUrl
    ).run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), { 
          status: 201,
          headers: { "Content-Type": "application/json" }
      });
    } else {
        return new Response("Database insert failed", { status: 500 });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `curl -X POST -F "name=Test" -F "tha_price=100" -F "image_url=https://test.com/img.jpg" http://localhost:8788/api/products`
Expected: PASS (201 Created)

- [ ] **Step 4: Commit**

```bash
git add functions/api/products.ts
git commit -m "feat: POST /api/products endpoint"
```

### Task 5: Seeding Script

**Files:**
- Create: `scripts/seed.ts`
- Create: `seed/products.csv`

- [ ] **Step 1: Write the failing test**

Run: `npx tsx scripts/seed.ts`
Expected: FAIL (File not found)

- [ ] **Step 2: Create mock CSV file**

```csv
name,tha_price,sgp_price,idn_price,deu_price,jpn_price,chn_price,twn_price,kor_price,image_url
Test Product,100,5,,,,,,,https://example.com/test.jpg
```
Save to `seed/products.csv`

- [ ] **Step 3: Write minimal implementation**

```typescript
// scripts/seed.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const csvPath = path.resolve(process.cwd(), 'seed/products.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim() !== '');

// Skip header
for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 10) continue;

    const [name, tha, sgp, idn, deu, jpn, chn, twn, kor, imgUrl] = cols;
    
    // Construct SQL
    const sql = `INSERT INTO Product (name, tha_price, sgp_price, idn_price, deu_price, jpn_price, chn_price, twn_price, kor_price, image_url) VALUES ('${name}', ${tha}, ${sgp || 'NULL'}, ${idn || 'NULL'}, ${deu || 'NULL'}, ${jpn || 'NULL'}, ${chn || 'NULL'}, ${twn || 'NULL'}, ${kor || 'NULL'}, '${imgUrl.trim()}');`;

    console.log(`Executing: ${sql}`);
    execSync(`npx wrangler d1 execute charnipos-db --local --command="${sql}"`);
}

console.log('Seed completed.');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/seed.ts`
Expected: PASS (Logs Execution and Seed completed, row is added to local DB)

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts seed/products.csv
git commit -m "feat: add CSV seed script for D1"
```
