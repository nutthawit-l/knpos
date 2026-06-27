# Order and Transaction Event Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind all order transactions to a currently in-progress event, and disable the Order and History pages if no event is in progress.

**Architecture:** 
1. Backend: Modify POST `/api/transaction` to enforce `event_id` presence and validate that today's date falls within the event's start and end dates.
2. Frontend: Sync active event state by querying `/api/event` on layout mount/navigation, guard `/order` and `/transactions` routes in `MainLayout.tsx`, and disable corresponding tabs in `BottomNavigation.tsx`.

**Tech Stack:** React, Vite, TypeScript, Zustand, SQLite (Cloudflare D1), Tailwind CSS.

## Global Constraints
- Naming conventions: keep variable names clean and camelCase for React, snake_case for DB columns.
- Keep components responsive and mobile-first.
- Execute `pnpm build` and `pnpm lint` as verification steps at the end of each task to maintain code quality.

---

### Task 1: Enforce in-progress event validation in transaction POST API

**Files:**
- Modify: [transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts#L48-L96)

**Interfaces:**
- Consumes: `event_id` in request body.
- Produces: `201 Created` on successful transaction, or `400 Bad Request` / `403 Forbidden` if validation fails.

- [ ] **Step 1: Modify transaction.ts POST handler**
  Replace lines 48-95 in `functions/api/transaction.ts` with code that requires `event_id`, queries `event` for shop ID and start/end dates, and verifies that the current date in GMT+7 timezone falls within the event duration.

  ```typescript
      if (event_id === undefined || event_id === null) {
        return new Response('event_id is required', { status: 400 });
      }

      const validatedEventId = Number(event_id);
      if (!Number.isInteger(validatedEventId) || validatedEventId <= 0) {
        return new Response('Invalid event_id', { status: 400 });
      }

      let userShopId: number | null = null;
      const cookieHeader = context.request.headers.get("Cookie");
      const token = getCookie(cookieHeader, "session_token");

      if (token) {
        const session: any = await context.env.DB.prepare(
          "SELECT user_id FROM session WHERE id = ?"
        )
          .bind(token)
          .first();

        if (session) {
          const shopMember: any = await context.env.DB.prepare(
            "SELECT shop_id FROM shop_member WHERE user_id = ?"
          )
            .bind(session.user_id)
            .first();

          if (shopMember) {
            userShopId = shopMember.shop_id;
          }
        }
      }

      // Verify that the event exists, belongs to the user's shop, and is in progress
      const eventRecord: any = await context.env.DB.prepare(
        "SELECT shop_id, start_date, end_date FROM event WHERE id = ?"
      )
        .bind(validatedEventId)
        .first();

      if (!eventRecord) {
        return new Response('Event not found', { status: 400 });
      }

      if (userShopId && eventRecord.shop_id !== userShopId) {
        return new Response('Unauthorized access to event', { status: 403 });
      }

      // Calculate today's date in GMT+7 (Thailand timezone)
      const GMT_OFFSET_MS = 7 * 60 * 60 * 1000;
      const localTime = new Date(Date.now() + GMT_OFFSET_MS);
      const todayStr = localTime.toISOString().split('T')[0];

      if (todayStr < eventRecord.start_date || todayStr > eventRecord.end_date) {
        return new Response('Transactions can only be logged for events that are in progress', { status: 400 });
      }
  ```

- [ ] **Step 2: Verify typescript build**
  Run: `pnpm build`
  Expected: Successful build without typescript errors.

- [ ] **Step 3: Run linting check**
  Run: `pnpm lint`
  Expected: Clean linting check.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add functions/api/transaction.ts
  git commit -m "feat: enforce in-progress event validation in transaction API"
  ```

---

### Task 2: Active Event Sync and Route Guarding in MainLayout

**Files:**
- Modify: [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)

**Interfaces:**
- Consumes: `useOrderStore` state selectors and setters (`hasEvent`, `setHasEvent`, `setActiveEvent`).
- Produces: Redirection behavior and synced global state representing active event presence.

- [ ] **Step 1: Add syncing and route guard logic to MainLayout.tsx**
  Add state and effect to check active event on layout mount / page navigation, and redirect if no active event is present.
  
  Replace lines 41-66 in `src/components/MainLayout.tsx` with:
  
  ```typescript
  import { useState, useEffect } from 'react';
  import { useOrderStore } from '../store/useOrderStore';
  
  export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { hasEvent, setHasEvent, setActiveEvent } = useOrderStore();
    const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  
    // Find config based on current pathname
    const config = ROUTE_CONFIGS[location.pathname] || { title: 'Boutique POS', tab: '' };
    const state = location.state as LocationState | null | undefined;
  
    const resolvedTitle = typeof config.title === 'function' 
      ? config.title(state) 
      : config.title;
  
    // Check event status on mount & navigation
    useEffect(() => {
      let active = true;
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
      fetch(`/api/event?today=${todayStr}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch events');
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          const events = data as Array<{ id: number; name: string; status: string }>;
          const activeEvent = events.find((e) => e.status === 'inprogress');
          if (activeEvent) {
            setHasEvent(true);
            setActiveEvent(activeEvent.id, activeEvent.name);
          } else {
            setHasEvent(false);
            setActiveEvent(null, null);
          }
          setIsLoadingEvent(false);
        })
        .catch((err) => {
          console.error(err);
          if (active) {
            setIsLoadingEvent(false);
          }
        });
  
      return () => {
        active = false;
      };
    }, [setHasEvent, setActiveEvent, location.pathname]);
  
    // Route guard: Redirect to /dashboard if on /order or /transactions and no active event exists
    useEffect(() => {
      if (!isLoadingEvent && !hasEvent && (location.pathname === '/order' || location.pathname === '/transactions')) {
        navigate('/dashboard', { replace: true });
      }
    }, [isLoadingEvent, hasEvent, location.pathname, navigate]);
  
    const handleNavigate = (tab: string) => {
      navigate(`/${tab}`);
    };
  
    const handleBack = () => {
      if (config.showBackButton && config.backTo) {
        const destination = typeof config.backTo === 'function'
          ? config.backTo(state)
          : config.backTo;
        navigate(destination);
      }
    };
  ```

- [ ] **Step 2: Render loading state or layout**
  To prevent flickering, adjust the rendering of the sub-pages inside `MainLayout.tsx`. Replace lines 67-96 in `src/components/MainLayout.tsx` with:
  
  ```typescript
    if (isLoadingEvent && (location.pathname === '/order' || location.pathname === '/transactions')) {
      return (
        <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center items-center">
          <div className="text-[#805062] font-medium text-sm flex flex-col items-center gap-2">
            <span className="animate-spin border-4 border-[#805062] border-t-transparent w-8 h-8 rounded-full"></span>
            <span>Checking active event...</span>
          </div>
        </div>
      );
    }
  
    return (
      <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
        <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
          {/* Centralized Header with Dynamic Title, Back Arrow, and Bell Button */}
          <Header
            title={resolvedTitle}
            onBackClick={config.showBackButton ? handleBack : undefined}
            rightElement={
              !config.showBackButton && (
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
                  <Bell className="w-5 h-5" />
                </button>
              )
            }
          />
  
          {/* Sub-page Outlet */}
          <div className={`flex-1 overflow-y-auto px-5 space-y-6 no-scrollbar pt-4 ${
            config.hideBottomNav ? 'pb-8' : 'pb-24'
          }`}>
            <Outlet />
          </div>
  
          {/* Centralized Bottom Navigation */}
          {!config.hideBottomNav && (
            <BottomNavigation activeTab={config.tab} onNavigate={handleNavigate} />
          )}
        </div>
      </div>
    );
  ```

- [ ] **Step 3: Verify typescript build**
  Run: `pnpm build`
  Expected: Successful build without typescript errors.

- [ ] **Step 4: Run linting check**
  Run: `pnpm lint`
  Expected: Clean linting check.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add src/components/MainLayout.tsx
  git commit -m "feat: add active event sync and route guarding to MainLayout"
  ```

---

### Task 3: Disable Order and History Buttons in Bottom Navigation

**Files:**
- Modify: [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)

**Interfaces:**
- Consumes: Zustand store `useOrderStore` (`hasEvent`).
- Produces: Disabled styling and click handlers for Order and History buttons.

- [ ] **Step 1: Read event status and disable navigation buttons**
  Modify `src/components/BottomNavigation.tsx` to read `hasEvent` from `useOrderStore`. If `hasEvent` is false, add `disabled={true}`, prevent `onNavigate`, and apply a greyed-out visual layout.

  Replace the content of `src/components/BottomNavigation.tsx` with:

  ```typescript
  import { ShoppingCart, History, Package, Settings } from 'lucide-react';
  import { useOrderStore } from '../store/useOrderStore';

  export interface BottomNavigationProps {
    readonly activeTab?: string;
    readonly onNavigate?: (tab: string) => void;
  }

  export default function BottomNavigation({
    activeTab = '',
    onNavigate,
  }: BottomNavigationProps) {
    const hasEvent = useOrderStore((state) => state.hasEvent);

    return (
      <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#fcf1f2] border-t border-outline-warm/30 shadow-[0_-2px_10px_rgba(78,52,46,0.05)] rounded-t-2xl">
        {/* Order Button */}
        <button
          disabled={!hasEvent}
          onClick={() => hasEvent && onNavigate?.('order')}
          className={`flex flex-col items-center justify-center transition-all border-none ${
            !hasEvent
              ? 'opacity-40 cursor-not-allowed px-5 py-1 text-[#504447]'
              : activeTab === 'order'
              ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1 cursor-pointer'
              : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80 cursor-pointer'
          }`}
        >
          <ShoppingCart
            className={`w-5 h-5 mb-0.5 ${
              !hasEvent
                ? 'text-[#504447]'
                : activeTab === 'order'
                ? 'text-[#76485a]'
                : 'text-[#504447]'
            }`}
          />
          <span className="text-[12px] font-bold">Order</span>
        </button>

        {/* History / Transactions Button */}
        <button
          disabled={!hasEvent}
          onClick={() => hasEvent && onNavigate?.('transactions')}
          className={`flex flex-col items-center justify-center transition-all border-none ${
            !hasEvent
              ? 'opacity-40 cursor-not-allowed px-5 py-1 text-[#504447]'
              : activeTab === 'transactions'
              ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1 cursor-pointer'
              : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80 cursor-pointer'
          }`}
        >
          <History
            className={`w-5 h-5 mb-0.5 ${
              !hasEvent
                ? 'text-[#504447]'
                : activeTab === 'transactions'
                ? 'text-[#76485a]'
                : 'text-[#504447]'
            }`}
          />
          <span className="text-[12px] font-bold">History</span>
        </button>

        {/* Inventory Button */}
        <button
          onClick={() => onNavigate?.('products')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer border-none ${
            activeTab === 'products'
              ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1'
              : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80'
          }`}
        >
          <Package
            className={`w-5 h-5 mb-0.5 ${
              activeTab === 'products' ? 'text-[#76485a]' : 'text-[#504447]'
            }`}
          />
          <span className="text-[12px] font-bold">Inventory</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onNavigate?.('settings')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer border-none ${
            activeTab === 'settings'
              ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1'
              : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80'
          }`}
        >
          <Settings
            className={`w-5 h-5 mb-0.5 ${
              activeTab === 'settings' ? 'text-[#76485a]' : 'text-[#504447]'
            }`}
          />
          <span className="text-[12px] font-bold">Settings</span>
        </button>
      </nav>
    );
  }
  ```

- [ ] **Step 2: Verify typescript build**
  Run: `pnpm build`
  Expected: Successful build without typescript errors.

- [ ] **Step 3: Run linting check**
  Run: `pnpm lint`
  Expected: Clean linting check.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add src/components/BottomNavigation.tsx
  git commit -m "feat: disable order and history buttons in bottom nav when no active event"
  ```
