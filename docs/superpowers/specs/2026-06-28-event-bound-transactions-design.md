# Design Spec: Event-bound Transactions

We will design and implement the ability to bind transactions strictly to events in the database, view transaction data for specific events (active or past), disable ordering when viewing past events, and edit upcoming events by pre-filling their details from the Dashboard.

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
  * **`upcoming`**: Navigate to `/create-event` with the event data prefilled in the React Router navigation state:
    `navigate('/create-event', { state: { editEvent: event } })`
  * **`inprogress`**: Navigate to the transactions page with parameters:
    `navigate('/transactions?event_id=' + event.id + '&event_name=' + encodeURIComponent(event.name))`
  * **`ended` (past)**: Navigate to the transactions page with parameters and order disable flag:
    `navigate('/transactions?event_id=' + event.id + '&event_name=' + encodeURIComponent(event.name) + '&disable_order=true')`
* Add cursor pointer and subtle scale/hover animation styling to the event cards to make them feel interactive.

### 3. Main Layout Route Guard and Header Title
**File:** [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
* **Route Guard:** Update the `useEffect` guard logic to permit access to `/transactions` if `event_id` is present in the query parameters, even if there is no active/in-progress event.
* **Header Title:** Inspect the query parameters on `/transactions` for `event_name`. If present, display `"Transaction of ${event_name}"` instead of the default title.

### 4. Bottom Navigation Link Control
**File:** [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)
* Check the current URL parameters for `disable_order=true`.
* If `disable_order` is `true`, disable the Order button (`disabled={!hasEvent || isOrderDisabled}`) and style it as inactive (opacity-40, cursor-not-allowed).

### 5. Create Event & Edit Form Support
**File:** [useCreateEventForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateEventForm.ts)
* Read `editEvent` from `useLocation().state`.
* If `editEvent` is present, initialize the form fields with the existing event's details.
* Keep track of an `eventId` state (null if creating, `editEvent.id` if editing).
* When submitting, if editing:
  * Send a `PUT` request to `/api/event` instead of `POST`.
  * Pass the event `id` in the JSON payload.
* Export `isEditing = !!editEvent` to customize UI texts.

**File:** [CreateEvent.tsx](file:///home/tie/Projects/knpos/src/pages/CreateEvent.tsx)
* Update UI text according to `isEditing`:
  * If editing: Display "Let's update our costs!" in the banner instead of "Let's track our costs!".
  * If editing: Display "SAVE CHANGES" on the submit button instead of "START EVENT".
  * If editing: Display "Event Updated! 🎉" on success instead of "Event Started! 🎉".

### 6. Event API Update Handler
**File:** [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
* Implement an `onRequestPut` handler:
  * Authenticate the user and retrieve their shop ID.
  * Update the event record in the database using:
    `UPDATE event SET name = ?, country = ?, start_date = ?, end_date = ?, booth_rental = ?, travel = ?, accommodation = ?, food_allowance = ? WHERE id = ?`
  * Return the updated event record.

### 7. Transactions API Event Support
**File:** [transaction.ts](file:///home/tie/Projects/knpos/functions/api/transaction.ts)
* Update the `onRequestGet` handler to look for `event_id` in the query parameters.
* If `event_id` is supplied:
  1. Retrieve the event details to verify it exists and determine the currency code from its country.
  2. Query **all-time totals, product sales volumes, and individual orders** filtered by `event_id` (without applying any daily date range filter).
  3. Return these results along with the resolved event currency code.
* If `event_id` is not supplied, fall back to today's transaction data filtered by currency for the active event (default behavior).

### 8. Transactions Page View
**File:** [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
* Read `event_id` from the URL query parameters.
* If `event_id` is present, fetch the transactions using `/api/transaction?event_id=${eventId}`.
* Keep a local currency state that defaults to `selectedCurrency` from the store but is updated to the event's currency code returned by the API (if `eventCurrency` is provided in the API response).
* If viewing a specific event:
  * Update the Hero label from **"Total Sales Today"** to **"Event Total Sales"**.
  * Hide date-relative indicators (e.g., "+12% vs yesterday").
  * Update items list label / ranking header if applicable.
  * In the **Order by Order** view, display sequential order numbers relative to the event (e.g. `Order #1`, `Order #2`, ... `Order #N`) starting from the oldest transaction. Since the API returns orders sorted by `created_at DESC` (newest first), the displayed order number for index `idx` will be `orders.length - idx`.


---

## Verification Plan

### Automated Tests
* None currently available. We will verify the changes via manual checks.

### Manual Verification
1. **Database Constraint:** Verify that deleting an event with existing transactions raises a RESTRICT error (or verify database schema matches).
2. **Upcoming Events:** Click on an upcoming event card on the Dashboard, verify that `/create-event` is pre-populated with details, change a value, click "SAVE CHANGES", and verify it updates in the Dashboard.
3. **In-Progress Events:** Click an in-progress event, verify you are redirected to `/transactions` displaying the event name, and the "Order" tab is active.
4. **Past Events:** Click a past event, verify you are redirected to `/transactions` showing correct event details, and the "Order" tab in the bottom navigation is disabled.
