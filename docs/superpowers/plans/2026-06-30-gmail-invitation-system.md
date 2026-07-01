# Gmail POS Invitation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a passwordless Gmail-only invitation system that allows shop owners to invite partners via Gmail, auto-registering and mapping them to the shop with correct roles when they accept the link.

**Architecture:** Create a new D1 database table `shop_member_invite` to hold invitations. Expose Cloudflare Pages backend functions to send invites, accept invites, list shop members, and delete shop members. Build a frontend `/accept-invite` route to capture the token, finalize registration/membership, and log the user in seamlessly.

**Tech Stack:** React, React Router v7, Zustand, Tailwind CSS, Cloudflare Pages Functions, SQLite (D1)

## Global Constraints
- Only invite email addresses ending with `@gmail.com` (case-insensitive).
- Passwords are not used for these accounts; authentication is either passwordless (via the secure invite token) or via Google OAuth.
- Map UI roles ("Co-Owner", "Employee") to database roles ("owner", "employee").

---

### Task 1: Add D1 Database Table for Invitations

**Files:**
- Modify: `schema.sql`

**Interfaces:**
- Produces: `shop_member_invite` table in D1 database

- [ ] **Step 1: Add `shop_member_invite` table schema to schema.sql**

Update `schema.sql` to define the new table and ensure it is dropped at the beginning of the script.

Add drop table line around line 15:
```sql
DROP TABLE IF EXISTS shop_member_invite;
```

Add the table definition at the end of the file (before `PRAGMA foreign_keys = ON;` around line 149):
```sql
CREATE TABLE shop_member_invite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'employee')),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    UNIQUE(shop_id, email)
);
```

- [ ] **Step 2: Run migration to apply schema to local database**

Run:
```bash
npx wrangler d1 execute charnipos-db --local --file=./schema.sql
```
Expected output: Successful execution of D1 SQL file locally.

- [ ] **Step 3: Verify the table is created successfully**

Run:
```bash
npx wrangler d1 execute charnipos-db --local --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='shop_member_invite'" --json
```
Expected output: A JSON output containing the CREATE TABLE SQL statement for `shop_member_invite`.

- [ ] **Step 4: Commit schema changes**

Run:
```bash
git add schema.sql
git commit -m "db: add shop_member_invite table schema"
```

---

### Task 2: Implement Send Invitation API Endpoint

**Files:**
- Create: `functions/api/members/invite.ts`

**Interfaces:**
- Produces: `POST /api/members/invite` API endpoint

- [ ] **Step 1: Create backend endpoint functions/api/members/invite.ts**

Create the file `functions/api/members/invite.ts` with the following implementation:

