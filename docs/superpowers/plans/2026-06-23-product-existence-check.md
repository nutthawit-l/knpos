# Product Existence Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support checking if a shop has products using a fast existence check endpoint under `GET /api/product?shop_id=X&limit=1&fields=id` without querying `shop_member`.

**Architecture:** Modify `onRequestGet` in `functions/api/product.ts` to parse query parameters. If `shop_id`, `limit=1`, and `fields=id` are all provided, immediately run a fast `SELECT id FROM product WHERE shop_id = ? LIMIT 1` query and return `{ success: true, exists: boolean }`. Otherwise, fallback to the existing flow.

**Tech Stack:** Cloudflare Pages Functions (Wrangler/D1), TypeScript

## Global Constraints
- None

---

### Task 1: Update API Endpoint

**Files:**
- Modify: `functions/api/product.ts`

**Interfaces:**
- Consumes: `GET /api/product` request with optional parameters `shop_id`, `limit`, `fields`.
- Produces: JSON response `{ success: true, exists: boolean }` if parameters match, or existing list of products.

- [ ] **Step 1: Implement parameter parsing and existence check condition in `onRequestGet`**
  Modify `functions/api/product.ts` to add query parameter check right after the session verification checks (before the `shop_member` check):

```typescript
    // 1. Parse query parameters
    const url = new URL(context.request.url);
    const shopIdStr = url.searchParams.get("shop_id");
    const limit = url.searchParams.get("limit");
    const fields = url.searchParams.get("fields");

    // 2. Handle existence check directly if the 3 params are present (without shop_member lookup)
    if (shopIdStr && limit === "1" && fields === "id") {
      const targetShopId = parseInt(shopIdStr, 10);
      if (isNaN(targetShopId)) {
        return new Response(JSON.stringify({ success: true, exists: false }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const row = await context.env.DB.prepare(
        "SELECT id FROM product WHERE shop_id = ? LIMIT 1"
      )
        .bind(targetShopId)
        .first<{ id: number } | null>();

      return new Response(
        JSON.stringify({
          success: true,
          exists: row !== null,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
```

- [ ] **Step 2: Commit changes**
```bash
git add functions/api/product.ts
git commit -m "feat: add product existence check API support"
```

---

### Task 2: Verify Changes

**Files:**
- Test: manual tests using `curl`

- [ ] **Step 1: Run wrangler dev server**
  We need to verify the server handles both query patterns correctly. First, build and start wrangler:
  Command: `pnpm build && pnpm dev:wrangler`

- [ ] **Step 2: Verify existence check query**
  Send a GET request to the wrangler dev server (e.g. port 8788) with a session cookie (or valid token if cookies are checked).
  Wait, the existence check logic *requires* a valid `session_token` cookie. We need to pass a valid session cookie.
  We can retrieve a valid session token from the local DB:
  `npx wrangler d1 execute DB --local --command="SELECT id FROM session LIMIT 1"`
  Then query the API:
  `curl -H "Cookie: session_token=<token>" "http://localhost:8788/api/product?shop_id=1&limit=1&fields=id"`
  Verify it returns: `{"success":true,"exists":true}` (or `false` if no products exist for shop_id 1).

- [ ] **Step 3: Verify normal query**
  Verify that normal listing still returns the list:
  `curl -H "Cookie: session_token=<token>" "http://localhost:8788/api/product"`
  Verify it returns a JSON array.
