import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const fields = url.searchParams.get('fields');
    let userIdStr = url.searchParams.get("user_id");

    // Fallback: if user_id query parameter is not present, try to get it from the authenticated session
    if (!userIdStr) {
      const cookieHeader = context.request.headers.get("Cookie");
      const token = getCookie(cookieHeader, "session_token");

      if (token) {
        // Lookup session
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

    if (fields == "shop_id") {
      // Query shop_member details
      const shopId = await context.env.DB.prepare(
        `SELECT shop_id
        FROM shop_member
        WHERE user_id = ?`
      )
        .bind(userId)
        .first<number | null>();

      if (!shopId) {
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
