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

  // Seeding Orders and Order Items for Past and In-Progress Events
  console.log(`Re-querying events to fetch IDs...`);
  const finalEventsResult = execSync(queryEventsCommand, { encoding: 'utf-8' });
  const finalEventsJson = parseWranglerJson(finalEventsResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const finalEvents: Array<{ id: number; name: string }> =
    Array.isArray(finalEventsJson) ? (finalEventsJson[0]?.results || []) : (finalEventsJson?.results || []);

  const eventIdMap = new Map<string, number>();
  finalEvents.forEach(evt => eventIdMap.set(evt.name, evt.id));

  const idA = eventIdMap.get('Pop-up Craft Fair (Past)');
  const idB = eventIdMap.get('Singapore Art Festival (Past)');
  const idC = eventIdMap.get('Design Week Expo (Current)');
  const idD = eventIdMap.get('Charni Showcase (Upcoming)');

  console.log('Seeding event members (roles) for user 1...');
  const memberSqlLines: string[] = [];
  if (idA !== undefined) memberSqlLines.push(`INSERT OR IGNORE INTO event_member (event_id, user_id, role) VALUES (${idA}, 1, 'creator');`);
  if (idB !== undefined) memberSqlLines.push(`INSERT OR IGNORE INTO event_member (event_id, user_id, role) VALUES (${idB}, 1, 'creator');`);
  if (idC !== undefined) memberSqlLines.push(`INSERT OR IGNORE INTO event_member (event_id, user_id, role) VALUES (${idC}, 1, 'creator');`);
  if (idD !== undefined) memberSqlLines.push(`INSERT OR IGNORE INTO event_member (event_id, user_id, role) VALUES (${idD}, 1, 'creator');`);

  if (memberSqlLines.length > 0) {
    const tempSqlFile = 'event_member_seed_temp.sql';
    fs.writeFileSync(tempSqlFile, memberSqlLines.join('\n'));
    execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
    fs.unlinkSync(tempSqlFile);
  }

  if (idA !== undefined && idB !== undefined && idC !== undefined) {
    console.log(`Checking existing orders for events (event_ids: ${idA}, ${idB}, ${idC})...`);
    const checkOrdersCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT DISTINCT event_id FROM \\"order\\" WHERE event_id IN (${idA}, ${idB}, ${idC})" --json`;
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

    // Past Event A: Profit target > 1800 THB (12 orders, 1-5 unique products per order)
    if (existingOrderEventIds.has(idA)) {
      console.log(`  -> Orders already exist for Past Event A, skipping order seeding.`);
    } else if (thbProducts.length === 0) {
      console.warn(`  -> WARNING: No THB products found in database. Skipping order seeding for Past Event A.`);
    } else {
      console.log(`  -> Preparing 12 profit orders for Past Event A (THB)...`);
      for (let i = 0; i < 12; i++) {
        const dateOffset = -45 + (i % 5);
        const dt = getRelativeDateTime(dateOffset);
        
        const numProducts = (i % 5) + 1; // 1 to 5 products
        let totalIncome = 0;
        let totalQty = 0;
        const orderItemsSql: string[] = [];

        for (let j = 0; j < numProducts; j++) {
          const prod = thbProducts[(i + j) % thbProducts.length];
          const qty = (i % 3) + 1; // 1 to 3 items
          const price = prod.price;
          totalIncome += qty * price;
          totalQty += qty;

          orderItemsSql.push(
            `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
            `VALUES ((SELECT max(id) FROM "order"), ${prod.id}, ${qty}, ${price});`
          );
        }

        orderSqlLines.push(
          `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
          `VALUES ('THB', ${totalIncome}, ${totalQty}, ${idA}, '${dt}');`
        );
        orderSqlLines.push(...orderItemsSql);
      }
    }

    // Past Event B: Loss target < 2900 SGD (12 orders, 1-5 unique products per order)
    if (existingOrderEventIds.has(idB)) {
      console.log(`  -> Orders already exist for Past Event B, skipping order seeding.`);
    } else if (sgdProducts.length === 0) {
      console.warn(`  -> WARNING: No SGD products found in database. Skipping order seeding for Past Event B.`);
    } else {
      console.log(`  -> Preparing 12 loss orders for Past Event B (SGD)...`);
      for (let i = 0; i < 12; i++) {
        const dateOffset = -20 + (i % 5);
        const dt = getRelativeDateTime(dateOffset);
        
        const numProducts = (i % 5) + 1; // 1 to 5 products
        let totalIncome = 0;
        let totalQty = 0;
        const orderItemsSql: string[] = [];

        for (let j = 0; j < numProducts; j++) {
          const prod = sgdProducts[(i + j) % sgdProducts.length];
          const qty = 1; // Quantity 1 to keep total under 2900 SGD
          const price = prod.price;
          totalIncome += qty * price;
          totalQty += qty;

          orderItemsSql.push(
            `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
            `VALUES ((SELECT max(id) FROM "order"), ${prod.id}, ${qty}, ${price});`
          );
        }

        orderSqlLines.push(
          `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
          `VALUES ('SGD', ${totalIncome}, ${totalQty}, ${idB}, '${dt}');`
        );
        orderSqlLines.push(...orderItemsSql);
      }
    }

    // In-Progress Event C: 3 orders (1-5 unique products per order)
    if (existingOrderEventIds.has(idC)) {
      console.log(`  -> Orders already exist for In-Progress Event C, skipping order seeding.`);
    } else if (thbProducts.length === 0) {
      console.warn(`  -> WARNING: No THB products found in database. Skipping order seeding for In-Progress Event C.`);
    } else {
      console.log(`  -> Preparing 3 orders for In-Progress Event C (THB)...`);
      for (let i = 0; i < 3; i++) {
        const dateOffset = -2 + i * 2; // -2, 0, 2 days relative to today
        const dt = getRelativeDateTime(dateOffset);
        
        const numProducts = (i % 5) + 1; // 1 to 5 products
        let totalIncome = 0;
        let totalQty = 0;
        const orderItemsSql: string[] = [];

        for (let j = 0; j < numProducts; j++) {
          const prod = thbProducts[(i + j) % thbProducts.length];
          const qty = (i % 3) + 1; // 1 to 3 items
          const price = prod.price;
          totalIncome += qty * price;
          totalQty += qty;

          orderItemsSql.push(
            `INSERT INTO order_item (order_id, product_id, quantity, price_per_unit) ` +
            `VALUES ((SELECT max(id) FROM "order"), ${prod.id}, ${qty}, ${price});`
          );
        }

        orderSqlLines.push(
          `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id, created_at) ` +
          `VALUES ('THB', ${totalIncome}, ${totalQty}, ${idC}, '${dt}');`
        );
        orderSqlLines.push(...orderItemsSql);
      }
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
