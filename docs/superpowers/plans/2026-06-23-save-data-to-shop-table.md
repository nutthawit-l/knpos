# Save Data to Shop Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `create-shop.ts`, add POST/GET support to `/api/shop` to create and query shop mappings, consolidate local form logic inside `CreateShop.tsx`, update user store state with onboarding marked as incomplete, and navigate back to `/get-started`.

**Architecture:** 
- In `functions/api/shop.ts`, add POST request handling (`onRequestPost`) to insert a new shop and map the authenticated user as `'owner'` in the `shop_member` table. Fix the GET handler (`onRequestGet`) to return the `shopId` directly as a clean number.
- Delete `functions/api/auth/create-shop.ts` completely.
- Inline form states (`shopName`, `description`, `isLoading`) directly inside `CreateShop.tsx`, calling POST `/api/shop` and using the returned `shopId` from the POST response directly to update the Zustand auth store (without making an extra GET request).
- Set global onboarding state `isOnboardingComplete` to `false` in `useAuthStore.ts`.

**Tech Stack:** React, TypeScript, Zustand, Cloudflare Workers D1 database backend.

## Global Constraints
- Target mobile screen layout design (max-width: 400px).
- Keep pull requests small and focused.
- Follow Conventional Commits standard.
- Do not use placeholders (like TODO/TBD/implement later).

---

### Task 1: Update Auth Store Onboarding State

**Files:**
- Modify: `src/store/useAuthStore.ts`

**Interfaces:**
- Consumes: None
- Produces: `useAuthStore` state structure with `isOnboardingComplete: false`

