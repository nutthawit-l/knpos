# Product Category and Stock Management Design Spec

This specification details the changes required to implement product category management and inventory stock tracking in the KN POS application.

## 1. Database Schema Changes

We will introduce a normalized database structure to manage categories and store the inventory stock for each product.

### Category Table
A new `category` table will be created to store categories for each shop:

```sql
CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    UNIQUE(shop_id, name)
);
```

### Product Table Update
The `product` table will be updated to link to the `category` table and store current stock levels:

```sql
CREATE TABLE product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);
```

## 2. Seeding Updates (`scripts/seed.ts`)

We will update the seed script to:
1. Create the default categories for the shop: `'Frame card'`, `'Hat'`, `'Head band'`, `'Flower'`.
2. Map each seeded product to one of these categories based on its product ID or name.
3. Seed initial stock values:
   * Product ID 1 (Frame card resin): 24
   * Product ID 2 (Frame card stand): 8
   * Product ID 3 (Frame card morudoll S): 0
   * Product ID 4 (Frame card morudoll M): 42
   * Other products: deterministic formula `(id * 7) % 35` to match existing UI designs.

## 3. Backend API Changes

### Rename Transactions API
To standardize naming conventions, the transactions endpoint file is renamed:
*   Rename [functions/api/transactions.ts](file:///home/tie/Projects/knpos/functions/api/transactions.ts) to [functions/api/transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts).
*   All frontend endpoints referencing `/api/transactions` will be updated to `/api/transaction`.

### Category Endpoints (`functions/api/category.ts`)
*   `GET /api/category`: Fetches all categories belonging to the user's shop, sorted alphabetically.

### Product Endpoints (`functions/api/product.ts`)
*   `GET /api/product`:
    *   Joins `product` with the `category` table to retrieve `category_name` and `category_id`.
    *   Fetches the `stock` column directly.
*   `POST /api/product` & `PUT /api/product`:
    *   Accepts `category_name` (string) and `stock` (integer).
    *   If `category_name` is provided, find or create the category for this shop, and set the product's `category_id`.
    *   Write/update the `stock` column.
*   `PUT /api/product` (with JSON body: `{ stocks: Record<number, number> }`):
    *   Detects `application/json` Content-Type.
    *   Bulk updates the stock values in the database for the given products using D1 batch transaction.

### Transaction Endpoint (`functions/api/transaction.ts`)
*   When a new transaction is recorded via `POST /api/transaction`, decrement `product.stock` by the quantity purchased:
    ```sql
    UPDATE product SET stock = MAX(0, stock - ?) WHERE id = ? AND shop_id = ?
    ```

## 4. Frontend Integration

### Zustand Store (`src/store/useInventoryStore.ts`)
*   Manage two stock records: `stocks` (current local state) and `originalStocks` (state loaded from DB).
*   Add `hasStockChanges` getter/computed value.
*   Add `saveStockChanges()` action to send modified stocks to `PUT /api/product` in bulk.

### Onboarding (`src/pages/AddFirstProduct.tsx`)
*   Add direct text input for **Category** (required).
*   Add numeric input for **Stock Quantity** (required, defaults to 0).
*   Send both fields to the `POST /api/product` API.

### Add Product Form (`src/pages/AddProduct.tsx`)
*   Fetch categories from `/api/category`.
*   Show categories as selectable tag pills, with a Plus button to add a new category.
*   Add numeric input for **Stock Quantity** (required, defaults to 0).
*   Send both fields to the `POST/PUT /api/product` API.

### Inventory List (`src/pages/Inventory.tsx`)
*   Use English only (no Thai translations).
*   Fetch categories from `/api/category` and display in `CategoryFilter`.
*   Filter by the product's actual `category_name`.
*   If `hasStockChanges` is true, show a floating "Save Stock Changes" bar at the bottom.
