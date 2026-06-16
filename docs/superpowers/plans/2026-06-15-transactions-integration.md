# Transactions Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist orders and transactions to the Cloudflare D1 SQLite database, manage order state using Zustand, and display real-time transaction aggregates on the Transactions page.

**Architecture:** Use a Zustand store (`useOrderStore`) on the frontend to decouple order cart state from specific components. On checkout, the client makes a `POST` request to `/api/transactions` which writes to both `"Transaction"` and `Transaction_Item` tables in D1. The Transactions tab fetches aggregate daily statistics and product breakdowns filtered by the active currency from `/api/transactions`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand, Cloudflare Pages Functions, Cloudflare D1 Database (SQLite).

---

## File Structure & Decomposition
The following files will be created or modified:
1. `src/store/useOrderStore.ts` (Create): Handles the POS cart state, selected currency, and increment/decrement/clear logic.
2. `schema.sql` (Modify): Adds the schema definitions for `"Transaction"` and `Transaction_Item` tables and `idx_transaction_created_at` index.
3. `functions/api/transactions.ts` (Create): Pages function API that handles `POST /api/transactions` (saving orders) and `GET /api/transactions` (retrieving stats).
4. `src/pages/Order.tsx` (Modify): Connects order checkout page to the Zustand store and the POST api endpoint.
5. `src/pages/Transactions.tsx` (Modify): Connects the transaction page to the GET api endpoint, and implements the currency selector controls.

---

### Task 1: Install Zustand & Create useOrderStore

**Files:**
- Create: `src/store/useOrderStore.ts`

- [ ] **Step 1: Write a temporary verification script to check state initialization**

Create a temporary script `/home/tie/Projects/knpos/.gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-store.ts` to test store operations:

```typescript
import { useOrderStore } from '../../../../../src/store/useOrderStore';
// Simple test to ensure state functions are properly exposed
console.log('Testing useOrderStore initialization...');
const state = useOrderStore.getState();
if (state.selectedCurrency.code !== 'THB') throw new Error('Default currency should be THB');
console.log('Zustand store initialized successfully.');
```

- [ ] **Step 2: Run verification script (expected to fail due to missing dependencies/store)**

Run: `pnpm exec tsx .gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-store.ts`
Expected Output: Error (Cannot find module 'zustand' or 'useOrderStore')

- [ ] **Step 3: Install Zustand and write the `useOrderStore.ts` implementation**

First, run:
```bash
pnpm install zustand
```

Then create `src/store/useOrderStore.ts` with this code:
```typescript
import { create } from 'zustand';
import { currencies, type Currency } from '../components/CurrencySwitchPopup';

interface OrderState {
  quantities: Record<number, number>; // productId -> quantity
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  incrementItem: (productId: number) => void;
  decrementItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  quantities: {},
  selectedCurrency: currencies.find((c) => c.code === 'THB') || currencies[0],
  
  setCurrency: (currency) => set({ selectedCurrency: currency }),
  
  incrementItem: (productId) =>
    set((state) => ({
      quantities: {
        ...state.quantities,
        [productId]: (state.quantities[productId] || 0) + 1,
      },
    })),
    
  decrementItem: (productId) =>
    set((state) => {
      const current = state.quantities[productId] || 0;
      const newQuantities = { ...state.quantities };
      if (current <= 1) {
        delete newQuantities[productId];
      } else {
        newQuantities[productId] = current - 1;
      }
      return { quantities: newQuantities };
    }),
    
  removeItem: (productId) =>
    set((state) => {
      const newQuantities = { ...state.quantities };
      delete newQuantities[productId];
      return { quantities: newQuantities };
    }),
    
  clearOrder: () => set({ quantities: {} }),
}));
```

- [ ] **Step 4: Run verification script to check store operation**

Run: `pnpm exec tsx .gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-store.ts`
Expected Output: "Zustand store initialized successfully."

- [ ] **Step 5: Commit store implementation**

```bash
git add package.json pnpm-lock.yaml src/store/useOrderStore.ts
git commit -m "feat: install zustand and create useOrderStore"
```

---

### Task 2: Database Schema & Migration Setup

**Files:**
- Modify: `schema.sql`

- [ ] **Step 1: Write a temporary verification script to check DB schema**

Create a temporary script `/home/tie/Projects/knpos/.gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-db.ts`:

```typescript
import { execSync } from 'child_process';
console.log('Checking database table definitions...');
try {
  const tables = execSync('npx wrangler d1 execute charnipos-db --local --command=".tables"').toString();
  console.log('Tables in local database:', tables);
  if (!tables.includes('Transaction') || !tables.includes('Transaction_Item')) {
    throw new Error('New tables are missing.');
  }
  console.log('Tables exist!');
} catch (e) {
  console.error('Check failed:', (e as Error).message);
  process.exit(1);
}
```

- [ ] **Step 2: Run verification script (expected to fail)**

Run: `pnpm exec tsx .gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-db.ts`
Expected Output: Check failed: New tables are missing.

- [ ] **Step 3: Modify `schema.sql` and run local migration**

