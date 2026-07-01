import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie, generateUUID } from "../auth/helper";

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
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

    // Check sender's shop membership (must be shop member) and get shop name
    const senderMember = await context.env.DB.prepare(
      `SELECT sm.shop_id, s.name as shop_name
       FROM shop_member sm
       JOIN shop s ON sm.shop_id = s.id
       WHERE sm.user_id = ?`
    )
      .bind(session.user_id)
      .first<{ shop_id: number; shop_name: string }>();

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

    // Log the invitation URL and trigger Resend email if key is configured
    const url = new URL(context.request.url);
    const inviteLink = `${url.origin}/accept-invite?token=${inviteToken}`;

    let emailSent = false;
    let emailError = "";

    if (context.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Charni POS <no-reply@charni-pos.ntwtech.com>",
            to: trimmedEmail,
            subject: `Invitation to join ${senderMember.shop_name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4E342E;">You've been invited!</h2>
                <p>Hello,</p>
                <p>You have been invited to join <strong>${senderMember.shop_name}</strong> as a <strong>${role === 'owner' ? 'Co-Owner' : 'Employee'}</strong>.</p>
                <p>Click the button below to accept the invitation and access your dashboard instantly:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" style="background-color: #EC4899; color: #4E342E; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="font-size: 12px; color: #777;">If the button doesn't work, copy and paste this link into your browser: <br/> <a href="${inviteLink}">${inviteLink}</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #999;">This invitation was sent to ${trimmedEmail} and expires in 24 hours.</p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          emailError = await res.text();
          console.error("[RESEND ERROR]", emailError);
        }
      } catch (e: any) {
        emailError = e.message || String(e);
        console.error("[RESEND FETCH ERROR]", e);
      }
    }

    // Always log to console as fallback/verification in local development
    console.log(`\n==================================================`);
    if (emailSent) {
      console.log(`[INVITE] Real email sent via Resend to ${trimmedEmail}`);
    } else {
      console.log(`[INVITE] (SIMULATED) Invitation link for ${trimmedEmail}:`);
      if (context.env.RESEND_API_KEY) {
        console.log(`Failed to send email via Resend: ${emailError}`);
      } else {
        console.log(`(RESEND_API_KEY is not configured)`);
      }
    }
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
