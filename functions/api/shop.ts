import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

// GET: Retrieve shop ID for a user
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const fields = url.searchParams.get('fields');
    const limit = url.searchParams.get('limit');
    let userIdStr = url.searchParams.get("user_id");

    if (!userIdStr) {
      const cookieHeader = context.request.headers.get("Cookie");
      const token = getCookie(cookieHeader, "session_token");

      if (token) {
        const session = await context.env.DB.prepare(
          "SELECT user_id, expires_at FROM session WHERE id = ?"
        )
          .bind(token)
          .first<SessionRow>();

        if (session) {
          const expiresAt = new Date(session.expires_at).getTime();
          if (expiresAt >= Date.now()) {
            userIdStr = String(session.user_id);
          }
        }
      }
    }

    if (!userIdStr) {
      return new Response(
        JSON.stringify({ error: "user_id query parameter is required or user must be authenticated" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (fields == "id" && limit == "1") {
      const row = await context.env.DB.prepare(
        `SELECT shop_id
        FROM shop_member
        WHERE user_id = ?`
      )
        .bind(userId)
        .first<{ shop_id: number } | null>();

      const shopId = row ? row.shop_id : null;

      if (shopId === null) {
        return new Response(
          JSON.stringify({
            success: true,
            exists: false,
            shopId: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          shopId: shopId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST: Create a new shop and assign user as Owner
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

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

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

    const body: any = await context.request.json();
    const { shopName } = body;

    if (!shopName || !shopName.trim()) {
      return new Response(JSON.stringify({ error: "Shop name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert shop
    const shopResult = await context.env.DB.prepare(
      "INSERT INTO shop (name) VALUES (?)"
    )
      .bind(shopName.trim())
      .run();

    const shopId = shopResult.meta.last_row_id;
    if (!shopId) {
      throw new Error("Failed to create shop record.");
    }

    // Insert membership into shop_member as Owner
    await context.env.DB.prepare(
      'INSERT INTO shop_member (shop_id, user_id, role) VALUES (?, ?, ?)'
    )
      .bind(shopId, session.user_id, 'owner')
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        shopId: shopId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
