# Conditional Dashboard States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the POS Dashboard to conditionally show the Shop Summary (Bento grid) and reuse the Recent Events section based on the presence of finished (ended) events fetched dynamically from the database.

**Architecture:** Update the backend API (`/api/event`) to fetch real events, compute their dynamic status, and aggregate sales/profits in SQLite. Update the frontend `Dashboard.tsx` to call this API, determine if there are any ended events, and adjust sections accordingly.

**Tech Stack:** React, TypeScript, Cloudflare D1 (SQLite), Tailwind CSS.

## Global Constraints

- Follow the conventional commits standard.
- Avoid introducing unused dependencies.
- Ensure TypeScript compiles successfully with no errors.
- Ensure ESLint checks pass.

---

### Task 1: Update Backend API to Fetch Events with Sales, Profits, and Status

**Files:**
- Modify: `functions/api/event.ts`

**Interfaces:**
- Consumes: GET `/api/event?today=YYYY-MM-DD` query parameter.
- Produces: JSON array of events with fields `status`, `totalSales`, and `netProfit`.

- [ ] **Step 1: Update API code in `functions/api/event.ts`**
  Modify the `onRequestGet` function starting from line 150 to extract `today` query parameter and perform the aggregate query.

  ```typescript
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

      // Extract today from URL parameters
      const url = new URL(context.request.url);
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
  ```

- [ ] **Step 2: Verify code compiles**
  Run: `pnpm build`
  Expected: No TypeScript or build compilation errors.

- [ ] **Step 3: Run ESLint to verify formatting**
  Run: `pnpm lint`
  Expected: No linting violations.

- [ ] **Step 4: Commit changes**
  ```bash
  git add functions/api/event.ts
  git commit -m "feat(api): calculate dynamic status and aggregates in event GET handler"
  ```

---

### Task 2: Implement Dynamic Dashboard with Conditional States

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: Events array from `/api/event`.
- Produces: Dynamically rendered Dashboard component based on event state.

