# Design Spec: Event Seeding Tool

A utility script to seed and maintain past, in-progress, and upcoming events bound to `shop_id = 1` in the local or remote D1 database.

## Context and Scope
The current system seeds a single event via `scripts/seed.ts`, which drops and rebuilds the whole schema. The new target `seed-events.ts` will selectively seed or update events for `shop_id = 1` without deleting existing events or other unrelated data. It is designed to be idempotent and self-correcting: running it multiple times adjusts the start and end dates relative to "today" to keep the events in their proper chronological buckets (past, in-progress, upcoming).

## Goals
1. Calculate dynamic, relative event dates relative to the execution day:
   - 2 past events (dates completely in the past).
   - 1 in-progress event (start date in the past, end date in the future).
   - 1 upcoming event (start date and end date in the future).
2. Check existing events for `shop_id = 1` in the D1 database.
3. For existing seeded events (matched by name), update their start and end dates to align with the current date.
4. For new seeded events, insert them into the `event` table.
5. Integrate the script into the `Makefile` with `seed-events` and `remote-seed-events` targets.

## Proposed Design

### 1. Script Architecture (`seed/seed-events.ts`)

- **Environment & Flags:**
  - Accepts a `--remote` CLI flag.
  - Determines the Wrangler flag (`--local` vs `--remote`).
  - Uses `npx wrangler d1 execute charnipos-db` to query and update the database.

- **Dynamic Date Logic:**
  - `today` is defined as a `Date` object at script execution time.
  - Date strings will be formatted as `YYYY-MM-DD` in the local timezone.

- **Event Definitions:**
  1. **Past Event A:** "Pop-up Craft Fair (Past)"
     - Country: "Thailand"
     - Start Date: `today - 45 days`
     - End Date: `today - 40 days`
     - Expenses: booth_rental=1000, travel=200, accommodation=500, food_allowance=100
  2. **Past Event B:** "Singapore Art Festival (Past)"
     - Country: "Singapore"
     - Start Date: `today - 20 days`
     - End Date: `today - 15 days`
     - Expenses: booth_rental=1500, travel=400, accommodation=800, food_allowance=200
  3. **In-Progress Event:** "Design Week Expo (Current)"
     - Country: "Thailand"
     - Start Date: `today - 2 days`
     - End Date: `today + 2 days`
     - Expenses: booth_rental=1200, travel=100, accommodation=400, food_allowance=150
  4. **Upcoming Event:** "Charni Showcase (Upcoming)"
     - Country: "Singapore"
     - Start Date: `today + 15 days`
     - End Date: `today + 20 days`
     - Expenses: booth_rental=1800, travel=500, accommodation=1000, food_allowance=250

- **Database Operations:**
  1. Query existing events:
     `SELECT id, name FROM event WHERE shop_id = 1`
  2. Check existing events by name:
     - If the event exists, compile an `UPDATE` statement:
       `UPDATE event SET start_date = ?, end_date = ? WHERE id = ?`
     - If the event does not exist, compile an `INSERT` statement:
       `INSERT INTO event (shop_id, name, country, start_date, end_date, booth_rental, travel, accommodation, food_allowance) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
  3. Batch execute the compiled SQL statements using a temporary SQL file and wrangler CLI.

### 2. Makefile Integration

Modify the `Makefile` to add the following targets:

```makefile
seed-events:
	npx tsx seed/seed-events.ts

remote-seed-events:
	npx tsx seed/seed-events.ts --remote
```

## Verification Plan

### Manual Verification
1. Run `make seed-events` on the local environment.
2. Verify that:
   - 4 events are created with the correct names, countries, expenses, and dates relative to today.
3. Check the database to verify the rows:
   - Past events should have end dates before today.
   - The in-progress event should have a start date <= today and an end date >= today.
   - The upcoming event should have a start date in the future.
4. Run `make seed-events` a second time:
   - Verify that no duplicate events are created.
   - Check that the dates are updated correctly.
5. Run `make remote-seed-events` to verify D1 execution on the remote Cloudflare environment.
