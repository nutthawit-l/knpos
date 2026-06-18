import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

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

    // Lookup session
    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id, role FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify({ error: "User does not belong to any shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: any = await context.request.json();
    const {
      eventName,
      country,
      startDate,
      endDate,
      boothRental,
      travel,
      accommodation,
      foodAllowance,
    } = body;

    if (!eventName || !eventName.trim() || !country || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Enable foreign keys
    await context.env.DB.prepare("PRAGMA foreign_keys = ON;").run();

    // 1. Create the event
    const eventResult = await context.env.DB.prepare(
      `INSERT INTO event (shop_id, name, country, start_date, end_date, booth_rental, travel, accommodation, food_allowance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        shopMember.shop_id,
        eventName.trim(),
        country.trim(),
        startDate,
        endDate,
        parseFloat(boothRental) || 0,
        parseFloat(travel) || 0,
        parseFloat(accommodation) || 0,
        parseFloat(foodAllowance) || 0
      )
      .run();

    const eventId = eventResult.meta.last_row_id;
    if (!eventId) {
      throw new Error("Failed to insert event record.");
    }

    // 2. Fetch other owners in the shop to auto-assign them as 'shop_owner'
    const { results: otherOwners } = await context.env.DB.prepare(
      "SELECT user_id FROM shop_member WHERE shop_id = ? AND role = 'owner' AND user_id != ?"
    )
      .bind(shopMember.shop_id, session.user_id)
      .all<{ user_id: number }>();

    // 3. Batch insert creator and other owners into event_member
    const memberStatements = [
      context.env.DB.prepare(
        "INSERT INTO event_member (event_id, user_id, role) VALUES (?, ?, 'event_creator')"
      ).bind(eventId, session.user_id)
    ];

    for (const owner of otherOwners) {
      memberStatements.push(
        context.env.DB.prepare(
          "INSERT INTO event_member (event_id, user_id, role) VALUES (?, ?, 'shop_owner')"
        ).bind(eventId, owner.user_id)
      );
    }

    await context.env.DB.batch(memberStatements);

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: eventId,
          name: eventName,
          country,
          startDate,
          endDate,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup session
    const session: any = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember: any = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first();

    if (!shopMember) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve all events for this shop with the user's specific event role (if any)
    const { results } = await context.env.DB.prepare(
      `SELECT 
        e.id, 
        e.shop_id, 
        e.name, 
        e.country, 
        e.start_date AS startDate, 
        e.end_date AS endDate, 
        e.booth_rental AS boothRental, 
        e.travel, 
        e.accommodation, 
        e.food_allowance AS foodAllowance, 
        em.role
       FROM event e
       LEFT JOIN event_member em ON e.id = em.event_id AND em.user_id = ?
       WHERE e.shop_id = ?
       ORDER BY e.start_date DESC`
    )
      .bind(session.user_id, shopMember.shop_id)
      .all();

    return new Response(JSON.stringify(results), {
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
