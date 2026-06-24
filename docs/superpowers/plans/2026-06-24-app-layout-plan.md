# PWA App Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the application to use a centralized `MainLayout` component containing a shared header and bottom navigation bar, and dynamically swap page contents into a placeholder (`<Outlet />`).

**Architecture:** Use React Router's nested routing structure in `App.tsx` to wrap main pages under `MainLayout`. Use route path mapping in `MainLayout` to dynamically display the active page title in the header and highlight the active navigation tab. Clean up page-level hardcoded layouts.

**Tech Stack:** React, React Router v7, Tailwind CSS, Lucide React

## Global Constraints
- Keep pull requests small and focused.
- Follow the Conventional Commits standard.
- Avoid writing project code files to tmp, in the .gemini dir, or directly to the Desktop.

---

### Task 1: Clean Up Unused Sidebar Component

Delete the unused sidebar navigation code as the app is transitioning to bottom-only navigation.

**Files:**
- Delete: `src/components/Sidebar.tsx`

- [ ] **Step 1: Delete Sidebar.tsx**
  Remove `src/components/Sidebar.tsx` using system tools or Git.
- [ ] **Step 2: Run build to verify clean deletion**
  Run: `pnpm build`
  Expected: Success without any import errors regarding Sidebar.
- [ ] **Step 3: Commit**
  ```bash
  git rm src/components/Sidebar.tsx
  git commit -m "chore: remove unused Sidebar component"
  ```

---

### Task 2: Create MainLayout Component

Create the common layout wrapper component containing the sticky Header and BottomNavigation.

**Files:**
- Create: `src/components/MainLayout.tsx`

**Interfaces:**
- Consumes: `<Header />` from `src/components/Header.tsx`, `<BottomNavigation />` from `src/components/BottomNavigation.tsx`
- Produces: `<MainLayout />` component for routing container

- [ ] **Step 1: Create MainLayout.tsx**
  Create `src/components/MainLayout.tsx` with the following implementation:
  ```tsx
  import { Outlet, useLocation, useNavigate } from 'react-router-dom';
  import Header from './Header';
  import BottomNavigation from './BottomNavigation';
  import { Bell } from 'lucide-react';

  // Static mapping of pathnames to layout configuration
  const ROUTE_CONFIGS: Record<string, { title: string; tab: string }> = {
    '/dashboard': { title: 'Dashboard', tab: 'dashboard' },
    '/order': { title: 'New Order', tab: 'order' },
    '/transactions': { title: 'History', tab: 'transactions' },
    '/products': { title: 'Inventory', tab: 'products' },
    '/settings': { title: 'Settings', tab: 'settings' }
  };

  export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    // Find config based on current pathname
    const config = ROUTE_CONFIGS[location.pathname] || { title: 'Boutique POS', tab: '' };

    const handleNavigate = (tab: string) => {
      navigate(`/${tab}`);
    };

    return (
      <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
        <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
          {/* Centralized Header with Dynamic Title and Bell Button */}
          <Header
            title={config.title}
            rightElement={
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
            }
          />

          {/* Sub-page Outlet */}
          <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6 no-scrollbar pt-4">
            <Outlet />
          </div>

          {/* Centralized Bottom Navigation */}
          <BottomNavigation activeTab={config.tab} onNavigate={handleNavigate} />
        </div>
      </div>
    );
  }
  ```
- [ ] **Step 2: Verify compilation**
  Run: `pnpm build`
  Expected: Success without any errors.
- [ ] **Step 3: Commit**
  ```bash
  git add src/components/MainLayout.tsx
  git commit -m "feat: create MainLayout component with path mapping"
  ```

---

### Task 3: Refactor App.tsx Routes

