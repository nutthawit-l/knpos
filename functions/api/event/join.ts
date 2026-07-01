import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "../auth/helper";

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

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<{ user_id: number; expires_at: string }>();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as { eventId: number };
    const { eventId } = body;

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing eventId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if event exists and get user's shop membership role
    const eventDetails = await context.env.DB.prepare(
      `SELECT e.id, sm.role AS shop_role
       FROM event e
       JOIN shop_member sm ON e.shop_id = sm.shop_id
       WHERE e.id = ? AND sm.user_id = ?`
    )
      .bind(eventId, session.user_id)
      .first<{ id: number; shop_role: string }>();

    if (!eventDetails) {
      return new Response(JSON.stringify({ error: "Event not found or access unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine event role
    const eventRole = eventDetails.shop_role === 'owner' ? 'collaborator' : 'assistant';

    // Insert new member row
    await context.env.DB.prepare(
      `INSERT INTO event_member (event_id, user_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(event_id, user_id) DO UPDATE SET role = ?`
    )
      .bind(eventId, session.user_id, eventRole, eventRole)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
