import type { PagesFunction } from "@cloudflare/workers-types";
import { generateUUID, serializeCookie } from "./helper";

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string; // Optional but recommended to verify audience
}

interface GoogleLoginRequest {
  token: string;
}

interface GoogleTokenPayload {
  // Issuer (e.g., "https://accounts.google.com")
  iss: string;
  // The unique Google User Id (subject)
  sub: string;
  // Client ID audience
  aud: string;
  // User's email address
  email: string;
  // Google's API can return this as true/false OR "true"/"false"
  email_verified: boolean | string;
  // User's full name (optional)
  name?: string;
  // URL of the user's profile picture (optional)
  picture?: string;
  // exp: string | number;
}

// Define the shape of the user row in the database
interface DBUser {
  id: number; // SQLite AUTOINCREMENT is a number
  email: string;
  is_verified: number; // SQLite represents BOOLEAN as INTEGER (0 or 1)
  password_hash?: string;
  password_salt?: string;
}

// Define the shape of the shop member query result
interface ShopMemberDetails {
  shop_id: number;
  shop_name: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as GoogleLoginRequest;
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Google token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Verify Google token using Google's public tokeninfo endpoint
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
    const googleResponse = await fetch(googleVerifyUrl);

    if (!googleResponse.ok) {
      return new Response(JSON.stringify({ error: "Invalid Google token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = (await googleResponse.json()) as GoogleTokenPayload
    const { email, name, email_verified } = payload;

    // Google API can return email_verified as a boolean or string "true"
    const isEmailVerified =
      email_verified === true || email_verified === "true";

    if (!isEmailVerified) {
      return new Response(JSON.stringify({ error: "Google email is not verified" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // (Optional) Validate client ID audience if configured in .dev.vars or environment
    if (context.env.GOOGLE_CLIENT_ID && payload.aud !== context.env.GOOGLE_CLIENT_ID) {
      return new Response(JSON.stringify({ error: "Token audience mismatch" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Check if user already exists in D1
    let user = await context.env.DB.prepare(
      'SELECT id, email, is_verified FROM "user" WHERE email = ?'
    )
      .bind(email)
      .first<DBUser>();

    // 3. If user doesn't exist, auto-register them
    if (!user) {
      // For Google OAuth, passwords aren't used, but we populate fields to satisfy D1 constraints
      const randomPasswordHash = generateUUID();
      const randomSalt = generateUUID();

      const result = await context.env.DB.prepare(
        'INSERT INTO "user" (email, password_hash, password_salt, is_verified) VALUES (?, ?, ?, 1) RETURNING id, email, is_verified'
      )
        .bind(email, randomPasswordHash, randomSalt)
        .first<DBUser>();

      // Ensure result is not null before assigning
      if (!result) {
        throw new Error("Failed to register user");
      }

      user = result;

    } else if (user.is_verified === 0) {
      // Ensure existing unverified local users are marked verified upon signing in with Google
      await context.env.DB.prepare('UPDATE "user" SET is_verified = 1 WHERE id = ?')
        .bind(user.id)
        .run();
      user.is_verified = 1;
    }

    // Retrieve user and shop info
    const userProfile: any = await context.env.DB.prepare(
      `SELECT u.id, u.email, sm.shop_id, s.name as shop_name, p.id as product_id
       FROM "user" u
       LEFT JOIN shop_member sm ON u.id = sm.user_id
       LEFT JOIN shop s ON sm.shop_id = s.id
       LEFT JOIN product p ON s.id = p.shop_id
       WHERE u.id = ?`
    )
      .bind(user.id)
      .first();

    const isShopEmpty = userProfile.product_id ? true : false;

    // 5. Create active session
    const sessionId = generateUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(
      "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
      .bind(sessionId, user.id, sessionExpiry)
      .run();

    // 6. Set httpOnly Session Cookie
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
          name: name || email.split("@")[0],
          shopName: userProfile.shop_name || null,
          shopId: userProfile.shop_id || null,
          isOnboardingComplete: isShopEmpty,
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