Register the sub-pages (`/dashboard`, `/order`, `/transactions`, `/products`, `/settings`) as child routes under `MainLayout`.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Modify App.tsx**
  Replace the contents of `src/App.tsx` to import the new layout and pages, then group them under `MainLayout`:
  ```tsx
  import { useEffect } from "react";
  import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
  import { useAuthStore } from "./store/useAuthStore";

  import ProtectedRoute from "./components/ProtectedRoute";
  import Login from "./components/Login";
  import GetStarted from "./pages/GetStarted";
  import CreateShop from "./pages/CreateShop";
  import AddFirstProduct from "./pages/AddFirstProduct";
  import AddProduct  from "./pages/AddProduct";
  import MainLayout from "./components/MainLayout";

  // Lazy or direct import of dashboard, orders, inventory, transactions, settings pages
  import Dashboard from "./pages/Dashboard";
  import Order from "./pages/Order";
  import Transactions from "./pages/Transactions";
  import Inventory from "./pages/Inventory";
  import Setting from "./pages/Setting";

  function RootRedirect() {
    const user = useAuthStore((state) => state.user);

    return user?.isOnboardingComplete
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/get-started" replace />
  }

  const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
      element: <ProtectedRoute />,
      children: [
        { path: "/", element: <RootRedirect /> },
        {
          element: <MainLayout />,
          children: [
            { path: "/dashboard", element: <Dashboard /> },
            { path: "/order", element: <Order /> },
            { path: "/transactions", element: <Transactions /> },
            { path: "/products", element: <Inventory /> },
            { path: "/settings", element: <Setting /> }
          ]
        },
        {
          path: "/get-started",
          element: <GetStarted />
        },
        {
          path: "/create-shop",
          element: <CreateShop />
        },
        {
          path: "/add-first-product",
          element: <AddFirstProduct />
        },
        {
          path: "/add-product",
          element: <AddProduct />
        }
      ]
    },
    {
      path: "*", element: <div style={{ padding: '2rem' }}>404 Not Found</div>
    }
  ]);

  function App() {
    const verifyUser = useAuthStore((state) => state.verifyUser);

    useEffect(() => {
      verifyUser();
    }, [verifyUser]);

    return <RouterProvider router={router} />;
  }

  export default App;
  ```
- [ ] **Step 2: Run build to verify type safety**
  Run: `pnpm build`
  Expected: Success without type mismatch or import path errors.
- [ ] **Step 3: Commit**
  ```bash
  git add src/App.tsx
  git commit -m "feat: register POS pages under MainLayout in router"
  ```

---

### Task 4: Refactor Dashboard.tsx

Simplify the Dashboard page by removing its inner header, bottom navigation, and duplicate scroll layout shell.

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Simplify Dashboard.tsx**
  Remove the duplicate wrapper container, the Header component, and the BottomNavigation component.
  Update the component to return only the inner fragments.
  Replace the whole contents of `src/pages/Dashboard.tsx` with:
  ```tsx
  // @ts-nocheck
  import { Store, Calendar, TrendingUp, PlusCircle } from 'lucide-react';
  import { useAuthStore } from '../store/useAuthStore';
  import { useOrderStore } from '../store/useOrderStore';
  import { DASHBOARD2_DATA } from '../data/mockData';

  export interface DashboardProp {
    readonly onNavigate?: (tab: string) => void;
  }

  export default function Dashboard({ onNavigate }: DashboardProp) {
    const { user } = useAuthStore();
    const { hasEvent } = useOrderStore();
    const hasShop = !!user?.shopId;

    return (
      <>
        {/* Shop Summary Section */}
        <section className="space-y-3">
          <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
            {DASHBOARD2_DATA.headerTitle}
          </h2>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Sales Card */}
            <div className="col-span-2 bg-[#f8bbd0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between min-h-[120px]">
              <div>
                <p className="text-[12px] font-medium text-[#76485a] opacity-80">
                  {DASHBOARD2_DATA.totalSalesLabel}
                </p>
                <h3 className="text-[28px] font-bold text-[#76485a] leading-none mt-1">
                  {DASHBOARD2_DATA.totalSalesValue}
                </h3>
              </div>
              <div className="mt-4 flex items-center text-[#76485a] font-bold text-[12px]">
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                <span>{DASHBOARD2_DATA.totalSalesTrend}</span>
              </div>
            </div>

            {/* Active Shops Card */}
            <div className="bg-[#b5e7fe] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
              <div>
                <Store className="w-5 h-5 text-[#37697d] mb-2" />
                <p className="text-[12px] font-medium text-[#37697d] opacity-80">
                  {DASHBOARD2_DATA.activeShopsLabel}
                </p>
              </div>
              <h3 className="text-[24px] font-bold text-[#37697d] leading-none mt-2">
                {DASHBOARD2_DATA.activeShopsValue}
              </h3>
            </div>

            {/* Events this Year Card */}
            <div className="bg-[#fddeb0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
              <div>
                <Calendar className="w-5 h-5 text-[#68522f] mb-2" />
                <p className="text-[12px] font-medium text-[#68522f] opacity-80">
                  {DASHBOARD2_DATA.eventsYearLabel}
                </p>
              </div>
              <h3 className="text-[24px] font-bold text-[#68522f] leading-none mt-2">
                {DASHBOARD2_DATA.eventsYearValue}
              </h3>
            </div>
          </div>
        </section>

        {/* Recent Events Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
              {DASHBOARD2_DATA.pastEventsLabel}
            </h2>
            <button
              onClick={() => alert('Viewing all events will be supported in the next update! 🐾')}
              className="text-[#805062] font-bold text-[12px] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {DASHBOARD2_DATA.viewAllLabel}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DASHBOARD2_DATA.events.map((event) => {
              const isProfit = event.badgeType === 'profit';
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] border border-[#E0D0CC]/30 group hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-[#fff8f8]">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={event.title}
                      src={event.imageUrl}
                    />
                    <div
                      className={`absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                        isProfit
                          ? 'bg-[#f8bbd0]/90 text-[#76485a]'
                          : 'bg-[#b5e7fe]/90 text-[#37697d]'
                      }`}
                    >
                      {event.badge}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-[18px] font-bold text-text-brown leading-tight">
                        {event.title}
                      </h4>
                      <p className="text-[12px] text-text-brown/70 mt-0.5">
                        {event.date}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-[#E0D0CC]/20">
                      <div>
                        <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                          {event.totalSalesLabel}
                        </p>
                        <p className="font-bold text-text-brown text-[16px]">
                          {event.totalSalesValue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                          {event.netProfitLabel}
                        </p>
                        <p
                          className={`font-bold text-[16px] ${
                            isProfit ? 'text-[#805062]' : 'text-[#326578]'
                          }`}
                        >
                          {event.netProfitValue}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Create New Event Button */}
        <section className="pt-2">
          <button
            onClick={() => onNavigate?.('create-event')}
            className="w-full bg-[#fcf1f2] border-2 border-dashed border-[#805062]/30 py-8 px-6 rounded-[20px] group hover:bg-[#ffd9e4]/20 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#f8bbd0] flex items-center justify-center text-[#805062] group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-[#805062] text-[20px]">
              {DASHBOARD2_DATA.createEventTitle}
            </h3>
            <p className="text-text-brown/80 text-[13px] text-center max-w-[280px]">
              {DASHBOARD2_DATA.createEventSubtitle}
            </p>
          </button>
        </section>
      </>
    );
  }
  ```
