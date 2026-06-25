# Design Spec: PWA App Layout (MainLayout Integration)

## Goals
1. Introduce a shared `MainLayout` wrapping dashboard and future POS pages (Order, Transactions, Inventory, Settings) with a single common layout template.
2. Centralize `<Header />` and `<BottomNavigation />` inside `MainLayout` so individual sub-pages do not duplicate the wrapper structures.
3. Automatically swap sub-page contents into a placeholder (`<Outlet />`).
4. Update page titles dynamically in the Header based on the current path, and map the active navigation tab.
5. Simplify the application by removing the unused `Sidebar` component.

## Selected Approach: Option 3 (Path Mapping Layout)
We will define a map of routes to layout properties (titles and active tabs) inside the layout itself. The layout will listen to the active location path to automatically render the correct Header title and active tab for `BottomNavigation`.

```typescript
const ROUTE_CONFIGS: Record<string, { title: string; tab: string }> = {
  '/dashboard': { title: 'Dashboard', tab: 'dashboard' },
  '/order': { title: 'New Order', tab: 'order' },
  '/transactions': { title: 'History', tab: 'transactions' },
  '/products': { title: 'Inventory', tab: 'products' },
  '/settings': { title: 'Settings', tab: 'settings' }
};
```

---

## Proposed Changes

### 1. [NEW] [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
Creates the common shell layout containing:
- Sticky `<Header />` displaying the mapped dynamic title and a static bell icon button.
- Scrollable content area containing the `<Outlet />`.
- `<BottomNavigation />` synced to the active path.

### 2. [MODIFY] [App.tsx](file:///home/tie/Projects/knpos/src/App.tsx)
Refactors the router to group `/dashboard`, `/order`, `/transactions`, `/products`, and `/settings` under `MainLayout`.
- Imports `MainLayout`.
- Replaces commented-out layout routes with the new nested routes.

### 3. [MODIFY] [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)
Simplifies the component by removing:
- Direct wrapping in `.bg-[#f9fafb]` and `.max-w-[400px]` containers.
- Direct rendering of `<Header />`.
- Direct rendering of `<BottomNavigation />`.
- Imports of `Header`, `BottomNavigation`, and unused icons.

### 4. [DELETE] [Sidebar.tsx](file:///home/tie/Projects/knpos/src/components/Sidebar.tsx)
Removes the sidebar component file completely as we are standardizing on bottom navigation and removing sidebar drawer functionality.

---

## Verification Plan

### Manual Verification
1. Run `pnpm dev` and verify that login and onboarding flows successfully redirect to `/dashboard`.
2. Verify `/dashboard` renders correctly under the new `MainLayout` layout container.
3. Check that the Header displays "Dashboard" and the bottom navigation has "Order", "History", "Inventory", and "Settings" buttons.
4. Try clicking the navigation items to confirm they correctly redirect to `/order`, `/transactions`, `/products`, `/settings` and that the layout updates the page title in the header accordingly.
