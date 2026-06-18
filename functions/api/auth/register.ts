import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { hashPassword, generateSalt } from "./helper";

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const existingUser: any = await context.env.DB.prepare(
      'SELECT id, is_verified FROM "user" WHERE email = ?'
    )
      .bind(email)
      .first();

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    let userId: number;

    if (existingUser) {
      if (existingUser.is_verified === 1) {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Existing unverified user: update password
      userId = existingUser.id;

      await context.env.DB.prepare(
        'UPDATE "user" SET password_hash = ?, password_salt = ? WHERE id = ?'
      ).bind(hash, salt, userId).run();
    } else {
      // Create new user
      const userResult = await context.env.DB.prepare(
        'INSERT INTO "user" (email, password_hash, password_salt, is_verified) VALUES (?, ?, ?, 0)'
      )
        .bind(email, hash, salt)
        .run();

      userId = userResult.meta.last_row_id;
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    // Insert or replace verification code
    await context.env.DB.prepare(
      "INSERT OR REPLACE INTO otp_verification (email, code, expires_at) VALUES (?, ?, ?)"
    )
      .bind(email, code, expiresAt)
      .run();

    // Mock email sending by printing to terminal logs
    console.log(`\n==================================================`);
    console.log(`[AUTH] Verification OTP for ${email}: ${code}`);
    console.log(`[AUTH] Expires at: ${expiresAt}`);
    console.log(`==================================================\n`);

    return new Response(JSON.stringify({ success: true, email }), {
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