- [ ] **Step 1: Update component in `src/pages/Dashboard.tsx`**
  Modify `src/pages/Dashboard.tsx` to handle state loading, API fetching, filtering, and styling.

  ```typescript
  import { useState, useEffect } from 'react';
  import { Store, Calendar, TrendingUp, PlusCircle, Loader2 } from 'lucide-react';
  import { DASHBOARD2_DATA } from '../data/mockData';

  export interface DashboardProp {
    readonly onNavigate?: (tab: string) => void;
  }

  interface EventData {
    id: number;
    shop_id: number;
    name: string;
    country: string;
    startDate: string;
    endDate: string;
    boothRental: number;
    travel: number;
    accommodation: number;
    foodAllowance: number;
    role: string | null;
    status: 'upcoming' | 'inprogress' | 'ended';
    totalSales: number;
    netProfit: number;
  }

  const CURRENCY_SYMBOLS: Record<string, string> = {
    'Thailand': '฿',
    'Singapore': 'S$',
    'USA': '$',
    'Japan': '¥',
  };

  const FALLBACK_IMAGES = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA26HQI-qdJAvzLtbtiSB1a6t9L-M7mMng7ieiMdxU_iprolC16B8jxM4KCINz78XguSTlBa48kJ5M8bjmNj0oed6UkgLVSwUfxK7FYUCaujX1qK7erq6voKLWO9kLHTDK7oxMNr9D7IEqD5kNPhFhd3xEcROPYINGMBKaSribquSk4XXqCrDTDw7K8bbphMukuUDpALB9vC5cTMhvO_hBWPumziFEoHQd08ZXOlnXKAwNH2POhcH-Ssbt884610PJAcCcHv31qAz0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAzzCCWPKVC8c4C6G8DNKs-aBMj-bte3RJF3klOsKETSlbpGqGjO_qmZOsvWFefamanxVHGdzXfhb6d1ENwxKmf-jd5L-dYcXxxd9UYiQuHjnBbn2N76OZ3h2WMa8wNBO4AplTsD28XLokhxmADvJLSKpbl_rrFnyL4EYHvAHr17fv0yxUVt4FnSM7dLn-yM6nlCf7xMzETZ3sO4CnQjz17lYnW6s2ynTnm6VggDerW8ji3ELBvle34wKnPYwQEjEJusag4oXx9Cgk',
  ];

  export default function Dashboard({ onNavigate }: DashboardProp) {
    const [events, setEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      let active = true;
      setIsLoading(true);

      fetch(`/api/event?today=${todayStr}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch events');
          return res.json();
        })
        .then((data) => {
          if (active) {
            setEvents(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (active) {
            setIsLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, []);

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#805062]" />
          <p className="text-[14px] text-text-brown/70 font-medium">Loading dashboard...</p>
        </div>
      );
    }

    const hasEndedEvent = events.some((e) => e.status === 'ended');
    const displayedEvents = hasEndedEvent 
      ? events 
      : events.filter((e) => e.status === 'inprogress' || e.status === 'upcoming');

    // Title label for the events list
    const eventsHeaderLabel = hasEndedEvent ? DASHBOARD2_DATA.pastEventsLabel : 'Current & Upcoming Events';

    return (
      <>
        {/* Shop Summary Section (State 2 only: shown if at least one ended event exists) */}
        {hasEndedEvent && (
          <section className="space-y-3">
            <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
              {DASHBOARD2_DATA.headerTitle}
            </h2>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Sales Card */}
              <div className="col-span-2 bg-[#f8bbd0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[12px] font-medium text-[#76485a] opacity-80">
                    {DASHBOARD2_DATA.totalSalesLabel}
                  </p>
                  <h3 className="text-[28px] font-bold text-[#76485a] leading-none mt-1">
                    {DASHBOARD2_DATA.totalSalesValue}
                  </h3>
                </div>
                <div className="mt-4 flex items-center text-[#76485a] font-bold text-[12px]">
                  <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                  <span>{DASHBOARD2_DATA.totalSalesTrend}</span>
                </div>
              </div>

              {/* Active Shops Card */}
              <div className="bg-[#b5e7fe] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
                <div>
                  <Store className="w-5 h-5 text-[#37697d] mb-2" />
                  <p className="text-[12px] font-medium text-[#37697d] opacity-80">
                    {DASHBOARD2_DATA.activeShopsLabel}
                  </p>
                </div>
                <h3 className="text-[24px] font-bold text-[#37697d] leading-none mt-2">
                  {DASHBOARD2_DATA.activeShopsValue}
                </h3>
              </div>

              {/* Events this Year Card */}
              <div className="bg-[#fddeb0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
                <div>
                  <Calendar className="w-5 h-5 text-[#68522f] mb-2" />
                  <p className="text-[12px] font-medium text-[#68522f] opacity-80">
                    {DASHBOARD2_DATA.eventsYearLabel}
                  </p>
                </div>
                <h3 className="text-[24px] font-bold text-[#68522f] leading-none mt-2">
                  {DASHBOARD2_DATA.eventsYearValue}
                </h3>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Events Section (reused) */}
        {displayedEvents.length > 0 && (
          <section className="space-y-3">
            <div className="flex justify-between items-end">
              <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
                {eventsHeaderLabel}
              </h2>
              {hasEndedEvent && (
                <button
                  onClick={() => alert('Viewing all events will be supported in the next update! 🐾')}
                  className="text-[#805062] font-bold text-[12px] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  {DASHBOARD2_DATA.viewAllLabel}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {displayedEvents.map((event, idx) => {
                const currencySym = CURRENCY_SYMBOLS[event.country] || '฿';
                const formattedSales = `${currencySym}${event.totalSales.toLocaleString()}`;
                
                // Determine Badge styling & text
                let badgeText = '';
                let badgeClass = '';
                const isLoss = event.netProfit < 0;

                if (event.status === 'inprogress') {
                  badgeText = 'In Progress';
                  badgeClass = 'bg-[#d1fae5] text-[#065f46]';
                } else if (event.status === 'upcoming') {
                  badgeText = 'Upcoming';
                  badgeClass = 'bg-[#fef3c7] text-[#92400e]';
                } else {
                  badgeText = isLoss ? 'Accumulated Loss' : 'Profit';
                  badgeClass = isLoss ? 'bg-[#b5e7fe]/90 text-[#37697d]' : 'bg-[#f8bbd0]/90 text-[#76485a]';
                }

                // Format Dates (e.g. "25 Jun 2026")
                const formatDate = (dateStr: string) => {
                  try {
                    const parsed = new Date(dateStr);
                    return parsed.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  } catch {
                    return dateStr;
                  }
                };

                const dateRange = `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;

                // Format Net Profit
                const formattedProfit = isLoss 
                  ? `-${currencySym}${Math.abs(event.netProfit).toLocaleString()}`
                  : `+${currencySym}${event.netProfit.toLocaleString()}`;

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] border border-[#E0D0CC]/30 group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="h-32 w-full relative overflow-hidden bg-[#fff8f8]">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={event.name}
                        src={FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                      />
                      <div className={`absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${badgeClass}`}>
                        {badgeText}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="text-[18px] font-bold text-text-brown leading-tight">
                          {event.name}
                        </h4>
                        <p className="text-[12px] text-text-brown/70 mt-0.5">
                          {dateRange}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-[#E0D0CC]/20">
                        <div>
                          <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                            {DASHBOARD2_DATA.totalSalesLabel}
                          </p>
                          <p className="font-bold text-text-brown text-[16px]">
                            {formattedSales}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                            Net Profit
                          </p>
                          <p className={`font-bold text-[16px] ${isLoss ? 'text-[#326578]' : 'text-[#805062]'}`}>
                            {formattedProfit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Create New Event Button */}
        <section className="pt-2">
          <button
            onClick={() => onNavigate?.('create-event')}
            className="w-full bg-[#fcf1f2] border-2 border-dashed border-[#805062]/30 py-8 px-6 rounded-[20px] group hover:bg-[#ffd9e4]/20 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#f8bbd0] flex items-center justify-center text-[#805062] group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-[#805062] text-[20px]">
              {DASHBOARD2_DATA.createEventTitle}
            </h3>
            <p className="text-text-brown/80 text-[13px] text-center max-w-[280px]">
              {DASHBOARD2_DATA.createEventSubtitle}
            </p>
          </button>
        </section>
      </>
    );
  }
  ```

- [ ] **Step 2: Verify compilation**
  Run: `pnpm build`
  Expected: No TypeScript compiler errors.

- [ ] **Step 3: Run ESLint**
  Run: `pnpm lint`
  Expected: No linting violations.

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/pages/Dashboard.tsx
  git commit -m "feat(dashboard): show shop summary conditionally and list dynamic database events"
  ```
