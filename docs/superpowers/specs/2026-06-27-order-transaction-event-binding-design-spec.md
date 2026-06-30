# Specification: Order and Transaction Event Binding

## Goal
Bind all orders and transactions to an active "in-progress" event. Disable order and transaction features if no event is currently in progress.

---

## 1. Frontend Design

### Zustand Store Synchronization
We keep track of the active event via the `useOrderStore` Zustand store:
- `hasEvent`: Boolean indicating whether there is an active event.
- `activeEventId`: The numeric ID of the active event.
- `activeEventName`: The name of the active event.

### Automated Sync in MainLayout
In [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx), we will check for an active event when the layout mounts or when navigation occurs:
1. Call `/api/event?today=YYYY-MM-DD` (where `YYYY-MM-DD` is the client's current date in local time).
2. Scan the returned events to find if any event has `status === 'inprogress'`.
3. If an in-progress event is found:
   - Call `setHasEvent(true)`
   - Call `setActiveEvent(event.id, event.name)`
4. If no in-progress event is found:
   - Call `setHasEvent(false)`
   - Call `setActiveEvent(null, null)`

### Route Guarding
In `MainLayout.tsx`, we will add route guards:
- If a user is on `/order` or `/transactions` but `hasEvent` is false (and the initial load/fetch has completed), redirect the user to `/dashboard` immediately.

### Bottom Navigation Controls
In [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx):
- Accept `hasEvent` (or read it from Zustand `useOrderStore`).
- Disable the **Order** and **History** buttons if `hasEvent` is false:
  - Add the `disabled={!hasEvent}` attribute.
  - Apply styling rules: when disabled, use `opacity-40 cursor-not-allowed` and disable hover transitions/cursor pointers.

---

## 2. Backend Design

We will modify [transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts) in the POST request handler:
1. Enforce that `event_id` is present in the request body. If it is null/undefined/missing, return `400 Bad Request`.
2. Fetch the event record from the database using the provided `event_id`.
3. Enforce date-range validity:
   - Calculate today's date in GMT+7 (local time for Thailand default):
     ```typescript
     const GMT_OFFSET_MS = 7 * 60 * 60 * 1000;
     const localTime = new Date(Date.now() + GMT_OFFSET_MS);
     const todayStr = localTime.toISOString().split('T')[0];
     ```
   - Verify that `todayStr` is between `event.start_date` and `event.end_date`.
   - If `todayStr` is outside this range, reject the request with `400 Bad Request` and message `"Transactions can only be logged for events that are in progress"`.

---

## 3. Verification Plan

### Automated Verification
- Verify database queries compile.
- Verify typescript builds.

### Manual Verification
1. **Case: No active event in progress**
   - Log in. Ensure there is no event in progress on the Dashboard.
   - Verify that **Order** and **History** tabs in the bottom navigation are greyed out (opacity 40%) and unclickable.
   - Try typing `/order` or `/transactions` directly in the browser address bar; verify you are immediately redirected back to `/dashboard`.
2. **Case: Creating/activating an event**
   - Click "Create New Event" and start an event covering today's date.
   - Verify that **Order** and **History** tabs become enabled.
   - Verify navigating to `/order` and `/transactions` works.
   - Complete an order and verify the transaction is successfully logged and bound to the new event ID in the database.
