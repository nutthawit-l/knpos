import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./helper";

export interface Env {
  DB: D1Database;
}

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
      .bind(shopName)
      .run();

    const shopId = shopResult.meta.last_row_id;
    if (!shopId) {
      throw new Error("Failed to create shop record.");
    }

    // Update user's shop_id
    await context.env.DB.prepare(
      'UPDATE "user" SET shop_id = ? WHERE id = ?'
    )
      .bind(shopId, session.user_id)
      .run();

    // Fetch updated user profile
    const userProfile: any = await context.env.DB.prepare(
      'SELECT u.id, u.email, u.shop_id, s.name as shop_name FROM "user" u JOIN shop s ON u.shop_id = s.id WHERE u.id = ?'
    )
      .bind(session.user_id)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          shopName: userProfile.shop_name,
          shopId: userProfile.shop_id,
        },
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
