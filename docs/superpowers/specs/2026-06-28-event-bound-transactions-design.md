# Design Spec: Event-bound Transactions (Hybrid Form Approach)

We will design and implement the ability to bind transactions strictly to events in the database, view transaction data for specific events (active or past), disable ordering when viewing past events, and edit upcoming events by pre-filling their details using a shared `EventForm` component on separate routes.

## Proposed Changes

### 1. Database Schema
**File:** [schema.sql](file:///home/tie/Projects/knpos/schema.sql)
* Update the `"order"` table schema to enforce that every transaction must belong to a valid event:
  * Set `event_id INTEGER NOT NULL`.
  * Set the foreign key constraint deletion rule to `ON DELETE RESTRICT`.

### 2. Dashboard Event Actions
**File:** [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)
* Make the event cards clickable.
* In the click handler, execute the following routing logic:
  * **`upcoming`**: Navigate to the edit event route:
    `navigate('/edit-event?event_id=' + event.id)`
  * **`inprogress`**: Navigate to the transactions page with parameters:
    `navigate('/transactions?event_id=' + event.id + '&event_name=' + encodeURIComponent(event.name))`
  * **`ended` (past)**: Navigate to the transactions page with parameters and order disable flag:
    `navigate('/transactions?event_id=' + event.id + '&event_name=' + encodeURIComponent(event.name) + '&disable_order=true')`
* Add cursor pointer and subtle scale/hover animation styling to the event cards to make them feel interactive.

### 3. Route Registration & Main Layout configuration
**File:** [App.tsx](file:///home/tie/Projects/knpos/src/App.tsx)
* Register a new route: `{ path: "/edit-event", element: <EditEvent /> }`.

**File:** [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
* Register `/edit-event` in `ROUTE_CONFIGS` with layout configurations similar to `/create-event`:
  ```typescript
  '/edit-event': {
    title: 'Edit Event',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: '/dashboard',
  },
  ```
* **Route Guard:** Update the `useEffect` guard logic to permit access to `/transactions` if `event_id` is present in the query parameters, even if there is no active/in-progress event.
* **Header Title:** Inspect the query parameters on `/transactions` for `event_name`. If present, display `"Transaction of ${event_name}"` instead of the default title.

### 4. Bottom Navigation Link Control
**File:** [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)
* Check the current URL parameters for `disable_order=true`.
* If `disable_order` is `true`, disable the Order button (`disabled={!hasEvent || isOrderDisabled}`) and style it as inactive (opacity-40, cursor-not-allowed).

### 5. Shared Event Form Component
**File:** [NEW] [EventForm.tsx](file:///home/tie/Projects/knpos/src/components/EventForm.tsx)
* Extract the form structure from `CreateEvent.tsx` into a reusable `EventForm` component.
* Props:
  ```typescript
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
  ```
* Form submission logic:
  * For `create`: `POST` to `/api/event`. On success, set active event and redirect to `/order` after a 1-second success animation ("Event Started! 🎉").
  * For `edit`: `PUT` to `/api/event` with the event's `id`. On success, redirect back to `/dashboard` after a 1-second success animation ("Event Updated! 🎉").
* Customize page text dynamically:
  * Mode `create`: Banner title "Let's track our costs!", button label "START EVENT".
  * Mode `edit`: Banner title "Let's update our costs!", button label "SAVE CHANGES".

### 6. Create and Edit Event Pages
**File:** [CreateEvent.tsx](file:///home/tie/Projects/knpos/src/pages/CreateEvent.tsx)
* Update to simply render: `<EventForm mode="create" />`.

**File:** [NEW] [EditEvent.tsx](file:///home/tie/Projects/knpos/src/pages/EditEvent.tsx)
* Read `event_id` from the URL parameters.
* On mount, fetch the event details from `/api/event` (we will support single event lookup by ID if a query parameter `id` is passed, or search within the returned events).
* Render a loading spinner while fetching event data.
* Render `<EventForm mode="edit" initialData={event} />` once the data is loaded.

### 7. Event API Updates (GET & PUT)
**File:** [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
* **GET Handler (`onRequestGet`):** Support retrieving a single event by ID if `id` is passed as a query parameter (e.g. `/api/event?id=123`).
* **PUT Handler (`onRequestPut`):** Support updating an existing event:
  * Perform session validation (must be authenticated, must belong to the shop).
  * Update the event record in the database using:
    `UPDATE event SET name = ?, country = ?, start_date = ?, end_date = ?, booth_rental = ?, travel = ?, accommodation = ?, food_allowance = ? WHERE id = ?`
  * Return the updated event record.

### 8. Transactions API Event Support
**File:** [transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts)
* Update the `onRequestGet` handler to look for `event_id` in the query parameters.
* If `event_id` is supplied:
  1. Retrieve the event details to verify it exists and determine the currency code from its country.
  2. Query **all-time totals, product sales volumes, and individual orders** filtered by `event_id` (without applying any daily date range filter).
  3. Return these results along with the resolved event currency code.
* If `event_id` is not supplied, fall back to today's transaction data filtered by currency for the active event (default behavior).

### 9. Transactions Page View
**File:** [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
* Read `event_id` from the URL query parameters.
* If `event_id` is present, fetch the transactions using `/api/transaction?event_id=${eventId}`.
* Keep a local currency state that defaults to `selectedCurrency` from the store but is updated to the event's currency code returned by the API (if `eventCurrency` is provided in the API response).
* If viewing a specific event:
  * Update the Hero label from **"Total Sales Today"** to **"Event Total Sales"**.
  * Hide date-relative indicators (e.g., "+12% vs yesterday").
  * In the **Order by Order** view, display sequential order numbers relative to the event (e.g. `Order #1`, `Order #2`, ... `Order #N`) starting from the oldest transaction. Since the API returns orders sorted by `created_at DESC` (newest first), the displayed order number for index `idx` will be `orders.length - idx`.

---

## Verification Plan

### Automated Tests
* None currently available. We will verify the changes via manual checks.

### Manual Verification
1. **Database Constraint:** Verify that deleting an event with existing transactions raises a RESTRICT error.
2. **Upcoming Events:** Click on an upcoming event card on the Dashboard, verify that `/edit-event` loads with a spinner, populates details into the form, change a value, click "SAVE CHANGES", and verify it updates in the Dashboard.
3. **In-Progress Events:** Click an in-progress event, verify you are redirected to `/transactions` displaying the event name, and the "Order" tab is active.
4. **Past Events:** Click a past event, verify you are redirected to `/transactions` showing correct event details, and the "Order" tab in the bottom navigation is disabled.
