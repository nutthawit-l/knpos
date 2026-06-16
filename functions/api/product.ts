import type { PagesFunction, D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.image_url, 
        p.created_at,
        pp.currency_code,
        pp.price
      FROM product p
      LEFT JOIN product_price pp ON p.id = pp.product_id
      ORDER BY p.created_at DESC
    `).all();

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
    // Enable Foreign Key support
    await context.env.DB.prepare("PRAGMA foreign_keys = ON;").run();

    const formData = await context.request.formData();

    const name = formData.get('name') as string;
    const pricesStr = formData.get('prices') as string;
    const imageFile = formData.get('image') as unknown as File;

    if (!name || !imageFile || !imageFile.name) {
      return new Response('Missing required fields', { status: 400 });
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
    const imageUrl = `${context.env.R2_PUBLIC_URL}/${filename}`;

    const productInsert = context.env.DB.prepare(
      `INSERT INTO product (name, image_url) VALUES (?, ?)`
    ).bind(name, imageUrl);

    const priceStatements = Object.entries(prices)
      .filter(([_, price]) => price !== null && price !== undefined && !isNaN(price))
      .map(([currency, price]) =>
        context.env.DB.prepare(
          `INSERT INTO product_price (product_id, currency_code, price) 
           VALUES ((SELECT MAX(id) FROM product), ?, ?)`
        ).bind(currency.toUpperCase(), price)
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
    const formData = await context.request.formData();
    const name = formData.get('name') as string;
    const pricesStr = formData.get('prices') as string;

    if (!name) {
      return new Response('Missing required fields', { status: 400 });
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
      imageUrl = `${context.env.R2_PUBLIC_URL}/${filename}`;
    }

    const updateProduct = context.env.DB.prepare(
      `UPDATE product SET name = ?, image_url = ? WHERE id = ?`
    ).bind(name, imageUrl, productId);

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

    const { success } = await context.env.DB.prepare(
      'DELETE FROM product WHERE id = ?'
    )
      .bind(parseInt(id))
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
