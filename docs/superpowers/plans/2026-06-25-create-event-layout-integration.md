# Integrate CreateEvent and AddProduct with MainLayout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the `/create-event` and `/add-product` pages into `MainLayout` using dynamic layout controls in `ROUTE_CONFIGS`, resolving layout duplication and fixing navigation bugs.

**Architecture:** We will extend `ROUTE_CONFIGS` in `MainLayout.tsx` to handle sub-page behaviors (toggling back buttons, titles, and bottom navigation visibility). The sub-page components (`CreateEvent.tsx` and `AddProduct.tsx`) will be stripped of their local custom wrappers and headers, rendering as simple nested components.

**Tech Stack:** React, React Router v7, Zustand, Tailwind CSS.

## Global Constraints
- Do not introduce external styling libraries; use existing Tailwind classes.
- Ensure the project builds successfully (`pnpm build`) and passes lint checks (`pnpm lint`) at the end of each task.

---

### Task 1: MainLayout route metadata and dynamic layout controls

**Files:**
- Modify: `src/components/MainLayout.tsx`

**Interfaces:**
- Consumes: Standard React Router hooks (`useLocation`, `useNavigate`).
- Produces: Enhanced `MainLayout` component that dynamically adjusts structure for nested routes.

- [ ] **Step 1: Update ROUTE_CONFIGS interface and values**
  Modify [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx) to define the `RouteConfig` interface and add settings for `/create-event` and `/add-product`.
  
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

- [ ] **Step 2: Update MainLayout render method**
  Update the rendering logic in [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx) to support dynamic titles, back arrow handlers, conditional bottom navigation, and layout padding.
  
  ```tsx
  export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const config = ROUTE_CONFIGS[location.pathname] || { title: 'Boutique POS', tab: '' };
    
    const resolvedTitle = typeof config.title === 'function' 
      ? config.title(location.state) 
      : config.title;

    const handleNavigate = (tab: string) => {
      navigate(`/${tab}`);
    };

    const handleBack = () => {
      if (config.showBackButton && config.backTo) {
        const destination = typeof config.backTo === 'function'
          ? config.backTo(location.state)
          : config.backTo;
        navigate(destination);
      }
    };

    return (
      <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
        <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
          <Header
            title={resolvedTitle}
            onBackClick={config.showBackButton ? handleBack : undefined}
            rightElement={
              !config.showBackButton && (
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
                  <Bell className="w-5 h-5" />
                </button>
              )
            }
          />

          <div className={`flex-1 overflow-y-auto px-5 space-y-6 no-scrollbar pt-4 ${
            config.hideBottomNav ? 'pb-8' : 'pb-24'
          }`}>
            <Outlet />
          </div>

          {!config.hideBottomNav && (
            <BottomNavigation activeTab={config.tab} onNavigate={handleNavigate} />
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Run build and lint checks**
  Run: `pnpm build && pnpm lint`
  Expected: Success without errors.

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/components/MainLayout.tsx
  git commit -m "feat: configure dynamic routing layout flags in MainLayout"
  ```

---

### Task 2: CreateEvent cleanup & hook redirect update

**Files:**
- Modify: `src/pages/CreateEvent.tsx`
- Modify: `src/hooks/useCreateEventForm.ts`

**Interfaces:**
- Consumes: Route config from Task 1.
- Produces: Cleaner `CreateEvent` component conforming to inner outlet boundaries.

- [ ] **Step 1: Simplify CreateEvent layout container**
  Remove duplicate device wrappers and headers in [CreateEvent.tsx](file:///home/tie/Projects/knpos/src/pages/CreateEvent.tsx).
  
  ```tsx
  return (
    <form
      className="space-y-6 pb-6"
      onSubmit={handleCreateEventSubmit}
    >
      {/* Mascot Banner */}
      <section className="relative bg-brand-blue/30 rounded-[24px] p-5 flex items-center overflow-hidden border border-brand-blue/20">
        ...
      </section>
      ...
    </form>
  );
  ```

- [ ] **Step 2: Update redirect logic in useCreateEventForm.ts**
  Change the routing redirect to point directly to `/order` on success in [useCreateEventForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateEventForm.ts).
  
  ```typescript
  // Navigate to order page after success feedback animation
  setTimeout(() => {
    navigate('/order');
  }, 1000);
  ```

- [ ] **Step 3: Run build and lint checks**
  Run: `pnpm build && pnpm lint`
  Expected: Success without errors.

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/pages/CreateEvent.tsx src/hooks/useCreateEventForm.ts
  git commit -m "refactor: integrate CreateEvent layout and direct navigation redirect"
  ```

---

### Task 3: AddProduct cleanup

**Files:**
- Modify: `src/pages/AddProduct.tsx`

**Interfaces:**
- Consumes: Dynamic route parameters and state from React Router.
- Produces: Standalone sub-page layout for `AddProduct`.

- [ ] **Step 1: Strip duplicate wrappers, header, and bottom nav**
  Modify [AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx) to remove outer mockups, the custom header, and the duplicate bottom navigation.
  
  ```tsx
  return (
    <div className="space-y-6 pb-6">
      {/* Image Upload Area */}
      <section
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        ...
      </section>
      ...
    </div>
  );
  ```

- [ ] **Step 2: Run build and lint checks**
  Run: `pnpm build && pnpm lint`
  Expected: Success without errors.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/pages/AddProduct.tsx
  git commit -m "refactor: strip duplicate layouts from AddProduct page"
  ```

---

### Task 4: Navigation fixes (Dashboard and Inventory)

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Inventory.tsx`

**Interfaces:**
- Consumes: `/create-event` and `/add-product` routes.
- Produces: Correct click handlers and state-based navigation calls.

- [ ] **Step 1: Fix infinite render bug in Dashboard.tsx**
  Wrap navigate call in an arrow function in [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx).
  
  ```tsx
  onClick={() => navigate('/create-event')}
  ```

- [ ] **Step 2: Integrate React Router navigation in Inventory.tsx**
  Import `useNavigate` and replace legacy `onNavigate` and `onEditProduct` callbacks with standard `navigate` calls in [Inventory.tsx](file:///home/tie/Projects/knpos/src/pages/Inventory.tsx).
  
  ```typescript
  import { useNavigate } from 'react-router-dom';
  // ...
  const navigate = useNavigate();
  // ...
  // Edit product
  onClick={() => navigate('/add-product', { state: { productToEdit: product } })}
  // ...
  // FAB Add product
  onClick={() => navigate('/add-product')}
  ```

- [ ] **Step 3: Run build and lint checks**
  Run: `pnpm build && pnpm lint`
  Expected: Success without errors.

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/pages/Dashboard.tsx src/pages/Inventory.tsx
  git commit -m "fix: resolve navigation handler bugs in Dashboard and Inventory"
  ```

---

## Verification Plan

### Manual Verification
1. Run `pnpm dev` to start the local server.
2. Click "Create Event" on Dashboard -> verify single header "Create Event", no bottom navigation, clean scrollable form, and successful redirect to Order.
3. Click "+" FAB on Inventory -> verify header "Add Product", no bottom navigation. Fill and submit or click Back.
4. Click a product item on Inventory -> verify header "Edit Product", no bottom navigation. Check if fields pre-populate.
5. Verify Back Button in header returns to the designated location (Dashboard for Add Product, Inventory for Edit Product, Dashboard for Create Event).
