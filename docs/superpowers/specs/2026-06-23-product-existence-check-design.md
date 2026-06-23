# Design Specification: Product Existence Check API

Support checking whether a shop has any products without performing a full product query or `shop_member` lookup.

## Context & Requirements
In [GetStarted.tsx](file:///home/tie/Projects/knpos/src/pages/GetStarted.tsx), the application checks if a shop already has products configured by fetching:
`fetch(`/api/product?shop_id=${shopId}&limit=1&fields=id`)`

It expects a response format of:
```json
{
  "success": true,
  "exists": true
}
```

The current GET handler in [product.ts](file:///home/tie/Projects/knpos/functions/api/product.ts) is designed to return the full product list for the authenticated user's shop membership, returning a JSON array of products rather than `{ success, exists }`. We need to support this lightweight check.

## Proposed Changes

### [product.ts](file:///home/tie/Projects/knpos/functions/api/product.ts)
- Parse `shop_id`, `limit`, and `fields` from request query params.
- If all three parameters (`shop_id`, `limit=1`, `fields=id`) are present:
  - Directly query the database: `SELECT id FROM product WHERE shop_id = ? LIMIT 1`.
  - Return `{ success: true, exists: row !== null }`.
  - Do not perform the `shop_member` lookup for the authenticated user, saving a database query and simplifying the authorization check.
- Otherwise, fall back to the existing products listing logic.

## Verification
- Test GET `/api/product?shop_id=<shopId>&limit=1&fields=id` to verify it returns `{ success: true, exists: <boolean> }`.
- Test normal GET `/api/product` to ensure it still returns the full product list array.
