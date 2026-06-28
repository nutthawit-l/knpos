# Design Spec: Rename History to Transaction in Header and Bottom Nav

We will rename references of "History" to "Transaction" in both the bottom navigation tab and the main layout header config for the transactions page. Additionally, we will make the transactions page header dynamically display the active event name when available.

## Proposed Changes

### 1. Main Layout Route Configuration
**File:** [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
- Change `/transactions` route configuration.
- Change `title` from static string `'History'` to a function that checks for `activeEventName`:
  ```typescript
  '/transactions': {
    title: (_, activeEventName) => activeEventName ? `Transaction of ${activeEventName}` : 'Transaction',
    tab: 'transactions',
  },
  ```

### 2. Bottom Navigation
**File:** [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)
- Change the navigation label under the `History` icon from "History" to "Transaction":
  ```tsx
  <span className="text-[12px] font-bold">Transaction</span>
  ```

## Verification Plan

### Manual Verification
1. Run `pnpm dev` to start the development server.
2. Verify that the bottom navigation label shows "Transaction" instead of "History".
3. Navigate to the `/transactions` page and check the header title:
   - If an active event is loaded (e.g. "Summer Sale"), the header should read "Transaction of Summer Sale".
   - If no active event is loaded, the header should read "Transaction".
