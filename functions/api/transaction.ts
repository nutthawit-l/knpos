import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    let body: {
      currency_code: string;
      total_income: number;
      total_product_sold: number;
      event_id?: number | null;
      items: Array<{ product_id: number; quantity: number; price_per_unit: number }>;
    };

    try {
      body = await context.request.json() as typeof body;
    } catch {
      return new Response('Malformed JSON body', { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return new Response('Invalid request body', { status: 400 });
    }

    const { currency_code, total_income, total_product_sold, items, event_id } = body;

    const supportedCurrencies = ['THB', 'SGD', 'JPY', 'CNY', 'TWD', 'KRW', 'IDR', 'EUR', 'USD'];

    if (
      typeof currency_code !== 'string' ||
      !supportedCurrencies.includes(currency_code) ||
      typeof total_income !== 'number' ||
      !Number.isFinite(total_income) ||
      total_income < 0 ||
      typeof total_product_sold !== 'number' ||
      !Number.isInteger(total_product_sold) ||
      total_product_sold <= 0 ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return new Response('Missing or invalid required fields', { status: 400 });
    }

    // Authenticate user and verify shop/event membership if event_id is provided
    if (event_id === undefined || event_id === null) {
      return new Response('event_id is required', { status: 400 });
    }

    const validatedEventId = Number(event_id);
    if (!Number.isInteger(validatedEventId) || validatedEventId <= 0) {
      return new Response('Invalid event_id', { status: 400 });
    }

    let userShopId: number | null = null;
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (token) {
      const session = await context.env.DB.prepare(
        "SELECT user_id FROM session WHERE id = ?"
      )
        .bind(token)
        .first<{ user_id: number }>();

      if (session) {
        const shopMember = await context.env.DB.prepare(
          "SELECT shop_id FROM shop_member WHERE user_id = ?"
        )
          .bind(session.user_id)
          .first<{ shop_id: number }>();

        if (shopMember) {
          userShopId = shopMember.shop_id;
        }
      }
    }

    // Verify that the event exists, belongs to the user's shop, and is in progress
    const eventRecord = await context.env.DB.prepare(
      "SELECT shop_id, start_date, end_date FROM event WHERE id = ?"
    )
      .bind(validatedEventId)
      .first<{ shop_id: number; start_date: string; end_date: string }>();

    if (!eventRecord) {
      return new Response('Event not found', { status: 400 });
    }

    if (userShopId && eventRecord.shop_id !== userShopId) {
      return new Response('Unauthorized access to event', { status: 403 });
    }

    // Calculate today's date in GMT+7 (Thailand timezone)
    const GMT_OFFSET_MS = 7 * 60 * 60 * 1000;
    const localTime = new Date(Date.now() + GMT_OFFSET_MS);
    const todayStr = localTime.toISOString().split('T')[0];

    if (todayStr < eventRecord.start_date || todayStr > eventRecord.end_date) {
      return new Response('Transactions can only be logged for events that are in progress', { status: 400 });
    }

    let calculatedIncome = 0;
    let calculatedProductSold = 0;

    for (const item of items) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.product_id !== 'number' ||
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0 ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        typeof item.price_per_unit !== 'number' ||
        !Number.isFinite(item.price_per_unit) ||
        item.price_per_unit < 0
      ) {
        return new Response('Invalid transaction items data structure', { status: 400 });
      }
      calculatedIncome += item.quantity * item.price_per_unit;
      calculatedProductSold += item.quantity;
    }

    // Verify integrity of totals (with a tiny floating-point tolerance check)
    if (Math.abs(calculatedIncome - total_income) > 0.001) {
      return new Response('Total income mismatch against transaction items', { status: 400 });
    }
    if (calculatedProductSold !== total_product_sold) {
      return new Response('Total product count mismatch against transaction items', { status: 400 });
    }

    // Insert master transaction and child items in a single D1 transaction batch for atomicity
    const insertTx = context.env.DB.prepare(
      `INSERT INTO "order" (currency_code, total_income, total_product_sold, event_id) 
       VALUES (?, ?, ?, ?)`
    ).bind(currency_code, total_income, total_product_sold, validatedEventId);

    // Use (SELECT MAX(id) FROM "order") to obtain the correct transaction ID.
    // last_insert_rowid() changes as soon as the first item is inserted, which breaks multi-item inserts.
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
    const transactionId = batchResult[0].meta.last_row_id;

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
    const currency = (url.searchParams.get('currency') || 'THB').toUpperCase();

    // Determine the timezone offset. Eagerly check for a client-supplied tzOffset (in hours).
    let offset = 7; // Default to Thailand (GMT+7)
    const tzParam = url.searchParams.get('tzOffset');
    if (tzParam !== null) {
      const parsedOffset = parseInt(tzParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= -12 && parsedOffset <= 14) {
        offset = parsedOffset;
      }
    } else {
      // Fallback to default timezone offset in hours based on the currency code
      const currencyTimezones: Record<string, number> = {
        THB: 7,
        SGD: 8,
        JPY: 9,
        CNY: 8,
        TWD: 8,
        KRW: 9,
        IDR: 7,
        EUR: 1,
        USD: -5,
      };
      if (currency in currencyTimezones) {
        offset = currencyTimezones[currency];
      }
    }

    const offsetStr = offset >= 0 ? `+${offset} hours` : `${offset} hours`;
    const startOffsetStr = offset >= 0 ? `-${offset} hours` : `+${Math.abs(offset)} hours`;
    const endOffsetStr = offset >= 0 ? `+${24 - offset} hours` : `+${24 + Math.abs(offset)} hours`;

    // Query 1: Today's aggregates using range queries utilizing the timezone offset and created_at index
    const summaryResult = await context.env.DB.prepare(
      `SELECT 
          COALESCE(SUM(total_income), 0) AS daily_total_income,
          COALESCE(SUM(total_product_sold), 0) AS daily_total_product_sold
       FROM "order"
       WHERE created_at >= datetime('now', ?, 'start of day', ?)
         AND created_at < datetime('now', ?, 'start of day', ?)
         AND currency_code = ?`
    )
      .bind(offsetStr, startOffsetStr, offsetStr, endOffsetStr, currency)
      .first<{ daily_total_income: number; daily_total_product_sold: number }>();

    // Query 2: Dynamic product volumes sold today using range queries utilizing the timezone offset
    const { results: productsResult } = await context.env.DB.prepare(
      `SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.image_url,
          SUM(ti.quantity) AS total_sold_today
       FROM order_item ti
       JOIN "order" t ON ti.order_id = t.id
       JOIN product p ON ti.product_id = p.id
       WHERE t.created_at >= datetime('now', ?, 'start of day', ?)
         AND t.created_at < datetime('now', ?, 'start of day', ?)
         AND t.currency_code = ?
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold_today DESC`
    )
      .bind(offsetStr, startOffsetStr, offsetStr, endOffsetStr, currency)
      .all<{ product_id: number; product_name: string; image_url: string; total_sold_today: number }>();

    // Query 3: Individual orders today using range queries utilizing the timezone offset
    const { results: ordersResult } = await context.env.DB.prepare(
      `SELECT 
          id,
          total_income,
          total_product_sold,
          created_at
       FROM "order"
       WHERE created_at >= datetime('now', ?, 'start of day', ?)
         AND created_at < datetime('now', ?, 'start of day', ?)
         AND currency_code = ?
       ORDER BY created_at DESC`
    )
      .bind(offsetStr, startOffsetStr, offsetStr, endOffsetStr, currency)
      .all<{ id: number; total_income: number; total_product_sold: number; created_at: string }>();

    return new Response(
      JSON.stringify({
        summary: summaryResult || { daily_total_income: 0, daily_total_product_sold: 0 },
        products: productsResult,
        orders: ordersResult || [],
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