Open `schema.sql` and append the new tables and index:
```sql
-- schema.sql (appended content)

CREATE TABLE IF NOT EXISTS "Transaction" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,         -- เก็บว่าใช้ราคาของประเทศไหน เช่น 'THB', 'SGD'
    total_income REAL NOT NULL,          -- รวมยอดเงินของออร์เดอร์นี้
    total_product_sold INTEGER NOT NULL, -- รวมจำนวนชิ้นที่ขายได้ในออร์เดอร์นี้
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Transaction_Item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,        -- ล็อกราคา ณ วันที่ขายไว้
    FOREIGN KEY (transaction_id) REFERENCES "Transaction"(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON "Transaction"(created_at);
```

Then, run wrangler to execute the updated schema against the local database:
```bash
npx wrangler d1 execute charnipos-db --local --file=schema.sql
```

- [ ] **Step 4: Run verification script**

Run: `pnpm exec tsx .gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-db.ts`
Expected Output: Tables exist!

- [ ] **Step 5: Commit schema changes**

```bash
git add schema.sql
git commit -m "db: add Transaction and Transaction_Item tables to schema"
```

---

### Task 3: Create Transactions API Endpoint

**Files:**
- Create: `functions/api/transactions.ts`

- [ ] **Step 1: Write a temporary verification script to fetch and test the API responses**

Create `/home/tie/Projects/knpos/.gemini/antigravity-cli/brain/3af14308-90ad-473b-8696-7686b1c8fa23/scratch/verify-api.ts`:

```typescript
console.log('Verifying Transactions endpoint is not yet defined...');
// We will test if the server running locally returns 404/500 for the endpoint before creation.
```

- [ ] **Step 2: Run verification script / manual verify**

Run: `curl http://localhost:8788/api/transactions` (make sure local server is running, or verify it fails to resolve functions)
Expected: Status code 404 (endpoint not defined yet)

- [ ] **Step 3: Implement `functions/api/transactions.ts`**

Create `functions/api/transactions.ts`:
```typescript
import type { PagesFunction, D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { currency_code, total_income, total_product_sold, items } = await context.request.json() as {
      currency_code: string;
      total_income: number;
      total_product_sold: number;
      items: Array<{ product_id: number; quantity: number; price_per_unit: number }>;
    };

    if (!currency_code || isNaN(total_income) || isNaN(total_product_sold) || !Array.isArray(items)) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Insert master transaction
    const txResult = await context.env.DB.prepare(
      `INSERT INTO "Transaction" (currency_code, total_income, total_product_sold) 
       VALUES (?, ?, ?)`
    )
      .bind(currency_code, total_income, total_product_sold)
      .run();

    const transactionId = txResult.meta.last_row_id;

    // Create statements for items
    const itemStatements = items.map((item) =>
      context.env.DB.prepare(
        `INSERT INTO Transaction_Item (transaction_id, product_id, quantity, price_per_unit) 
         VALUES (?, ?, ?, ?)`
      ).bind(transactionId, item.product_id, item.quantity, item.price_per_unit)
    );

    // Run D1 batch write
    await context.env.DB.batch(itemStatements);

    return new Response(JSON.stringify({ success: true, transactionId }), {
      status: 201,
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const currency = url.searchParams.get('currency') || 'THB';

    // Query 1: Today's aggregates
    const summaryResult = await context.env.DB.prepare(
      `SELECT 
          COALESCE(SUM(total_income), 0) AS daily_total_income,
          COALESCE(SUM(total_product_sold), 0) AS daily_total_product_sold
       FROM "Transaction"
       WHERE DATE(created_at) = DATE('now') AND currency_code = ?`
    )
      .bind(currency)
      .first<{ daily_total_income: number; daily_total_product_sold: number }>();

    // Query 2: Dynamic product volumes sold today
    const { results: productsResult } = await context.env.DB.prepare(
      `SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.image_url,
          SUM(ti.quantity) AS total_sold_today
       FROM Transaction_Item ti
       JOIN "Transaction" t ON ti.transaction_id = t.id
       JOIN Product p ON ti.product_id = p.id
       WHERE DATE(t.created_at) = DATE('now') AND t.currency_code = ?
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold_today DESC`
    )
      .bind(currency)
      .all();

    return new Response(
      JSON.stringify({
        summary: summaryResult || { daily_total_income: 0, daily_total_product_sold: 0 },
        products: productsResult,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 4: Run type verification and verify build**

Run build command to ensure TypeScript typings compile correctly with the new file:
`pnpm build`
Expected: Success

- [ ] **Step 5: Commit API implementation**

```bash
git add functions/api/transactions.ts
git commit -m "feat: implement transactions GET and POST endpoints"
```

---

### Task 4: Connect Checkout flow in Order page

**Files:**
- Modify: `src/pages/Order.tsx`
- Modify: `src/components/ConfirmOrderModal.tsx`

- [ ] **Step 1: Update ConfirmOrderModal to take dynamic currency symbol**

Open `src/components/ConfirmOrderModal.tsx` and change it to accept `currencySymbol` prop:
Replace:
```typescript
interface ConfirmOrderModalProps {
  totalItems: number;
  totalPrice: number;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```
With:
```typescript
interface ConfirmOrderModalProps {
  totalItems: number;
  totalPrice: number;
  currencySymbol: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```
And inside the render function, display the symbol instead of the hardcoded `$`:
```typescript
          <div className='flex justify-between items-center w-full'>
            <span className='text-[#6b7280] text-[13px]'>Total Price</span>
            <span className='font-semibold text-foreground text-[13px]'>
              {currencySymbol}{totalPrice.toFixed(2)}
            </span>
          </div>
```

- [ ] **Step 2: Connect Order.tsx to useOrderStore and implement API submit**

Modify `src/pages/Order.tsx` to read/write state from the Zustand store, and run the real fetch request on checkout:

Replace state declarations (lines 28-32):
```typescript
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    quantities,
    selectedCurrency,
    setCurrency: setSelectedCurrency,
    incrementItem: handleIncrement,
    decrementItem: handleDecrement,
    clearOrder,
  } = useOrderStore();
```

Inside `onConfirm` of `ConfirmOrderModal` (lines 105-115), call the API:
```typescript
            onConfirm={async () => {
              setIsConfirming(true);
              
              const orderItems = products
                .filter((p) => quantities[p.id] > 0)
                .map((p) => ({
                  product_id: p.id,
                  quantity: quantities[p.id],
                  price_per_unit: getPrice(p, selectedCurrency.code),
                }));

              try {
                const response = await fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    currency_code: selectedCurrency.code,
                    total_income: totalCost,
                    total_product_sold: totalCount,
                    items: orderItems,
                  }),
                });

                if (response.ok) {
                  clearOrder();
                  onNavigate?.('transactions');
                } else {
                  console.error('Checkout failed:', await response.text());
                }
              } catch (err) {
                console.error('Checkout error:', err);
              } finally {
                setIsConfirming(false);
                setIsConfirmModalOpen(false);
              }
            }}
