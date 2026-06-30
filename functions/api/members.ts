import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

interface MemberRow {
  shop_id: number;
  role: string;
}

interface DbShopMember {
  id: number;
  email: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user shop member details
    const currentMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!currentMember) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve all members of this shop
    const { results } = await context.env.DB.prepare(
      `SELECT u.id, u.email, sm.role
       FROM shop_member sm
       JOIN "user" u ON sm.user_id = u.id
       WHERE sm.shop_id = ?`
    )
      .bind(currentMember.shop_id)
      .all<DbShopMember>();

    // Map database roles to UI roles
    const mapped = (results || []).map((r) => {
      const emailPrefix = r.email.split("@")[0];
      const formattedName = emailPrefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      return {
        id: String(r.id),
        name: formattedName,
        email: r.email,
        role: r.role === "owner" ? "Co-Owner" : "Employee",
        status: "ACTIVE",
      };
    });

    return new Response(JSON.stringify(mapped), {
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

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Session invalid or expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const targetUserIdStr = url.searchParams.get("id");

    if (!targetUserIdStr) {
      return new Response(JSON.stringify({ error: "Missing user id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetUserId = parseInt(targetUserIdStr, 10);
    if (isNaN(targetUserId)) {
      return new Response(JSON.stringify({ error: "Invalid user id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check sender's role (only owners can remove members)
    const currentMember = await context.env.DB.prepare(
      "SELECT shop_id, role FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!currentMember || currentMember.role !== "owner") {
      return new Response(JSON.stringify({ error: "Forbidden: Only owners can remove members" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if target is in the same shop
    const targetMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(targetUserId)
      .first<MemberRow>();

    if (!targetMember || targetMember.shop_id !== currentMember.shop_id) {
      return new Response(JSON.stringify({ error: "Member not found in your shop" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Don't allow owner to remove themselves from shop (must have at least one owner)
    if (targetUserId === session.user_id) {
      return new Response(JSON.stringify({ error: "Cannot remove yourself from the shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete membership association
    await context.env.DB.prepare(
      "DELETE FROM shop_member WHERE user_id = ? AND shop_id = ?"
    )
      .bind(targetUserId, currentMember.shop_id)
      .run();

    return new Response(JSON.stringify({ success: true, message: "Member removed" }), {
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
