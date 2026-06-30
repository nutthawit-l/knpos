# Design Spec: Product Seeding Tool

A utility script to seed the first 15 products from `seed/flyaway-seed.csv` into the local or remote D1 database and upload their images to R2.

## Context and Scope
The current system seeds the entire product catalog via `scripts/seed.ts`, which also drops and rebuilds the whole schema. The new target `seed-products.ts` will selectively seed only the first 15 products and their prices without deleting existing products, making it suitable for running directly after database migrations.

## Goals
1. Read the top 15 products from `seed/flyaway-seed.csv`.
2. Map products to their categories. If categories do not exist, create them dynamically.
3. Optimize R2 uploads by checking if the product images already exist in the bucket.
4. Insert/update products and their corresponding THB and SGD prices.
5. Update `Makefile` to integrate the script into the `seed-products` and `remote-seed-products` targets.

## Proposed Design

### 1. Script Architecture (`seed/seed-products.ts`)

- **Environment & Flags:**
  - Accepts a `--remote` CLI flag.
  - Determines the Wrangler flag (`--local` vs `--remote`).
  - Reads configuration (R2 public URL, bucket name) from `wrangler.toml`.

- **Wrangler R2 Image Sync Optimization:**
  - Run `npx wrangler r2 object list <bucket_name> <wranglerFlag> --json` at the start to fetch all existing object keys.
  - For each product:
    - If its image doesn't exist locally in `seed/images`, download it from the CSV URL (or fallback to an SVG placeholder if download fails).
    - If the image key does not exist in the fetched R2 object list, upload it using `npx wrangler r2 object put`. Otherwise, skip the upload.

- **Database Insertion (via `npx wrangler d1 execute`):**
  1. **Categories Setup:**
     - Query categories for `shop_id = 1`: `SELECT id, name FROM category WHERE shop_id = 1`.
     - If the category table is empty:
       - Extract all unique category names from the first 15 CSV rows.
       - Insert these categories into the database.
       - Re-query categories to map category names to their new auto-incremented database IDs.
     - Otherwise, map the product category names to existing database category IDs.
  2. **Products & Prices Insertion:**
     - Query existing products for `shop_id = 1`: `SELECT id, name FROM product WHERE shop_id = 1`.
     - For each product:
       - If the product name already exists, skip inserting it to avoid duplication.
       - Otherwise, insert the product: `INSERT INTO product (name, image_url, shop_id, category_id, stock) VALUES (?, ?, 1, ?, 10)` (starting stock defaults to 10).
       - Insert product prices: `INSERT OR REPLACE INTO product_price (product_id, currency_code, price) VALUES (?, ?, ?)`.

### 2. Makefile Integration

Modify the following targets in `Makefile` to execute the TypeScript script:

```makefile
seed-products:
	npx tsx seed/seed-products.ts

remote-seed-products:
	npx tsx seed/seed-products.ts --remote
```

## Verification Plan

### Manual Verification
1. Run `make migrate` to reset local database.
2. Run `make seed-products` to populate the top 15 products.
3. Verify that:
   - Category names are inserted.
   - Products are inserted with stock = 10 and linked to `shop_id = 1`.
   - Prices in both THB and SGD are set correctly.
   - Images are downloaded and uploaded to local R2.
4. Run `make seed-products` a second time:
   - Verify that no duplicate products are created, and no images are re-uploaded.
5. Run `make remote-seed-products` to verify the same flow on the remote D1 and R2 environments.