- [ ] **Step 2: Verify compilation and linting**
  Run: `pnpm build && pnpm lint`
  Expected: Success.
- [ ] **Step 3: Commit**
  ```bash
  git add src/pages/Dashboard.tsx
  git commit -m "refactor: simplify Dashboard by removing hardcoded layout shell"
  ```

---

### Task 5: Refactor Other Pages (Order, Transactions, Inventory, Setting)

Clean up internal wrapper shells from remaining pages to allow seamless rendering in `MainLayout`.

**Files:**
- Modify: `src/pages/Order.tsx`
- Modify: `src/pages/Transactions.tsx`
- Modify: `src/pages/Inventory.tsx`
- Modify: `src/pages/Setting.tsx`

- [ ] **Step 1: Simplify Order.tsx**
  Remove the wrapper `<div className="bg-[#f9fafb] ...">` and the duplicate inner Header/BottomNavigation.
  Specifically, change the return statement in `Order.tsx` to return the fragment `<>...</>` containing only the search bar, products grid, payment modal, and docked summary bar. Remove the inline `<header>` element from lines 173-184.
- [ ] **Step 2: Simplify Transactions.tsx**
  Remove the wrapper `<div className="bg-[#f9fafb] ...">` and the duplicate inner Header/BottomNavigation.
- [ ] **Step 3: Simplify Inventory.tsx**
  Remove the wrapper `<div className="bg-[#f9fafb] ...">` and the duplicate inner Header/BottomNavigation.
- [ ] **Step 4: Simplify Setting.tsx**
  Remove the wrapper `<div className="bg-[#f9fafb] ...">` and the duplicate inner Header/BottomNavigation.
- [ ] **Step 5: Verify build & lint**
  Run: `pnpm build && pnpm lint`
  Expected: Success without type mismatch or layout errors.
- [ ] **Step 6: Commit**
  ```bash
  git add src/pages/Order.tsx src/pages/Transactions.tsx src/pages/Inventory.tsx src/pages/Setting.tsx
  git commit -m "refactor: simplify remaining POS pages by removing layout wrappers"
  ```
