# Event Creator Permissions and Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user-specific event roles, permissions check for editing events, dynamic priority-based dashboard sorting, and a one-time join confirmation modal persisted in the database.

**Architecture:** We will extend the `event_member` schema to support the role check constraints (`creator`, `collaborator`, `assistant`) and add a `has_joined` integer column. On the backend, we will validate that only creators can edit events, auto-assign roles on creation/invite-acceptance, and expose a `/api/event/join` endpoint. On the frontend, we will sort dashboard events by Creator $\rightarrow$ Joined $\rightarrow$ Non-Joined, display role badges, show a join confirmation modal for non-joined events, and enforce read-only event forms for non-creators.

**Tech Stack:** Vite + React, Cloudflare Pages/Workers API, TypeScript, Zustand, Tailwind CSS, SQLite (D1)

## Global Constraints

- **Framework/Bundler:** Vite + React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Database:** Cloudflare D1 (SQLite)

---

### Task 1: Database Migration

**Files:**
- Modify: `schema.sql`

**Interfaces:**
- Consumes: None
- Produces: SQLite schema with updated `event_member` table.

- [ ] **Step 1: Update schema.sql with updated event_member definition**
  Modify `schema.sql` lines 65-74:
  ```sql
  CREATE TABLE event_member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('creator', 'collaborator', 'assistant')),
      has_joined INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
  );
  ```

- [ ] **Step 2: Run local schema migration to verify success**
  Run command: `make migrate`
  Expected output: `Database schema re-initialized successfully.`

- [ ] **Step 3: Commit migration changes**
  Run: `git add schema.sql && git commit -m "migration: update event_member schema for creator roles and has_joined"`

---

### Task 2: Backend API and Seeding Role Updates

**Files:**
- Modify: `functions/api/event.ts`
- Modify: `functions/api/members/accept.ts`
- Modify: `scripts/seed.ts`
- Modify: `seed/seed-events.ts`

**Interfaces:**
- Consumes: `schema.sql` update.
- Produces: API methods with new roles and invitation auto-assignment, and updated seed scripts.

- [ ] **Step 1: Update scripts/seed.ts user role and collation**
  Modify the seed insertion lines in `scripts/seed.ts` (lines 147-148):
  ```typescript
  sqlLines.push(
    `INSERT INTO event_member (event_id, user_id, role, has_joined) VALUES (1, ${defaultUserId}, 'creator', 1);`
  );
  ```
  Add a second test user to `scripts/seed.ts` (lines 135-141):
  ```typescript
  sqlLines.push(
    `INSERT INTO "user" (id, email, password_hash, password_salt, is_verified) ` +
    `VALUES (2, 'collab@example.com', '${hash}', '${salt}', 1);`
  );
  sqlLines.push(
    `INSERT INTO shop_member (shop_id, user_id, role) VALUES (${defaultShopId}, 2, 'owner');`
  );
  ```

