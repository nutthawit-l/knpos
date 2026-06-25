import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./helper";

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
      // Clean up expired session
      await context.env.DB.prepare("DELETE FROM session WHERE id = ?")
        .bind(token)
        .run();

      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve user and shop info
    const userProfile: any = await context.env.DB.prepare(
      `SELECT u.id, u.email, sm.shop_id, s.name as shop_name, p.id as product_id
       FROM "user" u
       LEFT JOIN shop_member sm ON u.id = sm.user_id
       LEFT JOIN shop s ON sm.shop_id = s.id
       LEFT JOIN product p ON s.id = p.shop_id
       WHERE u.id = ?`
    )
      .bind(session.user_id)
      .first();

    if (!userProfile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("userProfile:", userProfile)
    const isShopEmpty = userProfile.product_id ? true : false;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          shopName: userProfile.shop_name || null,
          shopId: userProfile.shop_id || null,
          isOnboardingComplete: isShopEmpty,
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
