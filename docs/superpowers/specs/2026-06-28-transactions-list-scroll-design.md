# Transactions List Scroll Design

**Date:** 2026-06-28
**Topic:** Scroll only in {/* List */} section on Transactions page

## Goal

Configure the Transactions page (`src/pages/Transactions.tsx`) so that only the transaction list/items section scrolls vertically, while the Hero Section and Tab Buttons remain fixed at the top of the viewport.

## Design

### 1. Main Layout Configuration
- **File:** [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
- **Change:** Set `disableLayoutScroll: true` for the `/transactions` route in `ROUTE_CONFIGS`.
- **Reason:** Disables scrolling on the parent outlet wrapper, forcing the Transactions page to fill the screen height and manage its own scroll behavior.

### 2. Page Component Structure
- **File:** [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
- **Changes:**
  - Make the root wrapper `div` fill the layout height and lay out children vertically using Flexbox: `flex flex-col min-h-0 h-full space-y-5`.
  - Mark the **Hero Section** (Total Performance) with `shrink-0` to maintain its height.
  - Convert the **Main Content List / Tabs** wrapper `<section>` into a flex container: `flex-1 flex flex-col min-h-0 space-y-4`.
  - Mark the **Tab Buttons** container with `shrink-0` so it stays fixed.
  - Add scroll capabilities to the `{/* List */}` container: `flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-3 pb-6`.
  - Move the **Aesthetic Footer Mascot sticker** ("CHARNI") inside the `{/* List */}` container as the final child, so it scrolls along with the transaction items.

## Verification Plan

### Manual Verification
1. Run the application locally with `pnpm dev`.
2. Navigate to the **Transaction** tab.
3. Verify that:
   - The total sales Hero Section and the tabs (Top 5, All Items, Order by Order) do not scroll.
   - The transaction list items can be scrolled vertically.
   - The mascot footer is visible at the very end of the list when scrolled to the bottom.
