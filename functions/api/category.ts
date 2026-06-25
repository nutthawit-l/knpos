import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
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

    const { results } = await context.env.DB.prepare(
      "SELECT id, name FROM category WHERE shop_id = ? ORDER BY name ASC"
    )
      .bind(shopMember.shop_id)
      .all();

    return new Response(JSON.stringify(results), {
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