```
Also pass `currencySymbol={selectedCurrency.symbol}` to the `<ConfirmOrderModal />` invocation.

- [ ] **Step 3: Run verify check**

Verify build success:
`pnpm build`
Expected: Success

- [ ] **Step 4: Commit Order and Modal changes**

```bash
git add src/pages/Order.tsx src/components/ConfirmOrderModal.tsx
git commit -m "feat: hook up checkout flow to D1 database API via useOrderStore"
```

---

### Task 5: Dynamic stats rendering on Transactions page

**Files:**
- Modify: `src/pages/Transactions.tsx`

- [ ] **Step 1: Connect Transactions.tsx to useOrderStore and fetch API stats**

Open `src/pages/Transactions.tsx` and rewrite it:
- Add imports:
```typescript
import { useState, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import CurrencySortControls from '../components/CurrencySortControls';
```
- Inside the component, read `selectedCurrency` and `setCurrency` from `useOrderStore`.
- Declare state variables for summary (`{ daily_total_income: number; daily_total_product_sold: number }`) and product list:
```typescript
  const { selectedCurrency, setCurrency } = useOrderStore();
  const [summary, setSummary] = useState({ daily_total_income: 0, daily_total_product_sold: 0 });
  const [itemsSold, setItemsSold] = useState<Array<{ product_id: number; product_name: string; image_url: string; total_sold_today: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
```
- Fetch dynamic data on currency change:
```typescript
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/transactions?currency=${selectedCurrency.code}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
        setItemsSold(data.products);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [selectedCurrency]);
```
- In the table header, replace the static header action (line 102-107) with the `CurrencySortControls`:
```typescript
              <CurrencySortControls
                selectedCurrency={selectedCurrency}
                onSelectCurrency={setCurrency}
              />
```
- Display dynamic totals in the summary section (with matching currency symbol):
```typescript
                  {selectedCurrency.symbol}
                  {summary.daily_total_income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
```
and `summary.daily_total_product_sold.toLocaleString()`.
- Map the product sold items list dynamically using `itemsSold`:
```typescript
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {isLoading ? (
                <div className='p-4 text-center text-[13px] text-gray-500 font-medium'>
                  Loading transaction data...
                </div>
              ) : itemsSold.length === 0 ? (
                <div className='p-8 text-center text-[13px] text-gray-400 font-medium'>
                  No transactions recorded today.
                </div>
              ) : (
                itemsSold.map((item, index) => (
                  <div
                    key={item.product_id}
                    className={`flex items-center gap-3 px-4 py-3 bg-white ${
                      index !== itemsSold.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <span className='flex-1 font-medium text-foreground text-[13px] truncate'>
                      {item.product_name}
                    </span>
                    <span className='font-bold text-primary text-[13px]'>
                      {item.total_sold_today}
                    </span>
                  </div>
                ))
              )}
            </div>
```

- [ ] **Step 2: Run full build and lint check**

Verify build:
`pnpm build`
Expected: Success

Run linter:
`pnpm lint`
Expected: Success

- [ ] **Step 3: Commit final integration changes**

```bash
git add src/pages/Transactions.tsx
git commit -m "feat: implement dynamic stats and product sold ranking in Transactions view"
```
