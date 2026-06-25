# Spec: Integrate CreateEvent and AddProduct with MainLayout

**Date**: 2026-06-25
**Topic**: Integrating `/create-event` and `/add-product` routes with `MainLayout` using standard React Router configuration.

---

## 1. Goal & Context
The `/create-event` and `/add-product` pages currently render duplicate layout wrappers, including their own custom mobile device outlines (`max-w-[400px]`, `h-dvh`), headers, and back navigation. When rendered inside `MainLayout`'s outlet, this results in double-wrapped interfaces and visual glitches.

This specification outlines the dynamic integration of these sub-pages into `MainLayout`.

---

## 2. MainLayout Configuration Enhancements

### 2.1 Extended Routing Configuration
We will extend `ROUTE_CONFIGS` in `src/components/MainLayout.tsx` to support layout flags for sub-pages:

```typescript
interface RouteConfig {
  title: string | ((state: any) => string);
  tab: string;
  hideBottomNav?: boolean;
  showBackButton?: boolean;
  backTo?: string | ((state: any) => string);
}

const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/dashboard': { title: 'Dashboard', tab: 'dashboard' },
  '/order': { title: 'New Order', tab: 'order' },
  '/transactions': { title: 'History', tab: 'transactions' },
  '/products': { title: 'Inventory', tab: 'products' },
  '/settings': { title: 'Settings', tab: 'settings' },
  '/create-event': {
    title: 'Create Event',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: '/dashboard',
  },
  '/add-product': {
    title: (state: any) => state?.productToEdit ? 'Edit Product' : 'Add Product',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: (state: any) => state?.productToEdit ? '/products' : '/dashboard',
  },
};
```

### 2.2 Layout Controls & Layout Rendering
`MainLayout.tsx` will read these settings for the current route:
- **Title**: Dynamically resolve standard string titles or dynamic titles (e.g. "Edit Product" vs "Add Product" based on location state).
- **Back Button**: If `showBackButton` is set, render the left chevron arrow back button in `Header` and wire up a back navigation handler to `backTo`.
- **Bottom Navigation**: If `hideBottomNav` is true, do not render `BottomNavigation` and change the bottom padding of the content viewport from `pb-24` to `pb-8` to utilize the full available height.

---

## 3. Sub-page Layout Cleanups

### 3.1 CreateEvent (`src/pages/CreateEvent.tsx`)
- Remove outer container wrappers (`h-dvh`, `max-w-[400px]`, `bg-[#f9fafb]`).
- Remove the local custom `<header>` elements.
- Strip outer flex layout classes and scrollable `overflow-y-auto` from the `<form>` element, leaving a clean, simple styling layout (`space-y-6 pb-6`) that flows inside the `MainLayout` viewport.

### 3.2 AddProduct (`src/pages/AddProduct.tsx`)
- Remove duplicate wrappers, headers, and footer bottom navigations.
- Convert the component to a simple flow-based layout container (`space-y-6 pb-6`) that renders directly inside `MainLayout`.

---

## 4. Navigation & Bug Fixes

### 4.1 Dashboard Event Navigation (`src/pages/Dashboard.tsx`)
- Wrap the navigate action in an arrow function to prevent infinite re-renders:
  `onClick={() => navigate('/create-event')}`

### 4.2 Inventory Subpage Navigation (`src/pages/Inventory.tsx`)
- Import `useNavigate` from `react-router-dom` to trigger sub-page routing.
- FAB Add Product button calls `navigate('/add-product')`.
- Clicking a product card calls `navigate('/add-product', { state: { productToEdit: product } })`.

### 4.3 Create Event Form Callback (`src/hooks/useCreateEventForm.ts`)
- Replace legacy navigate configuration (`navigate('/dashboard', { state: { activeTab: 'order' } })`) with `navigate('/order')`.

---

## 5. Verification Plan

### Manual Verification
1. Open the application in development mode (`npm run dev`).
2. Navigate to Dashboard. Click "Create Event" to verify that the Create Event page is integrated cleanly without dual headers or containers.
3. Submit the event form, verify redirection to the "New Order" page.
4. Navigate to Inventory, select a product to edit, verify that the header updates to "Edit Product" and bottom navigation is hidden.
5. Click back on the edit product and create event pages, verify that navigation routes back to their correct locations (`/products` and `/dashboard` respectively).
