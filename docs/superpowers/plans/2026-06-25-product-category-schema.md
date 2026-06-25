# Product Category and Stock Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement category and stock tracking by creating a database-driven `category` table, updating products to include `category_id` and `stock`, deducting stock when orders are placed, and integrating these into the onboarding, product forms, and inventory UI using English only.

**Architecture:** A separate `category` table is created in D1 SQLite. Product queries join the `category` table. Stock is stored in the `product` table and decremented via transaction orders. A bulk stock update action is added in `/api/product` for Zustand store synchronization.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand, Cloudflare Pages Functions (D1 Database, R2 Bucket).

## Global Constraints
- Target workspace path: `/home/tie/Projects/knpos`
- DB schema file: `schema.sql`
- Standard seeded categories: `'Frame card'`, `'Hat'`, `'Head band'`, `'Flower'`
- Inventory page must use English only (no Thai translations/text)

---

### Task 1: Database Schema & Seeding Migration

**Files:**
- Modify: [schema.sql](file:///home/tie/Projects/knpos/schema.sql)
- Modify: [scripts/seed.ts](file:///home/tie/Projects/knpos/scripts/seed.ts)

**Interfaces:**
- Consumes: None (initial setup)
- Produces: SQLite tables `category` and updated `product` with test data.

- [ ] **Step 1: Update schema.sql with category table and product category reference**

Modify `schema.sql` to add `category` table and update the `product` table:

```diff
 -- Drop new tables in correct dependency order (children first)
 DROP TABLE IF EXISTS session;
 DROP TABLE IF EXISTS otp_verification;
 DROP TABLE IF EXISTS order_item;
 DROP TABLE IF EXISTS product_price;
 DROP TABLE IF EXISTS event_member;
 DROP TABLE IF EXISTS shop_member;
 DROP TABLE IF EXISTS "order";
+DROP TABLE IF EXISTS product;
+DROP TABLE IF EXISTS category;
 DROP TABLE IF EXISTS event;
 DROP TABLE IF EXISTS "user";
 DROP TABLE IF EXISTS shop;
```

And define `category` table and update `product` table:

```diff
 CREATE TABLE event_member (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     event_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     role TEXT NOT NULL CHECK(role IN ('event_creator', 'shop_owner', 'employee')),
     created_at TEXT DEFAULT (datetime('now', 'localtime')),
     FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
     UNIQUE(event_id, user_id)
 );
 
+CREATE TABLE category (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    shop_id INTEGER NOT NULL,
+    name TEXT NOT NULL,
+    created_at TEXT DEFAULT (datetime('now', 'localtime')),
+    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
+    UNIQUE(shop_id, name)
+);
+
 CREATE TABLE product (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     shop_id INTEGER NOT NULL,
+    category_id INTEGER,
     name TEXT NOT NULL,
     image_url TEXT NOT NULL,
+    stock INTEGER NOT NULL DEFAULT 0,
     created_at TEXT DEFAULT (datetime('now', 'localtime')),
-    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE
+    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
+    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
 );
```

- [ ] **Step 2: Update scripts/seed.ts to insert categories and assign them to seeded products**

Modify `scripts/seed.ts` (around lines 145-168) to seed the category table and link products with `category_id` and initial `stock`:

```typescript
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
```

- [ ] **Step 3: Run database clear and seeding migration script**

Run command:
`npx wrangler d1 execute charnipos-db --local --file=./schema.sql`

Run command:
`npx tsx scripts/seed.ts`

Expected output:
`Seeding completed successfully!`

- [ ] **Step 4: Verify seeded database rows via D1**

Run command:
`npx wrangler d1 execute charnipos-db --local --command="SELECT p.id, p.name, c.name as category_name, p.stock FROM product p LEFT JOIN category c ON p.category_id = c.id LIMIT 5;"`

Expected output:
Should output a table showing product records with category names and stock quantities.

- [ ] **Step 5: Commit changes**

Run command:
`git add schema.sql scripts/seed.ts && git commit -m "feat: update schema and seeding script with categories and stocks"`

---

### Task 2: Rename Transactions API to Transaction API

**Files:**
- Modify: [src/pages/Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)
- Modify: [src/pages/Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
- Move/Rename: [functions/api/transactions.ts](file:///home/tie/Projects/knpos/functions/api/transactions.ts) -> [functions/api/transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts)

**Interfaces:**
- Consumes: `/api/transactions` -> `/api/transaction` endpoint path
- Produces: API backend mapping file renamed, frontends requesting transaction endpoints updated.

- [ ] **Step 1: Rename the Cloudflare Pages Function file**

Run command:
`git mv functions/api/transactions.ts functions/api/transaction.ts`

- [ ] **Step 2: Update Order page API endpoint path**

Modify `src/pages/Order.tsx` to call `/api/transaction` instead of `/api/transactions`:

```diff
-              const response = await fetch('/api/transactions', {
+              const response = await fetch('/api/transaction', {
```

- [ ] **Step 3: Update Transactions page API endpoint path**

Modify `src/pages/Transactions.tsx` to fetch from `/api/transaction` instead of `/api/transactions`:

```diff
-    fetch(`/api/transactions?currency=${selectedCurrency.code}&tzOffset=${tzOffset}`)
+    fetch(`/api/transaction?currency=${selectedCurrency.code}&tzOffset=${tzOffset}`)
```

- [ ] **Step 4: Commit changes**

Run command:
`git add src/pages/Order.tsx src/pages/Transactions.tsx && git commit -m "refactor: rename transactions API to transaction API"`

---

### Task 3: Category and Stock API Endpoints

**Files:**
- Create: [functions/api/category.ts](file:///home/tie/Projects/knpos/functions/api/category.ts)
- Modify: [functions/api/product.ts](file:///home/tie/Projects/knpos/functions/api/product.ts)

**Interfaces:**
- Consumes: Product request metadata (FormData with `category_name`, `stock` or JSON with `{ stocks: Record<number, number> }`)
- Produces: `GET /api/category` returning categories list, updated `GET/POST/PUT /api/product` managing stocks and categories.

- [ ] **Step 1: Implement GET /api/category endpoint**

Create `functions/api/category.ts`:

```typescript
import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await context.env.DB.prepare(
      "SELECT id, name FROM category WHERE shop_id = ? ORDER BY name ASC"
    )
      .bind(shopMember.shop_id)
      .all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Update GET /api/product endpoint to join categories and fetch stock**

In `functions/api/product.ts`, update `onRequestGet` SQL query to select category names, IDs, and stock:

```typescript
    const { results } = await context.env.DB.prepare(`
      SELECT
        p.id,
        p.name,
        p.image_url,
        p.created_at,
        p.shop_id,
        p.stock,
        c.id AS category_id,
        c.name AS category_name,
        pp.currency_code,
        pp.price
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN product_price pp ON p.id = pp.product_id
      WHERE p.shop_id = ?
      ORDER BY p.created_at DESC
    `).bind(shopMember.shop_id).all();

    const productMap = new Map<number, any>();
    for (const row of results) {
      const id = row.id as number;
      if (!productMap.has(id)) {
        productMap.set(id, {
          id,
          name: row.name,
          image_url: row.image_url,
          created_at: row.created_at,
          shop_id: row.shop_id,
          stock: row.stock,
          category_id: row.category_id,
          category_name: row.category_name,
          prices: {}
        });
      }
      if (row.currency_code) {
        productMap.get(id).prices[row.currency_code as string] = row.price;
      }
    }
```

- [ ] **Step 3: Update POST /api/product to support category lookup/creation and stock input**

In `functions/api/product.ts`, modify `onRequestPost` (around lines 184-230) to handle `category_name` and `stock`:

```typescript
    const formData = await context.request.formData();

    const name = formData.get('name') as string;
    const pricesStr = formData.get('prices') as string;
    const imageFile = formData.get('image') as unknown as File;
    const categoryName = formData.get('category_name') as string;
    const stockVal = formData.get('stock') as string;
    const stock = stockVal ? parseInt(stockVal, 10) : 0;

    if (!name || !imageFile || !imageFile.name) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Determine category_id by finding or creating the category
    let categoryId: number | null = null;
    if (categoryName && categoryName.trim()) {
      const trimmedCat = categoryName.trim();
      const existingCat = await context.env.DB.prepare(
        "SELECT id FROM category WHERE name = ? AND shop_id = ?"
      )
        .bind(trimmedCat, shopMember.shop_id)
        .first<{ id: number }>();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const createCatRes = await context.env.DB.prepare(
          "INSERT INTO category (name, shop_id) VALUES (?, ?)"
        )
          .bind(trimmedCat, shopMember.shop_id)
          .run();
        categoryId = createCatRes.meta.last_row_id;
      }
    }

    // ... handle prices and image uploading ...

    const productInsert = context.env.DB.prepare(
      `INSERT INTO product (name, image_url, shop_id, category_id, stock) VALUES (?, ?, ?, ?, ?)`
    ).bind(name, imageUrl, shopMember.shop_id, categoryId, stock);
```

- [ ] **Step 4: Update PUT /api/product to support category lookup/creation and stock update**

In `functions/api/product.ts`, modify `onRequestPut` to support updating `category_name` and `stock`, AND to support `application/json` Content-Type for bulk stock updates:

```typescript
    const contentType = context.request.headers.get("Content-Type") || "";

    // If it's a bulk stock update (JSON)
    if (contentType.includes("application/json")) {
      const body = await context.request.json() as { stocks: Record<number, number> };
      if (!body || !body.stocks) {
        return new Response('Missing stocks data', { status: 400 });
      }

      const updates = Object.entries(body.stocks).map(([idStr, stockAmt]) => {
        const prodId = parseInt(idStr, 10);
        return context.env.DB.prepare(
          "UPDATE product SET stock = ? WHERE id = ? AND shop_id = ?"
        ).bind(stockAmt, prodId, shopMember.shop_id);
      });

      const batchRes = await context.env.DB.batch(updates);
      const ok = batchRes.every((r) => r.success);
      return new Response(JSON.stringify({ success: ok }), {
        status: ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Else if it's the standard product edit Form (multipart/form-data)
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product ID' }), { status: 400 });
    }
    const productId = parseInt(id);

    // Verify product belongs to user's shop
    const productRecord = await context.env.DB.prepare(
      "SELECT shop_id FROM product WHERE id = ?"
    )
      .bind(productId)
      .first<{ shop_id: number }>();

    if (!productRecord || productRecord.shop_id !== shopMember.shop_id) {
      return new Response(JSON.stringify({ error: 'Product not found or unauthorized' }), { status: 404 });
    }

    const formData = await context.request.formData();
    const name = formData.get('name') as string;
    const pricesStr = formData.get('prices') as string;
    const categoryName = formData.get('category_name') as string;
    const stockVal = formData.get('stock') as string;
    const stock = stockVal ? parseInt(stockVal, 10) : 0;

    if (!name) {
      return new Response('Missing required fields', { status: 400 });
    }

    let categoryId: number | null = null;
    if (categoryName && categoryName.trim()) {
      const trimmedCat = categoryName.trim();
      const existingCat = await context.env.DB.prepare(
        "SELECT id FROM category WHERE name = ? AND shop_id = ?"
      )
        .bind(trimmedCat, shopMember.shop_id)
        .first<{ id: number }>();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const createCatRes = await context.env.DB.prepare(
          "INSERT INTO category (name, shop_id) VALUES (?, ?)"
        )
          .bind(trimmedCat, shopMember.shop_id)
          .run();
        categoryId = createCatRes.meta.last_row_id;
      }
    }

    // ... handle prices and image uploading ...

    const updateProduct = context.env.DB.prepare(
      `UPDATE product SET name = ?, image_url = ?, category_id = ?, stock = ? WHERE id = ? AND shop_id = ?`
    ).bind(name, imageUrl, categoryId, stock, productId, shopMember.shop_id);
```

- [ ] **Step 5: Commit changes**

Run command:
`git add functions/api/category.ts functions/api/product.ts && git commit -m "feat: implement category API and update product API for categories and stock"`

---

### Task 4: Transaction Stock Deduction API

**Files:**
- Modify: [functions/api/transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts)

**Interfaces:**
- Consumes: Quantity sold for each item during checkout.
- Produces: Decrements product stock in database.

- [ ] **Step 1: Add stock deduction to order batch execution**

In `functions/api/transaction.ts`, around lines 135-145, append the stock deduction update statement for each order item:

```typescript
    const itemStatements = items.map((item) =>
      context.env.DB.prepare(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) 
         VALUES ((SELECT MAX(id) FROM "order"), ?, ?, ?)`
      ).bind(item.product_id, item.quantity, item.price_per_unit)
    );

    // Add stock deduction updates
    const stockDeductionStatements = items.map((item) =>
      context.env.DB.prepare(
        `UPDATE product SET stock = MAX(0, stock - ?) WHERE id = ?`
      ).bind(item.quantity, item.product_id)
    );

    const batchResult = await context.env.DB.batch([insertTx, ...itemStatements, ...stockDeductionStatements]);
```

- [ ] **Step 2: Commit changes**

Run command:
`git add functions/api/transaction.ts && git commit -m "feat: deduct product stock when saving transactions"`

---

### Task 5: Frontend Zustand Store Stock Integration

**Files:**
- Modify: [src/store/useInventoryStore.ts](file:///home/tie/Projects/knpos/src/store/useInventoryStore.ts)

**Interfaces:**
- Consumes: Updated database product lists containing initial stocks.
- Produces: Zustand actions to manage local stock changes, check `hasStockChanges`, and save modifications via PUT request.

- [ ] **Step 1: Extend Zustand Store state and actions**

Modify `src/store/useInventoryStore.ts` to manage both `stocks` (current local) and `originalStocks` (originally fetched):

```typescript
import { create } from 'zustand';

interface InventoryState {
  shopId: number | null;
  fetchShopId: (userId?: number) => Promise<void>;
  setShopId: (shopId: number | null) => void;
  firstProductId: number | null;
  stocks: Record<number, number>; // productId -> local quantity
  originalStocks: Record<number, number>; // productId -> db quantity
  setStock: (productId: number, stock: number) => void;
  incrementStock: (productId: number) => void;
  decrementStock: (productId: number) => void;
  initializeStocks: (products: Array<{ id: number; stock: number }>) => void;
  saveStockChanges: () => Promise<boolean>;
  hasStockChanges: () => boolean;
  hasFirstProduct: boolean;
  checkFirstProduct: () => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  stocks: {},
  originalStocks: {},
  hasFirstProduct: false,
  shopId: null,
  firstProductId: null,
  fetchShopId: async (userId) => {
    fetch(`/api/shop?user_id=${userId}&limit=1&fields=id`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exists) {
          set({ shopId: data.shop_id });
        }
      })
      .catch((err) => console.error('Failed to query shop member:', err));
  },
  setShopId: (shopId) => set({ shopId }),
  checkFirstProduct: async () => {
    try {
      const res = await fetch('/api/product');
      if (res.ok) {
        const data = await res.json();
        const has = Array.isArray(data) && data.length > 0;
        set({ hasFirstProduct: has });
        return has;
      }
    } catch (err) {
      console.error('Failed to check product:', err);
    }
    return false;
  },
  setStock: (productId, stock) =>
    set((state) => ({
      stocks: { ...state.stocks, [productId]: Math.max(0, stock) },
    })),
  incrementStock: (productId) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productId]: (state.stocks[productId] !== undefined ? state.stocks[productId] : 0) + 1,
      },
    })),
  decrementStock: (productId) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productId]: Math.max(0, (state.stocks[productId] !== undefined ? state.stocks[productId] : 0) - 1),
      },
    })),
  initializeStocks: (products) =>
    set(() => {
      const newStocks: Record<number, number> = {};
      const originalStocks: Record<number, number> = {};
      products.forEach((p) => {
        newStocks[p.id] = p.stock;
        originalStocks[p.id] = p.stock;
      });
      return { stocks: newStocks, originalStocks };
    }),
  hasStockChanges: () => {
    const { stocks, originalStocks } = get();
    return Object.keys(stocks).some(
      (id) => stocks[Number(id)] !== originalStocks[Number(id)]
    );
  },
  saveStockChanges: async () => {
    const { stocks, originalStocks } = get();
    const modifiedStocks: Record<number, number> = {};
    Object.keys(stocks).forEach((idStr) => {
      const id = Number(idStr);
      if (stocks[id] !== originalStocks[id]) {
        modifiedStocks[id] = stocks[id];
      }
    });

    if (Object.keys(modifiedStocks).length === 0) return true;

    try {
      const res = await fetch('/api/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: modifiedStocks }),
      });
      if (res.ok) {
        set((state) => ({
          originalStocks: { ...state.originalStocks, ...modifiedStocks },
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to save stocks:', err);
    }
    return false;
  },
}));
```

- [ ] **Step 2: Commit changes**

Run command:
`git add src/store/useInventoryStore.ts && git commit -m "feat: integrate db stocks and bulk saving in useInventoryStore"`

---

### Task 6: Onboarding Page (Add First Product) Category & Stock Integration

**Files:**
- Modify: [src/pages/AddFirstProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddFirstProduct.tsx)

**Interfaces:**
- Consumes: User Category and Stock inputs.
- Produces: POST payload containing `category_name` and `stock` fields.

- [ ] **Step 1: Add category and stock form inputs in AddFirstProduct**

In `src/pages/AddFirstProduct.tsx`, update component state and form inputs:

```diff
   const [name, setName] = useState('');
   const [prices, setPrices] = useState<Record<string, string>>({});
   const [isLoading, setIsLoading] = useState(false);
+  const [categoryName, setCategoryName] = useState('');
+  const [stock, setStock] = useState('0');
```

Validate input fields inside `handleSave`:

```diff
     if (!name.trim()) {
       alert('Product Name is required.');
       return;
     }
+    if (!categoryName.trim()) {
+      alert('Category is required.');
+      return;
+    }
+    if (stock.trim() === '' || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
+      alert('Stock Quantity must be a valid non-negative number.');
+      return;
+    }
```

Include these fields in the `formData` request:

```diff
       const formData = new FormData();
       formData.append('name', name.trim());
+      formData.append('category_name', categoryName.trim());
+      formData.append('stock', parseInt(stock, 10).toString());
       formData.append('image', imageFile);
```

Add layout markup for Category input and Stock Quantity input:

```typescript
            {/* Product Name */}
            <TextInput
              id="product_name"
              label="Product Name"
              placeholder="e.g., Frame card fuffy"
              value={name}
              onChange={setName}
              required
            />

            {/* Product Category (Onboarding Text Entry) */}
            <TextInput
              id="category_name"
              label="Category"
              placeholder="e.g., Frame card"
              value={categoryName}
              onChange={setCategoryName}
              required
            />

            {/* Stock Quantity */}
            <TextInput
              id="stock_quantity"
              label="Stock Quantity"
              placeholder="0"
              value={stock}
              onChange={setStock}
              type="number"
              required
            />
```

*Note: Ensure [src/components/TextInput.tsx](file:///home/tie/Projects/knpos/src/components/TextInput.tsx) supports passing `type="number"` (forwarding `type` attribute to `<input>`). Let's make sure it does or handle it appropriately.*

- [ ] **Step 2: Commit changes**

Run command:
`git add src/pages/AddFirstProduct.tsx && git commit -m "feat: add category and stock inputs to onboarding add first product page"`

---

### Task 7: Add/Edit Product Page Category & Stock Integration

**Files:**
- Modify: [src/pages/AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx)

**Interfaces:**
- Consumes: Fetched list from `/api/category`.
- Produces: Submits `category_name` and `stock` fields during creation or update.

- [ ] **Step 1: Modify AddProduct.tsx to fetch real categories and include stock**

Update state and effects to load categories from `/api/category`, and initialize stock input from product metadata:

```typescript
  // Local UI categories loaded from API
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stock, setStock] = useState<string>(
    productToEdit && 'stock' in productToEdit ? String((productToEdit as any).stock) : '0'
  );

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const names = data.map((c) => c.name);
          setCategories(names);
          if (productToEdit && 'category_name' in productToEdit && (productToEdit as any).category_name) {
            setSelectedCategory((productToEdit as any).category_name);
          } else if (names.length > 0) {
            setSelectedCategory(names[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, [productToEdit]);
```

Validate and append fields in `handleSave`:

```typescript
    if (!name.trim()) {
      alert('Product Name is required.');
      return;
    }
    if (!selectedCategory) {
      alert('Category selection is required.');
      return;
    }
    if (stock.trim() === '' || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      alert('Stock Quantity must be a valid non-negative number.');
      return;
    }
```

And update the `formData`:

```typescript
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category_name', selectedCategory.trim());
      formData.append('stock', parseInt(stock, 10).toString());
```

Render the Stock Quantity input field:

```typescript
            {/* Category selection */}
            ...
            
            {/* Stock Quantity */}
            <FormInput
              id="stock_quantity"
              label="Stock Quantity"
              placeholder="0"
              value={stock}
              onChange={setStock}
              type="number"
              required
            />
```

*Note: Ensure [src/components/FormInput.tsx](file:///home/tie/Projects/knpos/src/components/FormInput.tsx) supports passing `type="number"` (forwarding it to internal `<input>`).*

- [ ] **Step 2: Commit changes**

Run command:
`git add src/pages/AddProduct.tsx && git commit -m "feat: integrate database categories and stock input in AddProduct page"`

---

### Task 8: Inventory Page Real Category & Stock Integration

**Files:**
- Modify: [src/pages/Inventory.tsx](file:///home/tie/Projects/knpos/src/pages/Inventory.tsx)

**Interfaces:**
- Consumes: Zustand store states (`stocks`, `hasStockChanges`, `saveStockChanges`), backend API category and product data.
- Produces: Interactive categories filter tab list, stock indicators, and floating save changes toolbar.

- [ ] **Step 1: Fetch and display categories dynamically; implement save bar**

Modify `src/pages/Inventory.tsx` to pull real categories and handle saving:

```typescript
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isSavingStock, setIsSavingStock] = useState(false);

  const { stocks, incrementStock, decrementStock, initializeStocks, hasStockChanges, saveStockChanges } = useInventoryStore();

  useEffect(() => {
    // Load categories
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(['All', ...data.map((c) => c.name)]);
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err));

    // Load products
    fetch('/api/product')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          initializeStocks(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setIsLoading(false);
      });
  }, [initializeStocks]);

  const handleSaveStock = async () => {
    setIsSavingStock(true);
    const success = await saveStockChanges();
    setIsSavingStock(false);
    if (success) {
      alert('Stock changes saved successfully.');
    } else {
      alert('Failed to save stock changes.');
    }
  };
```

Update SKU prefix logic and list filters using database metadata:

```typescript
  const getProductSku = (id: number, category: string): string => {
    let prefix = 'GEN';
    if (category === 'Frame card') prefix = 'FRM';
    else if (category === 'Hat') prefix = 'HAT';
    else if (category === 'Head band') prefix = 'BD';
    else if (category === 'Flower') prefix = 'FLW';
    return `${prefix}-${String(id).padStart(3, '0')}`;
  };

  const filteredProducts = products.filter((product) => {
    const category = (product as any).category_name || 'General';
    const sku = getProductSku(product.id, category);
    
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
```

Translate text UI elements into English (no Thai translations):

```diff
-              placeholder="ค้นหาสินค้าหรือ SKU..."
+              placeholder="Search products or SKU..."
```

And display product details:

```typescript
                const category = (product as any).category_name || 'General';
                const sku = getProductSku(product.id, category);
                const stock = stocks[product.id] !== undefined ? stocks[product.id] : 0;

                let dotColorClass = 'bg-[#FF8A80]'; // Out of stock
                if (stock >= 10) {
                  dotColorClass = 'bg-emerald-400'; // High stock
                } else if (stock > 0) {
                  dotColorClass = 'bg-amber-400'; // Low stock
                }

                return (
                  // ... product card row container ...
                        <div className="flex-grow min-w-0">
                          <h3 className="font-bold text-[14px] text-text-brown truncate">
                            {product.name}
                          </h3>
                          <p className="text-[12px] text-outline-variant-warm font-medium mb-1">
                            SKU: {sku} • {category}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`}></span>
                            <span className="text-[12px] text-[#504447] font-medium">
                              Stock:{' '}
                              <span
                                className={`font-bold ${
                                  stock === 0 ? 'text-[#FF8A80]' : 'text-[#805062]'
                                }`}
                              >
                                {stock}
                              </span>
                            </span>
                          </div>
                        </div>
```

Render floating Save changes bar at the bottom:

```typescript
      {/* Floating Save Stock Changes bar */}
      {hasStockChanges() && (
        <div className="absolute bottom-20 left-0 right-0 px-6 z-50">
          <div className="bg-white/80 backdrop-blur-md border border-[#eae0e1] px-5 py-4 rounded-3xl shadow-xl flex items-center justify-between">
            <span className="text-[13px] font-bold text-text-brown">Unsaved stock changes</span>
            <button
              onClick={handleSaveStock}
              disabled={isSavingStock}
              className="bg-brand-pink text-text-brown font-bold text-[12px] px-5 py-2.5 rounded-full hover:bg-brand-pink-hover active:scale-95 transition-all shadow-sm border-none cursor-pointer disabled:opacity-50"
            >
              {isSavingStock ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 2: Commit changes**

Run command:
`git add src/pages/Inventory.tsx && git commit -m "feat: complete inventory page category filtering, stock updates and save action"`
