# Design Spec: Event Creator Permissions, Roles, and Sorting

We will design and implement the user-specific event roles (`creator`, `collaborator`, `assistant`), access permission rules, dynamic sorting logic, and a one-time join confirmation modal persisted in the database.

## 1. Database Schema updates
**File:** [schema.sql](file:///home/tie/Projects/knpos/schema.sql)
* Update the CHECK constraint on `event_member.role`:
  ```sql
  role TEXT NOT NULL CHECK(role IN ('creator', 'collaborator', 'assistant'))
  ```
* Add the `has_joined` column to `event_member`:
  ```sql
  has_joined INTEGER NOT NULL DEFAULT 0
  ```

## 2. Backend & Seeding Updates

### 2.1 Event Creation (`POST /api/event`)
**File:** [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
* In `onRequestPost` (create event):
  * Insert the creator into `event_member` with `role = 'creator'` and `has_joined = 1`.
  * Query other owners of the shop:
    ```sql
    SELECT user_id FROM shop_member WHERE shop_id = ? AND role = 'owner' AND user_id != ?
    ```
  * Batch insert other owners into `event_member` with `role = 'collaborator'` and `has_joined = 0`.

### 2.2 Member Invitation Acceptance (`POST /api/members/accept`)
**File:** [accept.ts](file:///home/tie/Projects/knpos/functions/api/members/accept.ts)
* In `onRequestPost` (accept invite), when a user accepts an invite to join a shop:
  * Check if their shop member role is `'owner'`.
  * If yes, fetch all existing events for the shop:
    ```sql
    SELECT id FROM event WHERE shop_id = ?
    ```
  * For each existing event, auto-insert a row in `event_member` linking the new owner to the event with `role = 'collaborator'` and `has_joined = 0`:
    ```sql
    INSERT OR IGNORE INTO event_member (event_id, user_id, role, has_joined) VALUES (?, ?, 'collaborator', 0)
    ```

### 2.3 Join Event API Endpoint (`POST /api/event/join`)
**File:** [NEW] [join.ts](file:///home/tie/Projects/knpos/functions/api/event/join.ts)
* Create a POST handler to let non-creators join an event:
  * Authenticate session token and extract `user_id`.
  * Parse `eventId` from request body.
  * Verify the event exists and belongs to the user's shop.
  * Get the user's role in the shop (`shop_member.role`).
  * Determine the event role:
    * If shop owner $\rightarrow$ `'collaborator'`
    * If shop employee $\rightarrow$ `'assistant'`
  * Upsert the `event_member` table to set `has_joined = 1`:
    ```sql
    INSERT INTO event_member (event_id, user_id, role, has_joined)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(event_id, user_id) DO UPDATE SET has_joined = 1
    ```

### 2.4 Event List API (`GET /api/event`)
**File:** [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
* Ensure `GET /api/event` returns `has_joined` as well as the new role naming (`creator`, `collaborator`, `assistant`) from the `event_member` table.

### 2.5 Seeding Scripts (`scripts/seed.ts` and `seed/seed-events.ts`)
* Update `scripts/seed.ts` to insert members with roles `'creator'`, `'collaborator'`, or `'assistant'`.
* Seed dynamic collaborator events in `seed/seed-events.ts` to test multiple roles:
  * Assign `user_id = 1` as `'creator'` for Event 1 & 3.
  * Assign `user_id = 1` as `'collaborator'` with `has_joined = 1` for Event 2.
  * Assign `user_id = 1` as `'collaborator'` with `has_joined = 0` for Event 4.

## 3. Frontend Dashboard & Modal Integration

### 3.1 Sorting & Formatting on Dashboard
**File:** [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)
* Define a primary sorting group priority for each event:
  * **Group 1**: Creator (`role === 'creator'`)
  * **Group 2**: Joined Collaborator/Assistant (`role !== 'creator' && has_joined === 1`)
  * **Group 3**: Non-Joined Collaborator/Assistant (`role !== 'creator' && has_joined === 0`)
* Within each group, sort events by:
  * Status: `inprogress` $\rightarrow$ `upcoming` $\rightarrow$ `ended/past`
  * Date: `startDate DESC`
* Add user status badges to each event card:
  * **Creator**: Warm pink theme
  * **Collaborator**: Emerald theme
  * **Assistant**: Calm blue theme

### 3.2 Confirmation Modal UI
**File:** [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)
* Implement a stateful join confirmation modal.
* If a card in **Group 3** is clicked, display the modal: *"Are you sure you want to join [Event Name]?"*
* If the user clicks **Confirm**:
  * Send `POST /api/event/join`.
  * On success, update the state so `has_joined = 1` for that event, and enter the event (navigate to transactions page).
* If the user clicks **Cancel**:
  * Dismiss the modal.

### 3.3 Permissions Access Control
**File:** [event.ts](file:///home/tie/Projects/knpos/functions/api/event.ts)
* In `onRequestPut` (save event edits), verify that the user's role in `event_member` is `'creator'`. If not, return a `403 Forbidden` error.

**File:** [EventForm.tsx](file:///home/tie/Projects/knpos/src/components/EventForm.tsx)
* If the user is editing an event and their role is not `'creator'`:
  * Show a read-only message: *"You are viewing this event as a collaborator. Only the creator can edit event details."*
  * Disable all inputs and the save button.

---

## 4. Verification Plan

### Automated Tests
* None available.

### Manual Verification
1. Run `make migrate` and `make seed` to apply the updated schema and seed roles.
2. Log in as `test@example.com` and open the Dashboard.
3. Verify that the events are sorted exactly by:
   - Creator events first (sorted by inprogress $\rightarrow$ upcoming $\rightarrow$ ended, then date DESC).
   - Joined collaborator events second.
   - Non-joined collaborator events third.
4. Verify that the cards display the correct role badges: "Creator" and "Collaborator".
5. Click on the non-joined upcoming event ("Charni Showcase (Upcoming)"). Verify that the "Join Event" confirmation modal pops up.
6. Click "Cancel". Verify you remain on the Dashboard.
7. Click the card again, then click "Confirm". Verify that it successfully calls the API, updates the database, changes the card badge, and enters the event.
8. Go back to the Dashboard. Verify the event card has moved to the "Joined" section and clicking it enters directly without the modal.
9. Try to edit an event created by another user. Verify the form is read-only and details cannot be changed.
