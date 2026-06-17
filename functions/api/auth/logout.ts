import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie, serializeCookie } from "./helper";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (token) {
      // Remove session from DB
      await context.env.DB.prepare("DELETE FROM session WHERE id = ?")
        .bind(token)
        .run();
    }

    // Overwrite the cookie to clear it
    const clearCookieString = serializeCookie("session_token", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearCookieString,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
