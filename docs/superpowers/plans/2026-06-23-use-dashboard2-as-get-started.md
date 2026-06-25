# Dashboard2 to GetStarted Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Dashboard2 page to GetStarted page, update its exports and typing, and configure the router in `App.tsx` to mount it directly under `/get-started`.

**Architecture:** Rename `Dashboard2.tsx` to `GetStarted.tsx` under `src/pages/` and update the component and props names. Modify `src/App.tsx` to import the new component, render it on path `/get-started`, and clean up references to the non-existent `GetStartedLayout`.

**Tech Stack:** React 19, TypeScript, React Router DOM v7.

## Global Constraints

- Framework: Vite + React
- Language: TypeScript
- Styling: Tailwind CSS
- Linting and Formatting: ESLint

---

### Task 1: Rename and Refactor `Dashboard2.tsx` to `GetStarted.tsx`

**Files:**
- Create/Rename: `src/pages/GetStarted.tsx` (renamed from `src/pages/Dashboard2.tsx`)

**Interfaces:**
- Consumes: `useAuthStore`, `useOrderStore`, and `DASHBOARD2_DATA` from `../data/mockData`
- Produces: `GetStarted` default export, `GetStartedProps` interface

- [ ] **Step 1: Rename the file**
  Rename `src/pages/Dashboard2.tsx` to `src/pages/GetStarted.tsx` using git.
  Run:
  ```bash
  git mv src/pages/Dashboard2.tsx src/pages/GetStarted.tsx
  ```

- [ ] **Step 2: Update the component export and interface names**
  Open `src/pages/GetStarted.tsx` and rename `Dashboard2Props` to `GetStartedProps`, and `Dashboard2` function to `GetStarted`.
  Specifically, edit the file to look like:
  ```typescript
  // ... imports ...

  export interface GetStartedProps {
    readonly onNavigate?: (tab: string) => void;
    readonly onMenuClick?: () => void;
  }

  export default function GetStarted({ onNavigate, onMenuClick }: GetStartedProps) {
    // ... rest of implementation unchanged ...
  }
  ```

- [ ] **Step 3: Commit the changes**
  Run:
  ```bash
  git add src/pages/GetStarted.tsx
  git commit -m "refactor: rename Dashboard2 to GetStarted page"
  ```

---

### Task 2: Configure Router in `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GetStarted` component from `./pages/GetStarted`

- [ ] **Step 1: Update imports and route mapping**
  Modify `src/App.tsx` to:
  1. Import `GetStarted` from `./pages/GetStarted`.
  2. Remove the commented-out or unused `GetStartedLayout` placeholder from the route.
  3. Mount `<GetStarted />` directly on the `/get-started` route.

  Target diff:
  ```diff
  import ProtectedRoute from "./components/ProtectedRoute";
  import Login from "./components/Login";
  +import GetStarted from "./pages/GetStarted";
  ```

  And:
  ```diff
  -      {
  -        element: <GetStartedLayout />,
  -        children: [{ path: "/get-started", element: <GetStarted /> }]
  -      }
  +      {
  +        path: "/get-started",
  +        element: <GetStarted />
  +      }
  ```

- [ ] **Step 2: Commit the routing changes**
  Run:
  ```bash
  git add src/App.tsx
  git commit -m "feat: configure router to mount GetStarted page"
  ```

---

### Task 3: Project Compilation and Lint Verification

**Files:**
- Verification only

- [ ] **Step 1: Check project compilation**
  Run:
  ```bash
  pnpm build
  ```
  Expected: Successful production build without TypeScript compiler errors.

- [ ] **Step 2: Check project linting**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: Successful lint check.