- [ ] **Step 2: Update seed/seed-events.ts to set up collaborative roles**
  Modify `seed/seed-events.ts` to insert `event_member` entries for seeded events:
  - Event 1: `user_id = 1` is `'creator'`, `has_joined = 1`
  - Event 2: `user_id = 2` is `'creator'`, `user_id = 1` is `'collaborator'`, `has_joined = 1`
  - Event 3: `user_id = 1` is `'creator'`, `has_joined = 1`
  - Event 4: `user_id = 2` is `'creator'`, `user_id = 1` is `'collaborator'`, `has_joined = 0`
  
  Write the SQL insert statement generation inside `seed/seed-events.ts`:
  ```typescript
  // For each inserted/updated event, seed corresponding event_member records:
  // e.g. for Event 1:
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idA}, 1, 'creator', 1);`
  // for Event 2:
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idB}, 2, 'creator', 1);`
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idB}, 1, 'collaborator', 1);`
  // for Event 3:
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idC}, 1, 'creator', 1);`
  // for Event 4:
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idD}, 2, 'creator', 1);`
  `INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (${idD}, 1, 'collaborator', 0);`
  ```

- [ ] **Step 3: Update functions/api/event.ts event creation role logic**
  In `functions/api/event.ts` `onRequestPost` (create event), update line 108-123 to use new roles:
  ```typescript
    const memberStatements = [
      context.env.DB.prepare(
        "INSERT INTO event_member (event_id, user_id, role, has_joined) VALUES (?, ?, 'creator', 1)"
      ).bind(eventId, session.user_id)
    ];

    for (const owner of otherOwners) {
      memberStatements.push(
        context.env.DB.prepare(
          "INSERT INTO event_member (event_id, user_id, role, has_joined) VALUES (?, ?, 'collaborator', 0)"
        ).bind(eventId, owner.user_id)
      );
    }
  ```

- [ ] **Step 4: Update GET /api/event query to return roles and has_joined**
  In `functions/api/event.ts` `onRequestGet`:
  For single event query (lines 201-205):
  ```typescript
      const eventRecord = await context.env.DB.prepare(
        `SELECT e.id, e.name, e.country, e.start_date AS startDate, e.end_date AS endDate, 
                e.booth_rental AS boothRental, e.travel, e.accommodation, e.food_allowance AS foodAllowance,
                em.role, em.has_joined AS hasJoined
         FROM event e
         LEFT JOIN event_member em ON e.id = em.event_id AND em.user_id = ?1
         WHERE e.id = ?2 AND e.shop_id = ?3`
      ).bind(session.user_id, eventId, shopMember.shop_id).first();
  ```
  For all events list query (lines 219-245):
  ```typescript
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
        em.has_joined AS hasJoined,
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
  ```

- [ ] **Step 5: Update functions/api/members/accept.ts invitation acceptance logic**
  In `functions/api/members/accept.ts`, after inserting into `shop_member` (line 86):
  ```typescript
      if (invite.role === "owner") {
        const { results: existingEvents } = await context.env.DB.prepare(
          "SELECT id FROM event WHERE shop_id = ?"
        )
          .bind(invite.shop_id)
          .all<{ id: number }>();

        if (existingEvents.length > 0) {
          const statements = existingEvents.map((evt) =>
            context.env.DB.prepare(
              "INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (?, ?, 'collaborator', 0)"
            ).bind(evt.id, user.id)
          );
          await context.env.DB.batch(statements);
        }
      }
  ```

- [ ] **Step 6: Run make seed and check DB to verify seeding**
  Run: `make seed`
  Verify there are no SQL check constraint errors.

- [ ] **Step 7: Commit backend & seed changes**
  Run: `git add functions/api/event.ts functions/api/members/accept.ts scripts/seed.ts seed/seed-events.ts && git commit -m "feat: implement backend role assignments and update seeds"`

---

### Task 3: Create Join Event Endpoint

**Files:**
- Create: `functions/api/event/join.ts`

**Interfaces:**
- Consumes: `user_id` from session token, `eventId` from request body.
- Produces: API response `{ success: true }` indicating successful join.

- [ ] **Step 1: Create join.ts API handler**
  Create `functions/api/event/join.ts`:
  ```typescript
  import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
  import { getCookie } from "../auth/helper";

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

      if (new Date(session.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: "Session expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await context.request.json() as { eventId: number };
      const { eventId } = body;

      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if event exists and get user's shop membership role
      const eventDetails = await context.env.DB.prepare(
        `SELECT e.id, sm.role AS shop_role
         FROM event e
         JOIN shop_member sm ON e.shop_id = sm.shop_id
         WHERE e.id = ? AND sm.user_id = ?`
      )
        .bind(eventId, session.user_id)
        .first<{ id: number; shop_role: string }>();

      if (!eventDetails) {
        return new Response(JSON.stringify({ error: "Event not found or access unauthorized" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Determine event role
      const eventRole = eventDetails.shop_role === 'owner' ? 'collaborator' : 'assistant';

      // Upsert event member status
      await context.env.DB.prepare(
        `INSERT INTO event_member (event_id, user_id, role, has_joined)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(event_id, user_id) DO UPDATE SET has_joined = 1`
      )
        .bind(eventId, session.user_id, eventRole)
        .run();

      return new Response(JSON.stringify({ success: true }), {
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
  ```

- [ ] **Step 2: Verify join.ts compile correctness**
  Run: `pnpm build`
  Expected: Builds correctly without TypeScript errors.

- [ ] **Step 3: Commit the new join endpoint**
  Run: `git add functions/api/event/join.ts && git commit -m "feat: add join event API endpoint"`

---

### Task 4: Backend Edit Event Permission Check

**Files:**
- Modify: `functions/api/event.ts`

**Interfaces:**
- Consumes: PUT request on `/api/event`.
- Produces: `403 Forbidden` error if the user is not the `'creator'`.

- [ ] **Step 1: Check creator role on PUT handler**
  In `functions/api/event.ts` `onRequestPut` (save event details), add a role verification block before executing the `UPDATE event` query (around line 345):
  ```typescript
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
  ```

- [ ] **Step 2: Verify compilation**
  Run: `pnpm build`
  Expected: Success.

- [ ] **Step 3: Commit permission check**
  Run: `git add functions/api/event.ts && git commit -m "security: restrict event modifications to creator only"`

---

### Task 5: Frontend Dashboard Sorting and Badge Integration

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `role` and `hasJoined` properties in `EventData` retrieved from `/api/event`.
- Produces: Correctly sorted event list and role badges.

- [ ] **Step 1: Add hasJoined type definition**
  In `src/pages/Dashboard.tsx`, update the `EventData` interface (lines 10-25):
  ```typescript
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
    role: 'creator' | 'collaborator' | 'assistant' | null;
    hasJoined: number;
    status: 'upcoming' | 'inprogress' | 'ended';
    totalSales: number;
    netProfit: number;
  }
  ```

- [ ] **Step 2: Add dynamic sorting logic**
  In `src/pages/Dashboard.tsx`, replace the `displayedEvents` definition (lines 88-90) with the priority sorting:
  ```typescript
    const rawDisplayedEvents = hasEndedEvent
      ? events
      : events.filter((e) => e.status === 'inprogress' || e.status === 'upcoming');

    const getGroupPriority = (e: EventData) => {
      if (e.role === 'creator') return 1;
      if (e.role !== 'creator' && e.hasJoined === 1) return 2;
      return 3;
    };

    const getStatusPriority = (status: string) => {
      if (status === 'inprogress') return 1;
      if (status === 'upcoming') return 2;
      return 3;
    };

    const displayedEvents = [...rawDisplayedEvents].sort((a, b) => {
      const groupA = getGroupPriority(a);
      const groupB = getGroupPriority(b);
      if (groupA !== groupB) return groupA - groupB;

      const statusA = getStatusPriority(a.status);
      const statusB = getStatusPriority(b.status);
      if (statusA !== statusB) return statusA - statusB;

      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  ```

- [ ] **Step 3: Render User Role Badge on Card**
  In `src/pages/Dashboard.tsx`, define badge mappings inside the render map (around line 173):
  ```typescript
                const roleConfig = {
                  creator: { text: 'Creator', className: 'bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]/60' },
                  collaborator: { text: 'Collaborator', className: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]/60' },
                  assistant: { text: 'Assistant', className: 'bg-[#f0f9ff] text-[#075985] border-[#bae6fd]/60' },
                };

                const currentRole = event.role || 'assistant';
                const roleText = roleConfig[currentRole]?.text || 'Assistant';
                const roleBadgeClass = roleConfig[currentRole]?.className || 'bg-gray-50 text-gray-600 border-gray-200';
  ```
  And render it inside the card header next to/below the event status badge (around line 228):
  ```typescript
                        <div className="flex flex-col gap-1 items-end">
                          <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${badgeClass}`}>
                            {badgeText}
                          </div>
                          <div className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${roleBadgeClass} mt-1`}>
                            {roleText}
                          </div>
                        </div>
  ```

- [ ] **Step 4: Commit Dashboard UI changes**
  Run: `git add src/pages/Dashboard.tsx && git commit -m "style: sort events and display user status badge on dashboard"`

---

### Task 6: Join Confirmation Modal Integration

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: Card clicks for events with `hasJoined === 0`.
- Produces: Join Confirm Modal popup, calling `POST /api/event/join`.

- [ ] **Step 1: Add modal states**
  In `src/pages/Dashboard.tsx`, declare modal state at the top of `Dashboard` component:
  ```typescript
    const [selectedEventToJoin, setSelectedEventToJoin] = useState<EventData | null>(null);
    const [isJoining, setIsJoining] = useState(false);
  ```

- [ ] **Step 2: Update click handler to intercept non-joined events**
  In `src/pages/Dashboard.tsx`, update `handleEventClick`:
  ```typescript
    const handleEventClick = (event: EventData) => {
      if (event.role !== 'creator' && event.hasJoined === 0) {
        setSelectedEventToJoin(event);
        return;
      }
      navigateToEvent(event);
    };

    const navigateToEvent = (event: EventData) => {
      if (event.status === 'upcoming') {
        navigate(`/edit-event?event_id=${event.id}`);
      } else if (event.status === 'inprogress') {
        navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}`);
      } else if (event.status === 'ended') {
        navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}&disable_order=true`);
      }
    };
  ```

- [ ] **Step 3: Implement Join API request handler**
  In `src/pages/Dashboard.tsx`, add the join submission function:
  ```typescript
    const handleConfirmJoin = async () => {
      if (!selectedEventToJoin) return;
      setIsJoining(true);
      try {
        const response = await fetch('/api/event/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: selectedEventToJoin.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to join event');
        }

        // Update local state
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === selectedEventToJoin.id ? { ...evt, hasJoined: 1 } : evt
          )
        );

        const enteredEvent = { ...selectedEventToJoin, hasJoined: 1 as const };
        setSelectedEventToJoin(null);
        navigateToEvent(enteredEvent);
      } catch (err) {
        console.error(err);
        alert('Could not join event. Please try again.');
      } finally {
        setIsJoining(false);
      }
    };
  ```

- [ ] **Step 4: Add Modal JSX markup**
  Add the modal markup at the end of the Dashboard component's return value (styled to match boutique aesthetic):
  ```typescript
        {/* Join Confirmation Modal */}
        {selectedEventToJoin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#4e342e]/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEventToJoin(null)}></div>
            <div className="bg-white w-full max-w-[320px] rounded-[24px] overflow-hidden shadow-2xl border border-[#E0D0CC]/20 z-10 p-6 space-y-4 animate-scaleUp">
              <div className="text-center space-y-2">
                <h3 className="font-bold text-[18px] text-text-brown">Join Event</h3>
                <p className="text-[13px] text-text-brown/80 leading-relaxed">
                  Are you sure you want to join <strong>{selectedEventToJoin.name}</strong>?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedEventToJoin(null)}
                  disabled={isJoining}
                  className="flex-1 h-11 border-2 border-outline-warm text-text-brown rounded-full font-bold text-[13px] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={isJoining}
                  className="flex-1 h-11 bg-brand-pink text-text-brown rounded-full font-bold text-[13px] hover:bg-brand-pink-hover active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm disabled:opacity-50"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
  ```

- [ ] **Step 5: Commit Join Modal Integration**
  Run: `git add src/pages/Dashboard.tsx && git commit -m "feat: integrate join confirmation modal on dashboard"`

---

### Task 7: Frontend Edit Permission Restrictions

**Files:**
- Modify: `src/components/EventForm.tsx`

**Interfaces:**
- Consumes: `initialData` object from `EditEvent.tsx` with role property.
- Produces: Read-only inputs and warning banner if user role is not `'creator'`.

- [ ] **Step 1: Update initialData type**
  In `src/components/EventForm.tsx`, add `role` to the `initialData` property inside `EventFormProps`:
  ```typescript
    initialData?: {
      id?: number;
      name: string;
      country: string;
      startDate: string;
      endDate: string;
      boothRental: number;
      travel: number;
      accommodation: number;
      foodAllowance: number;
      role?: string | null;
    };
  ```

- [ ] **Step 2: Add read-only verification flag**
  At the top of the `EventForm` component:
  ```typescript
    const isReadOnly = mode === 'edit' && initialData?.role !== 'creator';
  ```

- [ ] **Step 3: Show warning banner and disable inputs**
  Add the warning banner below the Mascot Banner (around line 141):
  ```typescript
        {isReadOnly && (
          <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-4 py-3.5 rounded-[20px] text-[12px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>You are viewing this event as a collaborator. Only the creator can edit details.</span>
          </div>
        )}
  ```
  Pass `disabled={isReadOnly}` to all input fields (`FormInput`, `FormSelect`, and number input text boxes). E.g. for `FormInput`:
  ```typescript
            <FormInput
              id="eventName"
              label="Event Name"
              placeholder="e.g. Pop-up Craft Fair 2026"
              required
              value={eventName}
              onChange={setEventName}
              disabled={isReadOnly}
            />
  ```
  And disable the submit button:
  ```typescript
          <button
            type="submit"
            disabled={isLoading || isSuccess || isReadOnly}
            className="..."
          >
            {isReadOnly ? 'READ ONLY' : (isLoading ? ...)}
          </button>
  ```

- [ ] **Step 4: Commit edit-restriction changes**
  Run: `git add src/components/EventForm.tsx && git commit -m "security: make event form read-only for non-creators"`