```typescript
import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie, generateUUID } from "../auth/helper";

export interface Env {
  DB: D1Database;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

interface MemberRow {
  shop_id: number;
  role: string;
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

    // Authenticate sender
    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Session invalid or expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch body
    const body: any = await context.request.json();
    const { email, role } = body; // role should be "owner" or "employee"

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Missing email or role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate email ends with @gmail.com
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith("@gmail.com")) {
      return new Response(JSON.stringify({ error: "Only Gmail addresses are supported for invitations" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (role !== "owner" && role !== "employee") {
      return new Response(JSON.stringify({ error: "Invalid role specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check sender's shop membership (must be shop member)
    const senderMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!senderMember) {
      return new Response(JSON.stringify({ error: "Sender is not associated with any shop" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inviteToken = generateUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry

    // Insert or replace invitation
    await context.env.DB.prepare(
      `INSERT OR REPLACE INTO shop_member_invite (shop_id, email, role, token, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(senderMember.shop_id, trimmedEmail, role, inviteToken, expiresAt)
      .run();

    // Log the invitation URL to the console (simulating sending the email)
    const url = new URL(context.request.url);
    const inviteLink = `${url.origin}/accept-invite?token=${inviteToken}`;
    console.log(`\n==================================================`);
    console.log(`[INVITE] Invitation link for ${trimmedEmail}:`);
    console.log(`${inviteLink}`);
    console.log(`Role: ${role}`);
    console.log(`Expires at: ${expiresAt}`);
    console.log(`==================================================\n`);

    return new Response(JSON.stringify({ success: true, message: "Invitation sent successfully" }), {
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

- [ ] **Step 2: Verify API compiles (TypeScript typecheck)**

Run:
```bash
pnpm build
```
Expected output: Success build, no TypeScript compiling errors.

- [ ] **Step 3: Commit the new Send Invitation endpoint**

Run:
```bash
git add functions/api/members/invite.ts
git commit -m "feat: add send invitation api endpoint"
```

---

### Task 3: Implement Accept Invitation API Endpoint

**Files:**
- Create: `functions/api/members/accept.ts`

**Interfaces:**
- Produces: `POST /api/members/accept` API endpoint

- [ ] **Step 1: Create backend endpoint functions/api/members/accept.ts**

Create the file `functions/api/members/accept.ts` with the following implementation:

```typescript
import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { generateUUID, serializeCookie } from "../auth/helper";

export interface Env {
  DB: D1Database;
}

interface InviteRow {
  shop_id: number;
  email: string;
  role: string;
  expires_at: string;
}

interface UserRow {
  id: number;
  email: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: any = await context.request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing invitation token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve invite details
    const invite = await context.env.DB.prepare(
      "SELECT shop_id, email, role, expires_at FROM shop_member_invite WHERE token = ?"
    )
      .bind(token)
      .first<InviteRow>();

    if (!invite) {
      return new Response(JSON.stringify({ error: "Invalid or expired invitation link" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      // Clean up expired invite
      await context.env.DB.prepare("DELETE FROM shop_member_invite WHERE token = ?").bind(token).run();
      return new Response(JSON.stringify({ error: "Invitation link has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create user
    let user = await context.env.DB.prepare(
      'SELECT id, email FROM "user" WHERE email = ?'
    )
      .bind(invite.email)
      .first<UserRow>();

    if (!user) {
      const dummyPasswordHash = generateUUID();
      const dummySalt = generateUUID();

      // Create new user (automatically verified)
      const userResult = await context.env.DB.prepare(
        'INSERT INTO "user" (email, password_hash, password_salt, is_verified) VALUES (?, ?, ?, 1) RETURNING id, email'
      )
        .bind(invite.email, dummyPasswordHash, dummySalt)
        .first<UserRow>();

      if (!userResult) {
        throw new Error("Failed to auto-register user account");
      }
      user = userResult;
    }

    // Check/Insert shop member association
    await context.env.DB.prepare(
      `INSERT OR IGNORE INTO shop_member (shop_id, user_id, role)
       VALUES (?, ?, ?)`
    )
      .bind(invite.shop_id, user.id, invite.role)
      .run();

    // Delete the invitation since it was accepted successfully
    await context.env.DB.prepare("DELETE FROM shop_member_invite WHERE token = ?").bind(token).run();

    // Authenticate the user and create session
    const sessionId = generateUUID();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(
      "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
      .bind(sessionId, user.id, sessionExpiry)
      .run();

    // Serialize Cookie
    const cookieString = serializeCookie("session_token", sessionId, {
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieString,
        },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

- [ ] **Step 2: Run typecheck to ensure code builds**

Run:
```bash
pnpm build
```
Expected output: Success build, no TypeScript compiling errors.

- [ ] **Step 3: Commit the new Accept Invitation endpoint**

Run:
```bash
git add functions/api/members/accept.ts
git commit -m "feat: add accept invitation api endpoint"
```

---

### Task 4: Implement List and Delete Members API Endpoints

**Files:**
- Create: `functions/api/members.ts`

**Interfaces:**
- Produces: `GET /api/members` and `DELETE /api/members` API endpoints

- [ ] **Step 1: Create backend endpoint functions/api/members.ts**

Create the file `functions/api/members.ts` with the following implementation:

```typescript
import type { PagesFunction, D1Database } from "@cloudflare/workers-types";
import { getCookie } from "./auth/helper";

export interface Env {
  DB: D1Database;
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

interface MemberRow {
  shop_id: number;
  role: string;
}

interface DbShopMember {
  id: number;
  email: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const cookieHeader = context.request.headers.get("Cookie");
    const token = getCookie(cookieHeader, "session_token");

    if (!token) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user shop member details
    const currentMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!currentMember) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve all members of this shop
    const { results } = await context.env.DB.prepare(
      `SELECT u.id, u.email, sm.role
       FROM shop_member sm
       JOIN "user" u ON sm.user_id = u.id
       WHERE sm.shop_id = ?`
    )
      .bind(currentMember.shop_id)
      .all<DbShopMember>();

    // Map database roles to UI roles
    const mapped = (results || []).map((r) => {
      const emailPrefix = r.email.split("@")[0];
      const formattedName = emailPrefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      return {
        id: String(r.id),
        name: formattedName,
        email: r.email,
        role: r.role === "owner" ? "Co-Owner" : "Employee",
        status: "ACTIVE",
      };
    });

    return new Response(JSON.stringify(mapped), {
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
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
      .first<SessionRow>();

    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Session invalid or expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const targetUserIdStr = url.searchParams.get("id");

    if (!targetUserIdStr) {
      return new Response(JSON.stringify({ error: "Missing user id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetUserId = parseInt(targetUserIdStr, 10);
    if (isNaN(targetUserId)) {
      return new Response(JSON.stringify({ error: "Invalid user id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check sender's role (only owners can remove members)
    const currentMember = await context.env.DB.prepare(
      "SELECT shop_id, role FROM shop_member WHERE user_id = ?"
    )
      .bind(session.user_id)
      .first<MemberRow>();

    if (!currentMember || currentMember.role !== "owner") {
      return new Response(JSON.stringify({ error: "Forbidden: Only owners can remove members" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if target is in the same shop
    const targetMember = await context.env.DB.prepare(
      "SELECT shop_id FROM shop_member WHERE user_id = ?"
    )
      .bind(targetUserId)
      .first<MemberRow>();

    if (!targetMember || targetMember.shop_id !== currentMember.shop_id) {
      return new Response(JSON.stringify({ error: "Member not found in your shop" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Don't allow owner to remove themselves from shop (must have at least one owner)
    if (targetUserId === session.user_id) {
      return new Response(JSON.stringify({ error: "Cannot remove yourself from the shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete membership association
    await context.env.DB.prepare(
      "DELETE FROM shop_member WHERE user_id = ? AND shop_id = ?"
    )
      .bind(targetUserId, currentMember.shop_id)
      .run();

    return new Response(JSON.stringify({ success: true, message: "Member removed" }), {
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

- [ ] **Step 2: Run typecheck to verify build**

Run:
```bash
pnpm build
```
Expected output: Success build, no TypeScript compiling errors.

- [ ] **Step 3: Commit the new Members listing and deleting API endpoints**

Run:
```bash
git add functions/api/members.ts
git commit -m "feat: add members list and delete api endpoints"
```

---

### Task 5: Implement Accept Invite Page and Integrate UI with backend APIs

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/AcceptInvite.tsx`
- Modify: `src/hooks/useManageMembers.ts`
- Modify: `src/pages/InvitePartners.tsx`

**Interfaces:**
- Consumes: `POST /api/members/invite`, `POST /api/members/accept`, `GET /api/members`, `DELETE /api/members`

- [ ] **Step 1: Create AcceptInvite page component**

Create the file `src/pages/AcceptInvite.tsx` with the following implementation:

```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AuthLayout from '../components/AuthLayout';
import MascotLogo from '../components/MascotLogo';
import AuthButton from '../components/AuthButton';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const verifyUser = useAuthStore((state) => state.verifyUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMsg('No invitation token found in link.');
      return;
    }

    const processInvitation = async () => {
      try {
        const response = await fetch('/api/members/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to accept invitation');
        }

        setStatus('success');
        await verifyUser();
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'An unexpected error occurred.');
      }
    };

    processInvitation();
  }, [token, isAuthenticated, navigate, verifyUser]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <MascotLogo className="mb-4" />
        <h1 className="text-[28px] leading-[36px] font-bold text-text-brown tracking-tight">
          Shop Invitation
        </h1>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-text-brown text-[16px]">
            Accepting invitation and logging you in...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-3 p-5 bg-red-50 border border-red-100 rounded-3xl text-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <h3 className="font-bold text-[16px] text-red-700">Invitation Error</h3>
            <p className="text-[14px] text-red-600 font-medium leading-normal">
              {errorMsg}
            </p>
          </div>

          <div className="pt-2">
            <AuthButton
              icon={ArrowRight}
              onClick={() => navigate('/login')}
              type="button"
              variant="primary"
            >
              Go to Login
            </AuthButton>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default AcceptInvite;
```

- [ ] **Step 2: Register AcceptInvite route in src/App.tsx**

Add the `/accept-invite` path to the router in `src/App.tsx` (ensure it is accessible without authentication, so it is outside the ProtectedRoute wrapper or added at the top level).

Around line 31, modify the router initialization:
```typescript
const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/accept-invite", element: <AcceptInvite /> },
  {
    element: <ProtectedRoute />,
    ...
```

Add imports to `src/App.tsx`:
```typescript
import AcceptInvite from "./pages/AcceptInvite";
```

- [ ] **Step 3: Update src/hooks/useManageMembers.ts to use database APIs**

Replace the current implementation of `useManageMembers` with the following, connecting it directly to our database-backed endpoints:

```typescript
import { useState, useEffect } from 'react';
import type { Member } from '../data/mockData';

export function useManageMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const addMember = async (name: string, role: string, email?: string) => {
    if (!email) return;
    try {
      // Map UI role to DB role format
      const dbRole = role === 'Co-Owner' ? 'owner' : 'employee';
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: dbRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      alert(`Invitation sent successfully to ${email}!`);
      fetchMembers(); // refresh
    } catch (e: any) {
      alert(e.message || 'Failed to send invitation');
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }
      fetchMembers(); // refresh
    } catch (e: any) {
      alert(e.message || 'Failed to delete member');
    }
  };

  return {
    members,
    isLoading,
    error,
    addMember,
    deleteMember,
  };
}

export type UseManageMembersReturn = ReturnType<typeof useManageMembers>;
```

- [ ] **Step 4: Update src/pages/InvitePartners.tsx to validate Gmail email format**

Modify the email validation rules in `src/pages/InvitePartners.tsx` to enforce that only `@gmail.com` addresses are accepted.

Around line 20, update the email validation:
```typescript
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!trimmedEmail.toLowerCase().endsWith('@gmail.com')) {
      alert('Only Gmail addresses (@gmail.com) are supported for invitations.');
      return;
    }
```

- [ ] **Step 5: Run typecheck and local build check**

Run:
```bash
pnpm build
```
Expected output: Success build, no TypeScript compiler errors.

- [ ] **Step 6: Commit all frontend page and route modifications**

Run:
```bash
git add src/App.tsx src/pages/AcceptInvite.tsx src/hooks/useManageMembers.ts src/pages/InvitePartners.tsx
git commit -m "feat: integrate frontend invitation acceptance page and update manage members hook"
```