- [ ] **Step 1: Modify useAuthStore.ts**
  Modify [useAuthStore.ts](file:///home/tie/Projects/knpos/src/store/useAuthStore.ts) to hardcode `isOnboardingComplete` to `false` in `verifyUser` and `loginWithGoogleToken`.

```typescript
// Replace lines 54 and 92:
isOnboardingComplete: false,
```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/store/useAuthStore.ts
  git commit -m "feat: keep isOnboardingComplete as false for onboarding flow"
  ```

---

### Task 2: Refactor `/api/shop` API Endpoint (GET and POST)

**Files:**
- Modify: `functions/api/shop.ts`

**Interfaces:**
- Consumes: Database (D1Database)
- Produces: 
  - `onRequestGet`: Returns `{ success: true, exists: boolean, shopId: number | null }` where `shopId` is a clean number.
  - `onRequestPost`: Creates shop in `shop` table and inserts mapping into `shop_member` table, returning `{ success: true, shopId: number }`.

- [ ] **Step 1: Refactor functions/api/shop.ts**
  Replace the contents of [shop.ts](file:///home/tie/Projects/knpos/functions/api/shop.ts) to implement both GET and POST requests.

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

// GET: Retrieve shop ID for a user
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const fields = url.searchParams.get('fields');
    const limit = url.searchParams.get('limit');
    let userIdStr = url.searchParams.get("user_id");

    if (!userIdStr) {
      const cookieHeader = context.request.headers.get("Cookie");
      const token = getCookie(cookieHeader, "session_token");

      if (token) {
        const session = await context.env.DB.prepare(
          "SELECT user_id, expires_at FROM session WHERE id = ?"
        )
          .bind(token)
          .first<SessionRow>();

        if (session) {
          const expiresAt = new Date(session.expires_at).getTime();
          if (expiresAt >= Date.now()) {
            userIdStr = String(session.user_id);
          }
        }
      }
    }

    if (!userIdStr) {
      return new Response(
        JSON.stringify({ error: "user_id query parameter is required or user must be authenticated" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (fields == "id" && limit == "1") {
      const row = await context.env.DB.prepare(
        `SELECT shop_id
        FROM shop_member
        WHERE user_id = ?`
      )
        .bind(userId)
        .first<{ shop_id: number } | null>();

      const shopId = row ? row.shop_id : null;

      if (shopId === null) {
        return new Response(
          JSON.stringify({
            success: true,
            exists: false,
            shopId: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          shopId: shopId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST: Create a new shop and assign user as Owner
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

    const session = await context.env.DB.prepare(
      "SELECT user_id, expires_at FROM session WHERE id = ?"
    )
      .bind(token)
      .first<SessionRow>();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: any = await context.request.json();
    const { shopName } = body;

    if (!shopName || !shopName.trim()) {
      return new Response(JSON.stringify({ error: "Shop name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert shop
    const shopResult = await context.env.DB.prepare(
      "INSERT INTO shop (name) VALUES (?)"
    )
      .bind(shopName.trim())
      .run();

    const shopId = shopResult.meta.last_row_id;
    if (!shopId) {
      throw new Error("Failed to create shop record.");
    }

    // Insert membership into shop_member as Owner
    await context.env.DB.prepare(
      'INSERT INTO shop_member (shop_id, user_id, role) VALUES (?, ?, ?)'
    )
      .bind(shopId, session.user_id, 'owner')
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        shopId: shopId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
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

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add functions/api/shop.ts
  git commit -m "feat: add POST method to /api/shop for shop creation and user mapping"
  ```

---

### Task 3: Cleanup endpoints, components, and hooks

**Files:**
- Modify: `src/pages/CreateShop.tsx`
- Delete: `functions/api/auth/create-shop.ts`
- Delete: `src/hooks/useCreateShopForm.ts`

**Interfaces:**
- Consumes: POST `/api/shop`
- Produces: Clean user state update and navigation in `CreateShop.tsx`

- [ ] **Step 1: Delete create-shop.ts endpoint**
  Delete [create-shop.ts](file:///home/tie/Projects/knpos/functions/api/auth/create-shop.ts).

  Run command:
  ```bash
  git rm functions/api/auth/create-shop.ts
  ```

- [ ] **Step 2: Delete useCreateShopForm.ts hook**
  Delete [useCreateShopForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateShopForm.ts).

  Run command:
  ```bash
  git rm src/hooks/useCreateShopForm.ts
  ```

- [ ] **Step 3: Modify CreateShop.tsx**
  Replace the contents of [CreateShop.tsx](file:///home/tie/Projects/knpos/src/pages/CreateShop.tsx) to use the new POST endpoint on `/api/shop` and directly extract the `shopId` from the POST response.

```typescript
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { CREATE_SHOP_DATA } from '../data/mockData';
import FormInput from '../components/FormInput';

export default function CreateShop() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateShopSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopName: shopName.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shop');
      }

      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('User not logged in');
      }

      useAuthStore.setState({
        user: {
          ...user,
          shopId: data.shopId,
          shopName: shopName.trim(),
          isOnboardingComplete: false,
        },
      });

      navigate('/get-started');
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <button
            onClick={() => navigate('/get-started')}
            className="mr-4 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-[#805062]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">
            Create Your Shop
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 pt-6 space-y-6 no-scrollbar">
          {/* Charni the Mascot */}
          <section className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <div className="absolute -top-3 -right-8 bg-white p-3 rounded-2xl rounded-bl-none border-2 border-outline-warm shadow-sm max-w-[160px] z-10">
                <p className="font-bold text-text-brown text-[13px] leading-snug">
                  {CREATE_SHOP_DATA.mascotSpeech}
                </p>
              </div>
              <img
                alt={CREATE_SHOP_DATA.mascotAlt}
                className="w-full h-full object-cover rounded-full border-4 border-pink-container shadow-sm"
                src={CREATE_SHOP_DATA.mascotUrl}
              />
            </div>
          </section>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleCreateShopSubmit}>
            <FormInput
              id="shopName"
              label={CREATE_SHOP_DATA.shopNameLabel}
              placeholder={CREATE_SHOP_DATA.shopNamePlaceholder}
              required
              value={shopName}
              onChange={setShopName}
            />

            <div className="space-y-2">
              <label
                className="text-[14px] leading-[20px] font-bold text-text-brown pl-4"
                htmlFor="description"
              >
                {CREATE_SHOP_DATA.descriptionLabel}
              </label>
              <textarea
                id="description"
                className="w-full p-5 bg-white border-2 border-outline-warm rounded-[20px] focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown custom-shadow resize-none"
                placeholder={CREATE_SHOP_DATA.descriptionPlaceholder}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>{CREATE_SHOP_DATA.createButtonText}</span>
                    <Sparkles className="w-5 h-5 text-text-brown" />
                  </>
                )}
              </button>
              <p className="text-center mt-4 text-[12px] leading-normal text-surface-variant-custom opacity-70 font-medium px-4">
                {CREATE_SHOP_DATA.termsText}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit changes**
  Run command:
  ```bash
  git add src/pages/CreateShop.tsx
  git commit -m "feat: complete shop endpoint consolidation and clean up unused files"
  ```
