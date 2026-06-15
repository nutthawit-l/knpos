# Design Specification: Transactions Page & Order Checkout Database Integration

**Date:** 2026-06-15
**Status:** Approved

## 1. Overview
This specification details the design for connecting the frontend POS order checkout and the transactions history page to a Cloudflare D1 SQLite database. We transition the app from static mocked data to real persistent storage.

## 2. Database Schema
We will create two new tables in the D1 database to handle orders and item details, alongside an index to optimize retrieval speed for daily queries.

```sql
-- Main transaction table storing metadata
CREATE TABLE IF NOT EXISTS "Transaction" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,         -- Standard ISO currency code: 'THB', 'SGD', etc.
    total_income REAL NOT NULL,          -- Total amount in the selected currency
    total_product_sold INTEGER NOT NULL, -- Total items sold in this order
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sub-table storing product details per transaction
CREATE TABLE IF NOT EXISTS Transaction_Item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,        -- Locked unit price at the time of sale
    FOREIGN KEY (transaction_id) REFERENCES "Transaction"(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

-- Index for daily queries
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON "Transaction"(created_at);
```

---

## 3. Frontend State (Zustand Store)
We introduce `useOrderStore` to manage checkout cart quantities and the active currency selection globally.

* **File Location**: `src/store/useOrderStore.ts`
* **Key Actions**:
  - `setCurrency(currency)`: Changes current active currency.
  - `incrementItem(productId)`: Increases quantity.
  - `decrementItem(productId)`: Decreases quantity (removes if <= 0).
  - `removeItem(productId)`: Removes product entirely from the order.
  - `clearOrder()`: Resets checkout quantities.

---

## 4. API Specification

### POST `/api/transactions`
Creates a master `"Transaction"` record, retrieves the inserted auto-generated ID, and executes a batch insert for all associated items.

* **Payload**:
```json
{
  "currency_code": "THB",
  "total_income": 350.00,
  "total_product_sold": 5,
  "items": [
    { "product_id": 1, "quantity": 3, "price_per_unit": 100.00 },
    { "product_id": 2, "quantity": 2, "price_per_unit": 25.00 }
  ]
}
```
* **Success Response**: `201 Created`
```json
{
  "success": true,
  "transactionId": 123
}
```

---

### GET `/api/transactions?currency=CODE`
Returns today's aggregate statistics and top products sold today, filtered by the chosen currency.

* **Query Parameters**:
  - `currency`: ISO code, defaults to `THB`.

* **Success Response**: `200 OK`
```json
{
  "summary": {
    "daily_total_income": 8120.50,
    "daily_total_product_sold": 1284
  },
  "products": [
    {
      "product_id": 1,
      "product_name": "Cappuccino",
      "image_url": "https://...",
      "total_sold_today": 312
    }
  ]
}
```

---

## 5. UI Integration Flow

### Checkout Flow (`Order.tsx`)
1. User adds items to the order.
2. User clicks the checkout summary banner to open `ConfirmOrderModal`.
3. Modal displays the total item count and total price using the `selectedCurrency.symbol`.
4. Clicking "Confirm" calls `POST /api/transactions` with the cart details.
5. On success, `clearOrder()` is triggered, and the user is redirected to the `Transactions` tab.

### Transactions View (`Transactions.tsx`)
1. Page displays a currency switcher (`CurrencySortControls`) matching the Order page.
2. Whenever the tab is focused or currency changes, it calls `GET /api/transactions?currency=CODE`.
3. Displays the total income (using matching symbol) and product count.
4. Renders the products sold today list sorted by unit volume.
