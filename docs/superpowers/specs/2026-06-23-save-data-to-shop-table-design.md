# Design Spec: Save Data to Shop Table and Consolidate CreateShop Form

This design document outlines the changes needed to consolidate the shop creation form logic directly within the `CreateShop.tsx` page component, integrate with the backend SQLite database via the `/api/auth/create-shop` and `/api/shop` API endpoints, handle onboarding completion states, and navigate back to `/get-started`.

## Requirements

1. **Inline Form State**: Convert the separate hook `useCreateShopForm` from a separate file directly into [CreateShop.tsx](file:///home/tie/Projects/knpos/src/pages/CreateShop.tsx).
2. **Remove Unused Hook File**: Delete [useCreateShopForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateShopForm.ts) since it will no longer be referenced.
3. **Keep Description Field in UI**: Omit sending the description to the shop table (as the SQLite `shop` table does not have a description column), but keep the `description` state and textarea element in the UI.
4. **Onboarding State Mismatch Resolution**: Keep `isOnboardingComplete` as `false` in the authentication store `useAuthStore` since onboarding is still ongoing.
5. **Set Shop ID & Navigate**: On successful creation of the shop, query `/api/shop?fields=id&limit=1` to obtain the new `shopId` of the user, update the user state in `useAuthStore`, and navigate back to `/get-started`.

## Proposed Changes

### 1. Frontend Page: [CreateShop.tsx](file:///home/tie/Projects/knpos/src/pages/CreateShop.tsx)
- Move states `shopName`, `description`, and `isLoading` inside the component.
- Implement `handleCreateShopSubmit` event handler:
  - Validate that `shopName` is not empty.
  - POST `{ shopName }` to `/api/auth/create-shop`.
  - On success, fetch `/api/shop?fields=id&limit=1` to get the user's `shopId`.
  - Update `useAuthStore` state with the retrieved `shopId`, setting `isOnboardingComplete` to `false`.
  - Navigate back to `/get-started`.
- Remove imports related to `useCreateShopForm`.

### 2. Frontend Store: [useAuthStore.ts](file:///home/tie/Projects/knpos/src/store/useAuthStore.ts)
- Change `isOnboardingComplete` calculation in `verifyUser` and `loginWithGoogleToken` to always set `isOnboardingComplete: false` for now.

### 3. Backend Function API: [shop.ts](file:///home/tie/Projects/knpos/functions/api/shop.ts)
- Update the `.first()` query execution for `/api/shop?fields=id&limit=1` to return a clean number `shopId` in the JSON response, instead of the raw database row object `{ shop_id: ... }`.

### 4. Hook Removal: [useCreateShopForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateShopForm.ts)
- Delete the file.

## Verification Plan

### Automated/Build Verification
- Run `pnpm build` to verify there are no TypeScript compilation errors.

### Manual Verification
- Create a new shop through the UI and verify:
  1. The form submission succeeds.
  2. The database stores the shop record.
  3. The page navigates back to `/get-started` rather than `/dashboard`.
  4. The "Create your shop" step in `/get-started` is now marked as complete/crossed out.
