# Event Seeding Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a TypeScript script `seed/seed-events.ts` that seeds and updates four events (2 past, 1 in-progress, 1 upcoming) bound to `shop_id = 1` in the local/remote D1 database.

**Architecture:** A standalone TypeScript script run via `npx tsx`. It will query existing events to prevent duplication and will update start/end dates of existing events to ensure they remain correct relative to today's date whenever seeded.

**Tech Stack:** TypeScript, Node.js (`fs`, `child_process`), Wrangler D1 CLI.

## Global Constraints
- Target shop_id is always `1`.
- The dates must be generated dynamically relative to execution time using standard Node/JS date logic.
- Target date format in SQLite is `YYYY-MM-DD`.

---

### Task 1: Create `seed/seed-events.ts` script

**Files:**
- Create: `seed/seed-events.ts`

**Interfaces:**
- Consumes: None (Executed via CLI command `npx tsx seed/seed-events.ts`)
- Produces: None

- [ ] **Step 1: Create seed-events.ts with the idempotent seeding logic**

Create the file `seed/seed-events.ts` with the following content:

```typescript
import fs from 'fs';
import { execSync } from 'child_process';

// Check CLI arguments for --remote
const isRemote = process.argv.includes('--remote');
const wranglerFlag = isRemote ? '--remote' : '--local';
const envLabel = isRemote ? 'remote' : 'local';

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

const today = new Date();
const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} 12:00:00`;
};

const getRelativeDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return formatDate(d);
};

const getRelativeDateTime = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return formatDateTime(d);
};

const events = [
  {
    name: 'Pop-up Craft Fair (Past)',
    country: 'Thailand',
    startDate: getRelativeDate(-45),
    endDate: getRelativeDate(-40),
    boothRental: 1000,
    travel: 200,
    accommodation: 500,
    foodAllowance: 100,
  },
  {
    name: 'Singapore Art Festival (Past)',
    country: 'Singapore',
    startDate: getRelativeDate(-20),
    endDate: getRelativeDate(-15),
    boothRental: 1500,
    travel: 400,
    accommodation: 800,
    foodAllowance: 200,
  },
  {
    name: 'Design Week Expo (Current)',
    country: 'Thailand',
    startDate: getRelativeDate(-2),
    endDate: getRelativeDate(2),
    boothRental: 1200,
    travel: 100,
    accommodation: 400,
    foodAllowance: 150,
  },
  {
    name: 'Charni Showcase (Upcoming)',
    country: 'Singapore',
    startDate: getRelativeDate(15),
    endDate: getRelativeDate(20),
    boothRental: 1800,
    travel: 500,
    accommodation: 1000,
    foodAllowance: 250,
  }
];

