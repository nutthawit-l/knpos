import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { hashPassword, generateUUID, serializeCookie } from "./helper";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve user details
    const user: any = await context.env.DB.prepare(
      'SELECT id, shop_id, email, password_hash, password_salt, is_verified FROM "user" WHERE email = ?'
    )
      .bind(email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check verification status
    if (user.is_verified === 0) {
      // Re-generate OTP code to allow user to complete verification
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await context.env.DB.prepare(
        "INSERT OR REPLACE INTO otp_verification (email, code, expires_at) VALUES (?, ?, ?)"
      )
        .bind(email, code, expiresAt)
        .run();

      console.log(`\n==================================================`);
      console.log(`[AUTH] Resent Verification OTP for ${email}: ${code}`);
      console.log(`[AUTH] Expires at: ${expiresAt}`);
      console.log(`==================================================\n`);

      return new Response(
        JSON.stringify({ error: "Verification required", email }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate password
    const incomingHash = await hashPassword(password, user.password_salt);
    if (incomingHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve shop name
    let shopName: string | null = null;
    if (user.shop_id) {
      const shop: any = await context.env.DB.prepare(
        "SELECT name FROM shop WHERE id = ?"
      )
        .bind(user.shop_id)
        .first();
      if (shop) {
        shopName = shop.name;
      }
    }

    // Create session
    const sessionId = generateUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(
      "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
      .bind(sessionId, user.id, sessionExpiry)
      .run();

    // Set cookie
    const cookieString = serializeCookie("session_token", sessionId, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
          shopName: shopName,
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
