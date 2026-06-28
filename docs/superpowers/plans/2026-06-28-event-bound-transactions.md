# Event-bound Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind transactions strictly to events, support viewing transactions by event, disabling orders for past events, and editing upcoming events using a shared form component.

**Architecture:** Use separate React routes for creating and editing events, sharing a single custom `<EventForm>` component. Update backend event and transaction endpoints to support single-event lookup, updating event details, and querying all-time transactions for specific events.

**Tech Stack:** React, Vite, TypeScript, Zustand, Tailwind CSS, Cloudflare Workers/Pages Functions (D1 SQLite database).

## Global Constraints
* Every transaction must belong to a valid event in the database.
* Deleting an event with transactions is prohibited by `ON DELETE RESTRICT`.
* Code must build with `pnpm build` and pass ESLint checks with `pnpm lint`.

---

### Task 1: Database Schema Constraint Update
Update the SQLite D1 schema to enforce event binding on the `"order"` table.

**Files:**
* Modify: [schema.sql](file:///home/tie/Projects/knpos/schema.sql)

**Interfaces:**
* Consumes: Existing SQLite tables.
* Produces: Updated schema constraints.

- [ ] **Step 1: Update `"order"` table definition**
  Update the `"order"` table creation SQL script:
  ```sql
  CREATE TABLE IF NOT EXISTS "order" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_code TEXT NOT NULL,         -- เก็บว่าใช้ราคาของประเทศไหน เช่น 'THB', 'SGD'
      total_income REAL NOT NULL,          -- รวมยอดเงินของออร์เดอร์นี้
      total_product_sold INTEGER NOT NULL, -- รวมจำนวนชิ้นที่ขายได้ในออร์เดอร์นี้
      event_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE RESTRICT
  );
  ```

- [ ] **Step 2: Run schema migration locally**
  Run: `pnpm install && npx wrangler d1 execute charnipos-db --local --file=./schema.sql`
  Expected: Database reset successfully without syntax errors.

- [ ] **Step 3: Run database seed script**
  Run: `npx tsx scripts/seed.ts`
  Expected: Seed runs successfully, inserting mock shop, user, events, products, and 5 transactions with valid `event_id`.

- [ ] **Step 4: Commit**
  Run: `git commit -am "db: update order table schema with NOT NULL and RESTRICT event_id"`

---

### Task 2: Backend Event API Update and Single Lookup
Implement event updates (PUT) and single event lookup (GET by ID) in the cloud functions.

**Files:**
* Modify: [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)

**Interfaces:**
* Consumes: `GET /api/event?id=X` (lookup), `PUT /api/event` (update)
* Produces: JSON responses.

- [ ] **Step 1: Update GET handler to support single event ID lookup**
  At the beginning of `onRequestGet` in `functions/api/event.ts`, check for `id` query param:
  ```typescript
  const eventIdParam = url.searchParams.get("id");
  if (eventIdParam) {
    const eventId = parseInt(eventIdParam, 10);
    const eventRecord = await context.env.DB.prepare(
      `SELECT id, name, country, start_date AS startDate, end_date AS endDate, 
              booth_rental AS boothRental, travel, accommodation, food_allowance AS foodAllowance 
       FROM event WHERE id = ?`
    ).bind(eventId).first();
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(eventRecord), { headers: { "Content-Type": "application/json" } });
  }
  ```

- [ ] **Step 2: Implement PUT handler for updating events**
  Add the `onRequestPut` export to `functions/api/event.ts`:
  ```typescript
  export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
      const cookieHeader = context.request.headers.get("Cookie");
      const token = getCookie(cookieHeader, "session_token");
      if (!token) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
      const session = await context.env.DB.prepare("SELECT user_id FROM session WHERE id = ?").bind(token).first<{ user_id: number }>();
      if (!session) return new Response(JSON.stringify({ error: "Session invalid" }), { status: 401 });
      const body = await context.request.json() as any;
      const { id, eventName, country, startDate, endDate, boothRental, travel, accommodation, foodAllowance } = body;
      if (!id || !eventName || !country || !startDate || !endDate) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }
      await context.env.DB.prepare(
        `UPDATE event SET name = ?, country = ?, start_date = ?, end_date = ?, 
                            booth_rental = ?, travel = ?, accommodation = ?, food_allowance = ? 
         WHERE id = ?`
      ).bind(
        eventName.trim(), country.trim(), startDate, endDate,
        parseFloat(boothRental) || 0, parseFloat(travel) || 0,
        parseFloat(accommodation) || 0, parseFloat(foodAllowance) || 0,
        id
      ).run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  };
  ```

- [ ] **Step 3: Run backend code check**
  Run: `pnpm run lint`
  Expected: Passes lint checks without typescript compilation errors.

- [ ] **Step 4: Commit**
  Run: `git commit -am "api: add single event lookup and update event PUT handler"`

---

### Task 3: Shared Event Form Component Extraction
Extract the event creation and edit fields from `CreateEvent.tsx` into a reusable `<EventForm>` component.

**Files:**
* Create: [EventForm.tsx](file:///home/tie/Projects/knpos/src/components/EventForm.tsx)
* Modify: [CreateEvent.tsx](file:///home/tie/Projects/knpos/src/pages/CreateEvent.tsx)

**Interfaces:**
* Consumes: `mode: 'create' | 'edit'`, `initialData?: EventData`
* Produces: React form UI.

- [ ] **Step 1: Create `EventForm.tsx`**
  Write the React code for `<EventForm>` including states (prefilled from `initialData` if provided), validation, and form fields. Implement PUT/POST calls inside:
  ```tsx
  // src/components/EventForm.tsx
  import { useState, FormEvent } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { Calendar, Store, PlaneTakeoff, Hotel, Utensils, Loader2, Sparkles, AlertCircle } from 'lucide-react';
  import { useOrderStore } from '../store/useOrderStore';
  import { currencies, COUNTRY_CURRENCY_MAP } from '../types/currency';
  import FormInput from './FormInput';
  import FormSelect from './FormSelect';
  import MascotLogo from './MascotLogo';

  interface EventFormProps {
    mode: 'create' | 'edit';
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
    };
  }

  export default function EventForm({ mode, initialData }: EventFormProps) {
    const [eventName, setEventName] = useState(initialData?.name || '');
    const [country, setCountry] = useState(initialData?.country || 'Thailand');
    const [startDate, setStartDate] = useState(initialData?.startDate || '');
    const [endDate, setEndDate] = useState(initialData?.endDate || '');
    const [boothRental, setBoothRental] = useState(initialData?.boothRental?.toString() || '');
    const [travel, setTravel] = useState(initialData?.travel?.toString() || '');
    const [accommodation, setAccommodation] = useState(initialData?.accommodation?.toString() || '');
    const [foodAllowance, setFoodAllowance] = useState(initialData?.foodAllowance?.toString() || '');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const { setCurrency, setHasEvent, setActiveEvent } = useOrderStore();

    const countries = ['Thailand', 'Singapore', 'USA', 'Japan'] as const;
    const activeCurrencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!eventName.trim() || !startDate || !endDate) return;
      setIsLoading(true);

      try {
        const url = '/api/event';
        const method = mode === 'create' ? 'POST' : 'PUT';
        const body = {
          id: initialData?.id,
          eventName: eventName.trim(),
          country,
          startDate,
          endDate,
          boothRental,
          travel,
          accommodation,
          foodAllowance,
        };

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          setIsLoading(false);
          setIsSuccess(true);
          
          if (mode === 'create') {
            const data = await response.json() as { event: { id: number; name: string } };
            const currencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';
            const matchedCurrency = currencies.find((c) => c.code === currencyCode);
            if (matchedCurrency) setCurrency(matchedCurrency);
            setHasEvent(true);
            setActiveEvent(data.event.id, data.event.name);
            setTimeout(() => navigate('/order'), 1000);
          } else {
            setTimeout(() => navigate('/dashboard'), 1000);
          }
        } else {
          alert('Request failed');
          setIsLoading(false);
        }
      } catch (err) {
        alert('Network error');
        setIsLoading(false);
      }
    };

    return (
      <form className="space-y-6 pb-6" onSubmit={handleSubmit}>
        <section className="relative bg-brand-blue/30 rounded-[24px] p-5 flex items-center border border-brand-blue/20">
          <div className="flex-1">
            <h2 className="font-bold text-[#154d5f] text-[14px]">
              {mode === 'create' ? "Let's track our costs!" : "Let's update our costs!"}
            </h2>
          </div>
          <MascotLogo sizeClassName="w-16 h-16" />
        </section>
        <section className="space-y-4">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-outline-warm/30 space-y-4">
            <FormInput id="eventName" label="Event Name" required value={eventName} onChange={setEventName} />
            <FormSelect id="country" label="Country" options={countries} value={country} onChange={setCountry} />
            <div className="grid grid-cols-2 gap-4">
              <FormInput id="startDate" label="Start Date" type="date" required value={startDate} onChange={setStartDate} />
              <FormInput id="endDate" label="End Date" type="date" required value={endDate} onChange={setEndDate} />
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="bg-white rounded-[24px] p-5 border border-outline-warm/30">
            <label className="font-bold text-sm block mb-2">Booth Rental</label>
            <input className="w-full h-12 px-4 rounded-full border bg-gray-50" type="number" step="0.01" value={boothRental} onChange={e => setBoothRental(e.target.value)} />
          </div>
          <div className="bg-white rounded-[24px] p-5 border border-outline-warm/30">
            <label className="font-bold text-sm block mb-2">Travel</label>
            <input className="w-full h-12 px-4 rounded-full border bg-gray-50" type="number" step="0.01" value={travel} onChange={e => setTravel(e.target.value)} />
          </div>
          <div className="bg-white rounded-[24px] p-5 border border-outline-warm/30">
            <label className="font-bold text-sm block mb-2">Accommodation</label>
            <input className="w-full h-12 px-4 rounded-full border bg-gray-50" type="number" step="0.01" value={accommodation} onChange={e => setAccommodation(e.target.value)} />
          </div>
          <div className="bg-white rounded-[24px] p-5 border border-outline-warm/30">
            <label className="font-bold text-sm block mb-2">Food Allowance</label>
            <input className="w-full h-12 px-4 rounded-full border bg-gray-50" type="number" step="0.01" value={foodAllowance} onChange={e => setFoodAllowance(e.target.value)} />
          </div>
        </section>
        <button type="submit" disabled={isLoading || isSuccess} className="w-full h-14 bg-brand-pink text-text-brown font-bold rounded-full">
          {isLoading ? 'Processing...' : isSuccess ? (mode === 'create' ? 'Event Started! 🎉' : 'Event Updated! 🎉') : (mode === 'create' ? 'START EVENT' : 'SAVE CHANGES')}
        </button>
      </form>
    );
  }
  ```

- [ ] **Step 2: Simplify `CreateEvent.tsx`**
  Replace the entire content of `CreateEvent.tsx` to just import and render the `<EventForm>`:
  ```tsx
  import EventForm from '../components/EventForm';

  export default function CreateEvent() {
    return <EventForm mode="create" />;
  }
  ```

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: extract shared EventForm component and clean CreateEvent"`

---

### Task 4: Create Edit Event Page & Setup Routing
Implement the `/edit-event` route wrapper and register it.

**Files:**
* Create: [EditEvent.tsx](file:///home/tie/Projects/knpos/src/pages/EditEvent.tsx)
* Modify: [App.tsx](file:///home/tie/Projects/knpos/src/App.tsx), [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)

**Interfaces:**
* Consumes: `/edit-event?event_id=123`
* Produces: Page rendering `<EventForm mode="edit" />`.

- [ ] **Step 1: Create `EditEvent.tsx`**
  ```tsx
  // src/pages/EditEvent.tsx
  import { useEffect, useState } from 'react';
  import { useSearchParams } from 'react-router-dom';
  import { Loader2 } from 'lucide-react';
  import EventForm from '../components/EventForm';

  export default function EditEvent() {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event_id');
    const [eventData, setEventData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!eventId) return;
      setIsLoading(true);
      fetch(`/api/event?id=${eventId}`)
        .then(res => res.json())
        .then(data => {
          setEventData(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }, [eventId]);

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#805062]" />
          <p className="text-sm font-medium text-text-brown">Loading event details...</p>
        </div>
      );
    }

    if (!eventData) {
      return <div className="p-8 text-center text-text-brown">Event not found.</div>;
    }

    return <EventForm mode="edit" initialData={eventData} />;
  }
  ```

- [ ] **Step 2: Add route to `App.tsx`**
  Import `EditEvent` and add `/edit-event` as a child route under the ProtectedRoute/MainLayout configuration block:
  ```typescript
  import EditEvent from "./pages/EditEvent";
  // Inside routes array child of MainLayout:
  { path: "/edit-event", element: <EditEvent /> },
  ```

- [ ] **Step 3: Add configuration to `MainLayout.tsx`**
  Add `/edit-event` route configuration inside `ROUTE_CONFIGS`:
  ```typescript
  '/edit-event': {
    title: 'Edit Event',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: '/dashboard',
  },
  ```

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: implement EditEvent page and register edit-event route"`

---

### Task 5: Dashboard Event Cards Interactive Clicking
Make event cards clickable on the Dashboard to route users correctly based on the event's status.

**Files:**
* Modify: [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)

**Interfaces:**
* Consumes: Event lists from state.
* Produces: Page navigation triggers.

- [ ] **Step 1: Add click handler and navigation logic**
  In the event map loop inside `Dashboard.tsx`, define a helper function and attach it as `onClick` to the event card wrapper div:
  ```typescript
  const handleEventClick = (event: EventData) => {
    if (event.status === 'upcoming') {
      navigate(`/edit-event?event_id=${event.id}`);
    } else if (event.status === 'inprogress') {
      navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}`);
    } else if (event.status === 'ended') {
      navigate(`/transactions?event_id=${event.id}&event_name=${encodeURIComponent(event.name)}&disable_order=true`);
    }
  };
  ```
  Attach `onClick={() => handleEventClick(event)}` and class `cursor-pointer hover:scale-[1.01] transition-transform` to the event card container.

- [ ] **Step 2: Commit**
  Run: `git commit -am "feat: make event cards on dashboard clickable and navigate correctly"`

---

### Task 6: Backend Transaction API Update
Update the transaction GET handler to support fetching transaction info by `event_id`.

**Files:**
* Modify: [transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts)

**Interfaces:**
* Consumes: `GET /api/transaction?event_id=X`
* Produces: JSON response with event aggregates, products, and orders.

- [ ] **Step 1: Check for `event_id` in `onRequestGet`**
  Modify `onRequestGet` in `functions/api/transaction.ts` to parse `event_id` and load event-specific records:
  ```typescript
  const eventIdParam = url.searchParams.get('event_id');
  if (eventIdParam) {
    const eventId = parseInt(eventIdParam, 10);
    const eventRecord = await context.env.DB.prepare(
      "SELECT country FROM event WHERE id = ?"
    ).bind(eventId).first<{ country: string }>();

    if (!eventRecord) {
      return new Response('Event not found', { status: 404 });
    }

    const countryCurrencies: Record<string, string> = {
      Thailand: 'THB',
      Singapore: 'SGD',
      Japan: 'JPY',
      USA: 'USD',
    };
    const eventCurrency = countryCurrencies[eventRecord.country] || 'THB';

    // Query 1: Event-wide aggregates (all-time for this event)
    const summaryResult = await context.env.DB.prepare(
      `SELECT 
          COALESCE(SUM(total_income), 0) AS daily_total_income,
          COALESCE(SUM(total_product_sold), 0) AS daily_total_product_sold
       FROM "order"
       WHERE event_id = ?`
    ).bind(eventId).first<{ daily_total_income: number; daily_total_product_sold: number }>();

    // Query 2: Product volumes for this event
    const { results: productsResult } = await context.env.DB.prepare(
      `SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.image_url,
          SUM(ti.quantity) AS total_sold_today
       FROM order_item ti
       JOIN "order" t ON ti.order_id = t.id
       JOIN product p ON ti.product_id = p.id
       WHERE t.event_id = ?
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold_today DESC`
    ).bind(eventId).all<{ product_id: number; product_name: string; image_url: string; total_sold_today: number }>();

    // Query 3: Individual orders for this event
    const { results: ordersResult } = await context.env.DB.prepare(
      `SELECT 
          id,
          total_income,
          total_product_sold,
          created_at
       FROM "order"
       WHERE event_id = ?
       ORDER BY created_at DESC`
    ).bind(eventId).all<{ id: number; total_income: number; total_product_sold: number; created_at: string }>();

    return new Response(
      JSON.stringify({
        summary: summaryResult || { daily_total_income: 0, daily_total_product_sold: 0 },
        products: productsResult || [],
        orders: ordersResult || [],
        eventCurrency,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  ```

- [ ] **Step 2: Commit**
  Run: `git commit -am "api: support fetching event-bound transactions by event_id"`

---

### Task 7: Transactions Page Update
Update `Transactions.tsx` to handle `event_id` filtering and display relative order numbers.

**Files:**
* Modify: [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)

**Interfaces:**
* Consumes: Query params `event_id`, API response JSON.
* Produces: Page UI.

- [ ] **Step 1: Check for `event_id` and adjust fetch URL**
  In the `useEffect` of `Transactions.tsx`:
  ```typescript
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('event_id');
  const url = eventId
    ? `/api/transaction?event_id=${eventId}&tzOffset=${tzOffset}`
    : `/api/transaction?currency=${selectedCurrency.code}&tzOffset=${tzOffset}`;
  ```

- [ ] **Step 2: Track local currency state and handle relative order rendering**
  Create a state for `currency`:
  ```typescript
  import { currencies } from '../types/currency';
  // Inside component:
  const [currency, setCurrency] = useState(selectedCurrency);
  ```
  Sync local `currency` state inside the fetch's `.then()`:
  ```typescript
  if (data.eventCurrency) {
    const matched = currencies.find(c => c.code === data.eventCurrency);
    if (matched) setCurrency(matched);
  } else {
    setCurrency(selectedCurrency);
  }
  ```
  Replace references of `selectedCurrency` with `currency` in display elements.

- [ ] **Step 3: Implement dynamic labels and relative order numbering**
  Change title from "Total Sales Today" to event-wide total:
  ```tsx
  <p className="font-bold text-[14px] text-[#805062]">{eventId ? 'Event Total Sales' : 'Total Sales Today'}</p>
  ```
  Hide trend indicator `+12% vs yesterday` when `eventId` exists:
  ```tsx
  {!eventId && (
    <span className="text-surface-variant-custom text-[11px] bg-white/50 px-2 py-0.5 rounded-full font-bold">
      +12% vs yesterday
    </span>
  )}
  ```
  Render relative order numbers starting from oldest order:
  ```tsx
  orders.map((order, idx) => {
    const relativeOrderNumber = eventId ? orders.length - idx : order.id;
    return (
      <div key={order.id} ...>
        ...
        <h3 className="font-bold text-text-brown text-sm">Order #{relativeOrderNumber}</h3>
        ...
      </div>
    );
  })
  ```

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: implement event-bound totals and relative order numbering on Transactions page"`

---

### Task 8: Layout Route Guard and Bottom Navigation Controls
Handle layout guard exceptions and disable ordering when viewing past events.

**Files:**
* Modify: [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx), [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)

**Interfaces:**
* Consumes: URL query strings.
* Produces: Header title and button states.

- [ ] **Step 1: Update MainLayout route guard & dynamic title**
  In `MainLayout.tsx`, update route guard to allow `/transactions` if `event_id` is in query parameters:
  ```typescript
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasEventParam = params.has('event_id');
    if (!isLoadingEvent && !hasEvent && !hasEventParam && (location.pathname === '/order' || location.pathname === '/transactions')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoadingEvent, hasEvent, location.pathname, location.search, navigate]);
  ```
  Set custom header title if `event_name` parameter is present:
  ```typescript
  let displayTitle = resolvedTitle;
  if (location.pathname === '/transactions') {
    const params = new URLSearchParams(location.search);
    const eventNameParam = params.get('event_name');
    if (eventNameParam) {
      displayTitle = `Transaction of ${eventNameParam}`;
    }
  }
  ```
  Use `displayTitle` instead of `resolvedTitle` in the `<Header>` component.

- [ ] **Step 2: Update BottomNavigation to disable Order for past events**
  In `BottomNavigation.tsx`, check URL query parameters for `disable_order`:
  ```typescript
  const params = new URLSearchParams(window.location.search);
  const isOrderDisabled = params.get('disable_order') === 'true';
  ```
  Disable Order button:
  ```tsx
  <button
    disabled={!hasEvent || isOrderDisabled}
    onClick={() => hasEvent && !isOrderDisabled && onNavigate?.('order')}
    className={`flex flex-col items-center justify-center transition-all border-none ${
      (!hasEvent || isOrderDisabled)
        ? 'opacity-40 cursor-not-allowed px-5 py-1 text-[#504447]'
        : activeTab === 'order'
        ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1 cursor-pointer'
        : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80 cursor-pointer'
    }`}
  >
  ```

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: bypass layout guard for event query and disable Order navigation tab if disable_order query is present"`