async function run() {
  console.log(`Querying existing events in ${envLabel} D1 database...`);
  const queryEventsCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id, name FROM event WHERE shop_id = 1" --json`;
  const eventsResult = execSync(queryEventsCommand, { encoding: 'utf-8' });
  const eventsJson = parseWranglerJson(eventsResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const existingEvents: Array<{ id: number; name: string }> =
    Array.isArray(eventsJson) ? (eventsJson[0]?.results || []) : (eventsJson?.results || []);

  const existingEventsMap = new Map<string, number>();
  existingEvents.forEach(evt => existingEventsMap.set(evt.name, evt.id));

  const sqlLines: string[] = [];

  events.forEach((evt) => {
    const existingId = existingEventsMap.get(evt.name);
    if (existingId !== undefined) {
      console.log(`  -> Event "${evt.name}" already exists. Preparing UPDATE SQL...`);
      sqlLines.push(
        `UPDATE event SET start_date = '${evt.startDate}', end_date = '${evt.endDate}' WHERE id = ${existingId};`
      );
    } else {
      console.log(`  -> Event "${evt.name}" does not exist. Preparing INSERT SQL...`);
      sqlLines.push(
        `INSERT INTO event (shop_id, name, country, start_date, end_date, booth_rental, travel, accommodation, food_allowance) ` +
        `VALUES (1, '${evt.name.replace(/'/g, "''")}', '${evt.country.replace(/'/g, "''")}', '${evt.startDate}', '${evt.endDate}', ${evt.boothRental}, ${evt.travel}, ${evt.accommodation}, ${evt.foodAllowance});`
      );
    }
  });

  if (sqlLines.length > 0) {
    const tempSqlFile = 'event_seed_temp.sql';
    fs.writeFileSync(tempSqlFile, sqlLines.join('\n'));
    console.log(`Executing event seed SQL in ${envLabel} D1...`);
    execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
    fs.unlinkSync(tempSqlFile);
  }

  // Seeding Orders and Order Items for Past Events
  console.log(`Re-querying events to fetch IDs...`);
  const finalEventsResult = execSync(queryEventsCommand, { encoding: 'utf-8' });
  const finalEventsJson = parseWranglerJson(finalEventsResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const finalEvents: Array<{ id: number; name: string }> =
    Array.isArray(finalEventsJson) ? (finalEventsJson[0]?.results || []) : (finalEventsJson?.results || []);

  const eventIdMap = new Map<string, number>();
  finalEvents.forEach(evt => eventIdMap.set(evt.name, evt.id));

  const idA = eventIdMap.get('Pop-up Craft Fair (Past)');
  const idB = eventIdMap.get('Singapore Art Festival (Past)');

  if (idA !== undefined && idB !== undefined) {
    console.log(`Checking existing orders for past events (event_ids: ${idA}, ${idB})...`);
    const checkOrdersCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT DISTINCT event_id FROM \\"order\\" WHERE event_id IN (${idA}, ${idB})" --json`;
    const checkOrdersResult = execSync(checkOrdersCommand, { encoding: 'utf-8' });
    const checkOrdersJson = parseWranglerJson(checkOrdersResult) as { results?: { event_id: number }[] } | { results?: { event_id: number }[] }[];
    const existingOrders: Array<{ event_id: number }> =
      Array.isArray(checkOrdersJson) ? (checkOrdersJson[0]?.results || []) : (checkOrdersJson?.results || []);

    const existingOrderEventIds = new Set(existingOrders.map(o => o.event_id));

    // Query products & prices
    console.log(`Querying products and prices...`);
    const queryProductsCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT p.id, pp.currency_code, pp.price FROM product p JOIN product_price pp ON p.id = pp.product_id WHERE p.shop_id = 1" --json`;
    const productsResult = execSync(queryProductsCommand, { encoding: 'utf-8' });
    const productsJson = parseWranglerJson(productsResult) as { results?: { id: number; currency_code: string; price: number }[] } | { results?: { id: number; currency_code: string; price: number }[] }[];
    const productsList: Array<{ id: number; currency_code: string; price: number }> =
      Array.isArray(productsJson) ? (productsJson[0]?.results || []) : (productsJson?.results || []);

    const thbProducts = productsList.filter(p => p.currency_code === 'THB');
    const sgdProducts = productsList.filter(p => p.currency_code === 'SGD');

    const orderSqlLines: string[] = [];

    // Past Event A: Profit target > 1800 THB
    if (existingOrderEventIds.has(idA)) {
      console.log(`  -> Orders already exist for Past Event A, skipping order seeding.`);
    } else if (thbProducts.length === 0) {
      console.warn(`  -> WARNING: No THB products found in database. Skipping order seeding for Past Event A.`);
    } else {
      const prod = thbProducts[0];
      const price = prod.price;
      const targetIncome = 2500;
      const totalQty = Math.ceil(targetIncome / price);
      const qty1 = Math.floor(totalQty / 2);
      const qty2 = totalQty - qty1;

      console.log(`  -> Preparing profit orders for Past Event A (THB) using product id ${prod.id} (Price: ${price} THB, Total Qty: ${totalQty})...`);
      const dt1 = getRelativeDateTime(-44);
      const dt2 = getRelativeDateTime(-41);

      orderSqlLines.push(
        `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
        `VALUES ('THB', ${qty1 * price}, ${qty1}, ${idA}, '${dt1}');`
      );
      orderSqlLines.push(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
        `VALUES (last_insert_rowid(), ${prod.id}, ${qty1}, ${price});`
      );

      orderSqlLines.push(
        `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
        `VALUES ('THB', ${qty2 * price}, ${qty2}, ${idA}, '${dt2}');`
      );
      orderSqlLines.push(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
        `VALUES (last_insert_rowid(), ${prod.id}, ${qty2}, ${price});`
      );
    }

    // Past Event B: Loss target < 2900 SGD
    if (existingOrderEventIds.has(idB)) {
      console.log(`  -> Orders already exist for Past Event B, skipping order seeding.`);
    } else if (sgdProducts.length === 0) {
      console.warn(`  -> WARNING: No SGD products found in database. Skipping order seeding for Past Event B.`);
    } else {
      const prod = sgdProducts[0];
      const price = prod.price;
      const targetIncome = 300;
      const totalQty = Math.ceil(targetIncome / price);
      const qty1 = Math.floor(totalQty / 2);
      const qty2 = totalQty - qty1;

      console.log(`  -> Preparing loss orders for Past Event B (SGD) using product id ${prod.id} (Price: ${price} SGD, Total Qty: ${totalQty})...`);
      const dt1 = getRelativeDateTime(-19);
      const dt2 = getRelativeDateTime(-16);

      orderSqlLines.push(
        `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
        `VALUES ('SGD', ${qty1 * price}, ${qty1}, ${idB}, '${dt1}');`
      );
      orderSqlLines.push(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
        `VALUES (last_insert_rowid(), ${prod.id}, ${qty1}, ${price});`
      );

      orderSqlLines.push(
        `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
        `VALUES ('SGD', ${qty2 * price}, ${qty2}, ${idB}, '${dt2}');`
      );
      orderSqlLines.push(
        `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
        `VALUES (last_insert_rowid(), ${prod.id}, ${qty2}, ${price});`
      );
    }

    if (orderSqlLines.length > 0) {
      const tempSqlFile = 'order_seed_temp.sql';
      fs.writeFileSync(tempSqlFile, orderSqlLines.join('\n'));
      console.log(`Executing order seed SQL in ${envLabel} D1...`);
      execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
      fs.unlinkSync(tempSqlFile);
    }
  }

  console.log('Event seeding/updates completed successfully!');
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script locally to seed the events and orders**

Run: `npx tsx seed/seed-events.ts`
Expected: Output showing event inserts/updates, re-querying events, checking existing orders, querying products, preparing profit/loss orders, and executing D1 SQL.

- [ ] **Step 3: Query local events to verify insertion**

Run: `npx wrangler d1 execute charnipos-db --local --command="SELECT name, country, start_date, end_date, booth_rental FROM event WHERE shop_id = 1"`
Expected: 4 rows outputted matching the seeded events.

- [ ] **Step 4: Run the script a second time to verify update logic**

Run: `npx tsx seed/seed-events.ts`
Expected: Output showing "already exists. Preparing UPDATE SQL..." for all 4 events, and successful completion without duplication.

- [ ] **Step 5: Commit task changes**

Run:
```bash
git add seed/seed-events.ts
git commit -m "feat(seed): add seed-events.ts script for idempotent event seeding"
```

---

### Task 2: Makefile Integration

**Files:**
- Modify: `Makefile:25-30`

**Interfaces:**
- Consumes: `seed/seed-events.ts`
- Produces: `make seed-events`, `make remote-seed-events` commands

- [ ] **Step 1: Add seed-events targets to Makefile**

Add the targets to `Makefile` right after `remote-seed-products`:

```makefile
seed-events:
	npx tsx seed/seed-events.ts

remote-seed-events:
	npx tsx seed/seed-events.ts --remote
```

- [ ] **Step 2: Verify local Makefile target**

Run: `make seed-events`
Expected: Runs `npx tsx seed/seed-events.ts` locally and succeeds.

- [ ] **Step 3: Commit Makefile changes**

Run:
```bash
git add Makefile
git commit -m "chore(make): add seed-events and remote-seed-events targets"
```
