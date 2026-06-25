# Design Specification: Conditional Dashboard States

## Objective
Implement conditional rendering on the POS Dashboard based on the presence of ended events:
1. **State 1 (No ended events):** Hide the Shop Summary section. Under Recent Events, display only `inprogress` and `upcoming` events. Show the Create New Event button.
2. **State 2 (Has at least one ended event):** Show the Shop Summary section (reusing mock data for now), show all events, and show the Create New Event button.

Events will be fetched dynamically from the database via `/api/event`, computing the status and sales/profit aggregates at query time.

## Proposed Changes

### 1. Backend API: [functions/api/event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
- Update `onRequestGet` to accept a `today` query parameter (e.g. `/api/event?today=YYYY-MM-DD`).
- Modify the SQL query to calculate:
  - `status`: Computed dynamically:
    ```sql
    CASE 
        WHEN ?3 < e.start_date THEN 'upcoming'
        WHEN ?3 BETWEEN e.start_date AND e.end_date THEN 'inprogress'
        ELSE 'ended'
    END AS status
    ```
  - `totalSales`: Computed via `COALESCE(SUM(o.total_income), 0)` by joining with the `"order"` table grouped by event ID.
  - `netProfit`: Calculated as `totalSales - (e.booth_rental + e.travel + e.accommodation + e.food_allowance)`.

### 2. Frontend Page: [src/pages/Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)
- Add state to fetch and hold events from `/api/event?today=YYYY-MM-DD`.
- Add local storage or store helper to retrieve the correct dates using client local time.
- Determine if any event has `status === 'ended'`.
- Render the UI based on the state:
  - If no ended event exists, hide the Shop Summary section, and filter the events list to only display `inprogress` and `upcoming` events.
  - If at least one ended event exists, show the Shop Summary section (from `DASHBOARD2_DATA` mock data) and render all events in the list.

## Verification Plan

### Automated Verification
- Verify compilation using `pnpm build`.
- Check styling and formatting using `pnpm lint`.

### Manual Verification
- Access the dashboard with a clean database (no events created) -> Ensure Shop Summary is hidden, the event list is empty, and only the "Create New Event" button is visible.
- Create an `inprogress` or `upcoming` event -> Ensure the event list displays the new event, but the Shop Summary section remains hidden.
- Create an `ended` event (an event with an end date in the past) -> Ensure the Shop Summary section (mock data) is displayed, and the past events are listed with their correct status, total sales, and profit.
