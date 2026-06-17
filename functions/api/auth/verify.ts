import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { generateUUID, serializeCookie } from "./helper";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { email, code } = body;

    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Missing email or code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the verification code from the DB
    const verification: any = await context.env.DB.prepare(
      "SELECT code, expires_at FROM otp_verification WHERE email = ?"
    )
      .bind(email)
      .first();

    if (!verification || verification.code !== code) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(verification.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Verification code expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve user and shop info
    const userProfile: any = await context.env.DB.prepare(
      'SELECT u.id, u.email, s.name as shop_name FROM "user" u LEFT JOIN shop s ON u.shop_id = s.id WHERE u.email = ?'
    )
      .bind(email)
      .first();

    if (!userProfile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update user as verified and delete verification record
    const verifyUser = context.env.DB.prepare(
      'UPDATE "user" SET is_verified = 1 WHERE id = ?'
    ).bind(userProfile.id);

    const deleteOtp = context.env.DB.prepare(
      "DELETE FROM otp_verification WHERE email = ?"
    ).bind(email);

    await context.env.DB.batch([verifyUser, deleteOtp]);

    // Create session
    const sessionId = generateUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(
      "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
      .bind(sessionId, userProfile.id, sessionExpiry)
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
          id: userProfile.id,
          email: userProfile.email,
          shopName: userProfile.shop_name || null,
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
