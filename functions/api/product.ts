import type { PagesFunction, D1Database, R2Bucket } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
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

    // Lookup session
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

    const url = new URL(context.request.url);
    const shopIdStr = url.searchParams.get("shop_id");
    const limit = url.searchParams.get("limit");
    const fields = url.searchParams.get("fields");

    if (shopIdStr && limit === "1" && fields === "id") {
      const targetShopId = parseInt(shopIdStr, 10);
      if (isNaN(targetShopId)) {
        return new Response(JSON.stringify({ success: true, exists: false }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const row = await context.env.DB.prepare(
        "SELECT id FROM product WHERE shop_id = ? LIMIT 1"
      )
        .bind(targetShopId)
        .first<{ id: number } | null>();

      return new Response(
        JSON.stringify({
          success: true,
          exists: row !== null,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's shop membership
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

    // Group rows by product ID to construct dynamic prices dictionary
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

    const products = Array.from(productMap.values());

    return new Response(JSON.stringify(products), {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup session
    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify({ error: "User does not belong to any shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Enable Foreign Key support
    await context.env.DB.prepare("PRAGMA foreign_keys = ON;").run();

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

    let prices: Record<string, number> = {};
    if (pricesStr) {
      try {
        prices = JSON.parse(pricesStr);
      } catch {
        return new Response('Invalid prices format', { status: 400 });
      }
    }

    // Must have at least a Thai Baht price (THB)
    if (typeof prices['THB'] !== 'number' || isNaN(prices['THB'])) {
      return new Response('Thai Price (THB) is required', { status: 400 });
    }

    const filename = `${Date.now()}-${imageFile.name}`;
    await context.env.IMAGES_BUCKET.put(filename, imageFile.stream());
    const urlObj = new URL(context.request.url);
    const isLocal = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    const r2PublicUrl = isLocal ? '/api/images' : context.env.R2_PUBLIC_URL;
    const imageUrl = `${r2PublicUrl}/${filename}`;

    const productInsert = context.env.DB.prepare(
      `INSERT INTO product (name, image_url, shop_id, category_id, stock) VALUES (?, ?, ?, ?, ?)`
    ).bind(name, imageUrl, shopMember.shop_id, categoryId, stock);

    const priceStatements = Object.entries(prices)
      .filter(([_, price]) => price !== null && price !== undefined && !isNaN(price))
      .map(([currency, price]) =>
        context.env.DB.prepare(
          `INSERT INTO product_price (product_id, currency_code, price)
           VALUES ((SELECT MAX(id) FROM product WHERE shop_id = ?), ?, ?)`
        ).bind(shopMember.shop_id, currency.toUpperCase(), price)
      );

    const batchResult = await context.env.DB.batch([productInsert, ...priceStatements]);
    const success = batchResult.every((res) => res.success);

    if (success) {
      return new Response(JSON.stringify({ success: true, imageUrl }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database insert failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup session
    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify({ error: "User does not belong to any shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Enable Foreign Key support
    await context.env.DB.prepare("PRAGMA foreign_keys = ON;").run();

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

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productId = parseInt(id);

    // Verify product belongs to user's shop
    const productRecord = await context.env.DB.prepare(
      "SELECT shop_id FROM product WHERE id = ?"
    )
      .bind(productId)
      .first<{ shop_id: number }>();

    if (!productRecord) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (productRecord.shop_id !== shopMember.shop_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
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

    let prices: Record<string, number> = {};
    if (pricesStr) {
      try {
        prices = JSON.parse(pricesStr);
      } catch {
        return new Response('Invalid prices format', { status: 400 });
      }
    }

    if (typeof prices['THB'] !== 'number' || isNaN(prices['THB'])) {
      return new Response('Thai Price (THB) is required', { status: 400 });
    }

    let imageUrl = formData.get('image_url') as string || '';
    const imageFile = formData.get('image') as unknown as File;

    if (imageFile && imageFile.name) {
      const filename = `${Date.now()}-${imageFile.name}`;
      await context.env.IMAGES_BUCKET.put(filename, imageFile.stream());
      const urlObj = new URL(context.request.url);
      const isLocal = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
      const r2PublicUrl = isLocal ? '/api/images' : context.env.R2_PUBLIC_URL;
      imageUrl = `${r2PublicUrl}/${filename}`;
    }

    const updateProduct = context.env.DB.prepare(
      `UPDATE product SET name = ?, image_url = ?, category_id = ?, stock = ? WHERE id = ? AND shop_id = ?`
    ).bind(name, imageUrl, categoryId, stock, productId, shopMember.shop_id);

    const deletePrices = context.env.DB.prepare(
      `DELETE FROM product_price WHERE product_id = ?`
    ).bind(productId);

    const priceStatements = Object.entries(prices)
      .filter(([_, price]) => price !== null && price !== undefined && !isNaN(price))
      .map(([currency, price]) =>
        context.env.DB.prepare(
          `INSERT INTO product_price (product_id, currency_code, price) VALUES (?, ?, ?)`
        ).bind(productId, currency.toUpperCase(), price)
      );

    const batchResult = await context.env.DB.batch([updateProduct, deletePrices, ...priceStatements]);
    const success = batchResult.every((res) => res.success);

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database update failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup session
    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify({ error: "User does not belong to any shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Enable Foreign Key support
    await context.env.DB.prepare("PRAGMA foreign_keys = ON;").run();

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const productId = parseInt(id);

    // Verify product belongs to user's shop
    const productRecord = await context.env.DB.prepare(
      "SELECT shop_id FROM product WHERE id = ?"
    )
      .bind(productId)
      .first<{ shop_id: number }>();

    if (!productRecord) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (productRecord.shop_id !== shopMember.shop_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { success } = await context.env.DB.prepare(
      'DELETE FROM product WHERE id = ? AND shop_id = ?'
    )
      .bind(productId, shopMember.shop_id)
      .run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database deletion failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
