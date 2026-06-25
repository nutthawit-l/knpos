# Header Title Navigation to Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the Header component's title text in a React Router Link to navigate to the root route (`/`) and style it with subtle hover/active effects.

**Architecture:** We will import the `Link` component from `react-router-dom` and wrap the title `<h1>` inside `Header.tsx` with it, styling it using Tailwind CSS transitions and hover states.

**Tech Stack:** React, React Router v7 (`react-router-dom`), Tailwind CSS, TypeScript.

## User Review Required

> [!NOTE]
> The change imports `Link` from `react-router-dom` inside `Header.tsx`. This is safe since all Header usages are currently rendered within a RouterProvider context.

## Open Questions

None.

## Proposed Changes

### Component Update

#### [MODIFY] [Header.tsx](file:///home/tie/Projects/knpos/src/components/Header.tsx)

- Import `Link` from `react-router-dom`.
- Wrap the `<h1 className="font-bold text-[20px] text-[#805062] tracking-tight">{title}</h1>` block in `<Link to="/" ...>`.

---

### Task 1: Wrap Header Title in Link and Style

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `react-router-dom` module
- Produces: Clickable Header title element navigating to `/`

- [ ] **Step 1: Modify imports in Header.tsx**

  Add the `Link` import from `react-router-dom` to `src/components/Header.tsx`.
  
  ```tsx
  import React from 'react';
  import { Menu, ChevronLeft, FileDown, Plus } from 'lucide-react';
  import { Link } from 'react-router-dom';
  ```

- [ ] **Step 2: Wrap title rendering in Link**

  Replace the line rendering the `h1` title:
  ```tsx
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">{title}</h1>
  ```
  With:
  ```tsx
          <Link
            to="/"
            className="hover:opacity-80 active:opacity-75 transition-opacity cursor-pointer decoration-none"
          >
            <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">{title}</h1>
          </Link>
  ```

- [ ] **Step 3: Run TypeScript compiler and production build check**

  Verify that the application compiles without any TypeScript or Vite compilation errors.
  Run: `pnpm build`
  Expected output: Build completes successfully with zero errors.

- [ ] **Step 4: Commit the changes**

  Commit the code changes to the git repository.
  
  ```bash
  git add src/components/Header.tsx
  git commit -m "feat: make header title navigate to root on click"
  ```
