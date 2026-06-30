import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie, generateUUID } from "../auth/helper";

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

    // Authenticate sender
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

    // Fetch body
    const body: any = await context.request.json();
    const { email, role } = body; // role should be "owner" or "employee"

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Missing email or role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate email ends with @gmail.com
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Only Gmail addresses are supported for invitations" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (role !== "owner" && role !== "employee") {
      return new Response(JSON.stringify({ error: "Invalid role specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check sender's shop membership (must be shop member)
    const senderMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!senderMember) {
      return new Response(JSON.stringify({ error: "Sender is not associated with any shop" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inviteToken = generateUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry

    // Insert or replace invitation
    await context.env.DB.prepare(
      `INSERT OR REPLACE INTO shop_member_invite (shop_id, email, role, token, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(senderMember.shop_id, trimmedEmail, role, inviteToken, expiresAt)
      .run();

    // Log the invitation URL to the console (simulating sending the email)
    const url = new URL(context.request.url);
    const inviteLink = `${url.origin}/accept-invite?token=${inviteToken}`;
    console.log(`\n==================================================`);
    console.log(`[INVITE] Invitation link for ${trimmedEmail}:`);
    console.log(`${inviteLink}`);
    console.log(`Role: ${role}`);
    console.log(`Expires at: ${expiresAt}`);
    console.log(`==================================================\n`);

    return new Response(JSON.stringify({ success: true, message: "Invitation sent successfully" }), {
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
