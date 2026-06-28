# Rename History to Transaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename references to "History" in the bottom navigation and top header to "Transaction" (with dynamic active event name support in the header).

**Architecture:** Update static and dynamic display strings mapped to the `/transactions` route in the router configuration and the navigation component.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS

## Global Constraints

- Header text for `/transactions` must be dynamic: "Transaction of {EventName}" if activeEventName is available, and fall back to "Transaction" otherwise.
- Bottom navigation tab label must be renamed from "History" to "Transaction".
- Code must pass ESLint and TypeScript compilation.

---

### Task 1: Update MainLayout Header Title Config

**Files:**
- Modify: [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)

**Interfaces:**
- Consumes: `ROUTE_CONFIGS` and `activeEventName` state from the Zustand store.
- Produces: Updated title mapping for `/transactions` path.

- [ ] **Step 1: Modify `/transactions` configuration in ROUTE_CONFIGS**

  Replace the line:
  ```typescript
    '/transactions': { title: 'History', tab: 'transactions' },
  ```
  with:
  ```typescript
    '/transactions': {
      title: (_, activeEventName) => activeEventName ? `Transaction of ${activeEventName}` : 'Transaction',
      tab: 'transactions',
    },
  ```

- [ ] **Step 2: Run TypeScript build to verify types and compilation**

  Run: `pnpm build`
  Expected: No TypeScript or Vite build compilation errors.

- [ ] **Step 3: Commit changes**

  ```bash
  git add src/components/MainLayout.tsx
  git commit -m "feat(layout): dynamically display Transaction of EventName in header"
  ```

---

### Task 2: Update Bottom Navigation Tab Label

**Files:**
- Modify: [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx)

**Interfaces:**
- Consumes: HTML template for bottom navigation buttons.
- Produces: "Transaction" tab label in the UI.

- [ ] **Step 1: Modify the bottom navigation button text**

  In [BottomNavigation.tsx](file:///home/tie/Projects/knpos/src/components/BottomNavigation.tsx) around line 60, locate the tab label:
  ```tsx
          <span className="text-[12px] font-bold">History</span>
  ```
  And replace it with:
  ```tsx
          <span className="text-[12px] font-bold">Transaction</span>
  ```

- [ ] **Step 2: Run linter and compiler checks**

  Run: `pnpm lint` and `pnpm build`
  Expected: Both commands complete successfully without errors.

- [ ] **Step 3: Commit changes**

  ```bash
  git add src/components/BottomNavigation.tsx
  git commit -m "feat(navigation): rename History tab to Transaction"
  ```
