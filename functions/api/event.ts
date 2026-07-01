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

    // 2. Insert creator into event_member with role 'creator'
    await context.env.DB.prepare(
      "INSERT INTO event_member (event_id, user_id, role) VALUES (?, ?, 'creator')"
    )
      .bind(eventId, session.user_id)
      .run();


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

    const url = new URL(context.request.url);
    const eventIdParam = url.searchParams.get("id");
    if (eventIdParam) {
      const eventId = parseInt(eventIdParam, 10);
      const eventRecord = await context.env.DB.prepare(
        `SELECT e.id, e.name, e.country, e.start_date AS startDate, e.end_date AS endDate, 
                e.booth_rental AS boothRental, e.travel, e.accommodation, e.food_allowance AS foodAllowance,
                em.role, (CASE WHEN em.role IS NOT NULL THEN 1 ELSE 0 END) AS isJoined
         FROM event e
         LEFT JOIN event_member em ON e.id = em.event_id AND em.user_id = ?1
         WHERE e.id = ?2 AND e.shop_id = ?3`
      ).bind(session.user_id, eventId, shopMember.shop_id).first();
      
      if (!eventRecord) {
        return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
      }
      return new Response(JSON.stringify(eventRecord), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract today from URL parameters
    const today = url.searchParams.get("today") || new Date().toISOString().split("T")[0];

    // Retrieve all events for this shop with calculated status, total sales, and net profit
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
        em.role,
        (CASE WHEN em.role IS NOT NULL THEN 1 ELSE 0 END) AS isJoined,
        CASE 
            WHEN ?3 < e.start_date THEN 'upcoming'
            WHEN ?3 BETWEEN e.start_date AND e.end_date THEN 'inprogress'
            ELSE 'ended'
        END AS status,
        COALESCE((SELECT SUM(o.total_income) FROM "order" o WHERE o.event_id = e.id), 0) AS totalSales,
        (COALESCE((SELECT SUM(o.total_income) FROM "order" o WHERE o.event_id = e.id), 0) - (COALESCE(e.booth_rental, 0) + COALESCE(e.travel, 0) + COALESCE(e.accommodation, 0) + COALESCE(e.food_allowance, 0))) AS netProfit
       FROM event e
       LEFT JOIN event_member em ON e.id = em.event_id AND em.user_id = ?1
       WHERE e.shop_id = ?2
       ORDER BY e.start_date DESC`
    )
      .bind(session.user_id, shopMember.shop_id, today)
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

export const onRequestPut: PagesFunction<Env> = async (context) => {
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

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's shop membership
    const shopMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<{ shop_id: number }>();

    if (!shopMember) {
      return new Response(JSON.stringify({ error: "User does not belong to any shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    interface PutBody {
      id: number;
      eventName: string;
      country: string;
      startDate: string;
      endDate: string;
      boothRental: string;
      travel: string;
      accommodation: string;
      foodAllowance: string;
    }
    const body = await context.request.json() as PutBody;
    const {
      id,
      eventName,
      country,
      startDate,
      endDate,
      boothRental,
      travel,
      accommodation,
      foodAllowance,
    } = body;

    if (!id || !eventName || !eventName.trim() || !country || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the event exists and belongs to the user's shop
    const existingEvent = await context.env.DB.prepare(
      "SELECT id FROM event WHERE id = ? AND shop_id = ?"
    )
      .bind(id, shopMember.shop_id)
      .first();

    if (!existingEvent) {
      return new Response(JSON.stringify({ error: "Event not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user is the creator of the event
    const userRole = await context.env.DB.prepare(
      "SELECT role FROM event_member WHERE event_id = ? AND user_id = ?"
    )
      .bind(id, session.user_id)
      .first<{ role: string }>();

    if (!userRole || userRole.role !== 'creator') {
      return new Response(JSON.stringify({ error: "Only the event creator can edit this event." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the event
    await context.env.DB.prepare(
      `UPDATE event 
       SET name = ?, country = ?, start_date = ?, end_date = ?, 
           booth_rental = ?, travel = ?, accommodation = ?, food_allowance = ?
       WHERE id = ? AND shop_id = ?`
    )
      .bind(
        eventName.trim(),
        country.trim(),
        startDate,
        endDate,
        parseFloat(boothRental) || 0,
        parseFloat(travel) || 0,
        parseFloat(accommodation) || 0,
        parseFloat(foodAllowance) || 0,
        id,
        shopMember.shop_id
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id,
          name: eventName,
          country,
          startDate,
          endDate,
        },
      }),
      {
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
