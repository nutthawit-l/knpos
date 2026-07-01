# Gmail POS Invitation System Design Specification

This design document outlines the implementation of a passwordless Gmail-only invitation system for Charni POS.

## 1. Goal Description

Allow shop owners to invite friends/partners via their `@gmail.com` email address. When the invited user clicks the invitation link from their email:
1. They are automatically registered in the system (if they do not already have an account).
2. They are added as a member to the inviting shop with the specified role ("owner" or "employee").
3. They are automatically logged in (a session is created and a cookie is set).
4. They are redirected to the dashboard.

## 2. Database Schema Changes

We will add a new table `shop_member_invite` to `schema.sql` to store active invitations.

```sql
CREATE TABLE shop_member_invite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'employee')),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL, -- ISO Date String
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    UNIQUE(shop_id, email)
);
```

## 3. Backend API Endpoints

### 3.1 Send Invite (`POST /api/members/invite`)
* **Request Payload**:
  ```json
  {
    "email": "friend@gmail.com",
    "role": "owner" | "employee"
  }
  ```
* **Logic**:
  1. Retrieve sender's user session and verify they are authorized (must be a member of the shop they are inviting to).
  2. Enforce email validation: must end with `@gmail.com` (case-insensitive).
  3. Generate a secure random token (UUID).
  4. Upsert the invitation into the `shop_member_invite` table.
  5. Log the invitation link to the console for simulation:
     `[INVITE] Invitation Link: http://localhost:5173/accept-invite?token=<UUID>`
  6. Return success status.

### 3.2 Accept Invite (`POST /api/members/accept`)
* **Request Payload**:
  ```json
  {
    "token": "UUID"
  }
  ```
* **Logic**:
  1. Look up the invitation by token.
  2. If the token does not exist or has expired, return a `400 Bad Request` error.
  3. Find or create the user in the `"user"` table:
     * Check if a user with that email already exists.
     * If not, create a new row in `"user"` (email, random password_hash, random password_salt, `is_verified = 1`).
  4. Add the user to the shop's members:
     * Insert/upsert a row in `shop_member` linking the user ID, shop ID, and the role specified in the invitation.
  5. Delete the invitation from `shop_member_invite` (to prevent reuse).
  6. Authenticate the user:
     * Create a new session in the `session` table.
     * Serialize and set the `session_token` cookie.
  7. Return user and shop information.

### 3.3 List Shop Members (`GET /api/members`)
* **Logic**:
  1. Authenticate sender using session cookie.
  2. Retrieve all members of their shop by joining `shop_member` and `"user"`.
  3. Return a list of members containing `id`, `name` (derived from email or display name), `email`, `role`, and `status` ('ACTIVE').

### 3.4 Delete Shop Member (`DELETE /api/members?id=<id>`)
* **Logic**:
  1. Authenticate sender and check if they are an `owner` of the shop.
  2. Delete the member record from the `shop_member` table.

## 4. Frontend Changes

### 4.1 Accept Invite Page (`src/pages/AcceptInvite.tsx`)
A new unauthenticated route at `/accept-invite` will:
* Parse the `token` parameter from the URL query params.
* Trigger a fetch request to `/api/members/accept` with the token.
* If successful, execute `useAuthStore.getState().verifyUser()` to reload user context, then redirect to `/dashboard`.
* If it fails, display a clean error layout with options to go to the Login page.

### 4.2 Member Management Hook (`src/hooks/useManageMembers.ts`)
* Replace local storage state in `useManageMembers` with backend state fetched from `/api/members`.
* Update `addMember` to trigger the backend `/api/members/invite` API.
* Update `deleteMember` to call `/api/members` DELETE API.

### 4.3 Email Validation (`src/pages/InvitePartners.tsx`)
* Restrict input validation to Gmail addresses (`@gmail.com`).
* Display error message if the address does not match.

## 5. Verification Plan

### 5.1 Automated Database Checks
* Execute schema updates locally using wrangler:
  `npx wrangler d1 execute charnipos-db --local --file=./schema.sql`

### 5.2 Manual UI Walkthrough
1. Go to the Invite page `/invite-partners`.
2. Input a valid `@gmail.com` address, select the role, and click **SEND INVITATION**.
3. Verify that the simulated invite link is printed to the terminal logs.
4. Copy the link, log out of the current session.
5. Paste the link into the browser.
6. Verify the application automatically logs the user in and redirects to `/dashboard` with correct shop membership and role.
