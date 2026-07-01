import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { generateUUID, serializeCookie } from "../auth/helper";

export interface Env {
  DB: D1Database;
}

interface InviteRow {
  shop_id: number;
  email: string;
  role: string;
  expires_at: string;
}

interface UserRow {
  id: number;
  email: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing invitation token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve invite details
    const invite = await context.env.DB.prepare(
      "SELECT shop_id, email, role, expires_at FROM shop_member_invite WHERE token = ?"
    )
      .bind(token)
      .first<InviteRow>();

    if (!invite) {
      return new Response(JSON.stringify({ error: "Invalid or expired invitation link" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      // Clean up expired invite
      await context.env.DB.prepare("DELETE FROM shop_member_invite WHERE token = ?").bind(token).run();
      return new Response(JSON.stringify({ error: "Invitation link has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create user
    let user = await context.env.DB.prepare(
      'SELECT id, email FROM "user" WHERE email = ?'
    )
      .bind(invite.email)
      .first<UserRow>();

    if (!user) {
      const dummyPasswordHash = generateUUID();
      const dummySalt = generateUUID();

      // Create new user (automatically verified)
      const userResult = await context.env.DB.prepare(
        'INSERT INTO "user" (email, password_hash, password_salt, is_verified) VALUES (?, ?, ?, 1) RETURNING id, email'
      )
        .bind(invite.email, dummyPasswordHash, dummySalt)
        .first<UserRow>();

      if (!userResult) {
        throw new Error("Failed to auto-register user account");
      }
      user = userResult;
    }

    // Check/Insert shop member association
    await context.env.DB.prepare(
      `INSERT OR IGNORE INTO shop_member (shop_id, user_id, role)
       VALUES (?, ?, ?)`
    )
      .bind(invite.shop_id, user.id, invite.role)
      .run();

    // Delete the invitation since it was accepted successfully
    await context.env.DB.prepare("DELETE FROM shop_member_invite WHERE token = ?").bind(token).run();

    // Authenticate the user and create session
    const sessionId = generateUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(
      "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
      .bind(sessionId, user.id, sessionExpiry)
      .run();

    // Serialize Cookie
    const cookieString = serializeCookie("session_token", sessionId, {
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieString,
        },
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
