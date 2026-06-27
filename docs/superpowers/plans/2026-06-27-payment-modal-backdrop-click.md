# PaymentModal Backdrop Click Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to click on the PaymentModal backdrop to go back to the state before committing the order to edit and recommit.

**Architecture:** Modify the outer overlay `div` of `PaymentModal` to register an `onClick` event handler triggering `onEdit`. Add event propagation prevention (`e.stopPropagation()`) on the inner modal dialog so clicks inside the modal card don't close it. Guard this action against active loading states (`isLoading` is true).

**Tech Stack:** React, TypeScript, Tailwind CSS

## Global Constraints

- Avoid external network requests during execution.
- Maintain existing codebase styling patterns (Tailwind CSS, TypeScript, custom colors).
- Ensure modal dismiss/close does not function while `isLoading` is true (e.g. during payment API request).

---

### Task 1: Update PaymentModal to support backdrop click

**Files:**
- Modify: `src/components/PaymentModal.tsx`

**Interfaces:**
- Consumes: `onEdit` callback prop from parent `Order.tsx` component.
- Produces: Updated `PaymentModal` component with interactive backdrop click.

- [ ] **Step 1: Locate the return statement of PaymentModal**
  Check `src/components/PaymentModal.tsx` around lines 36-39.

- [ ] **Step 2: Add onClick to the backdrop container**
  Update the outer container `div` to handle `onClick` conditional on `isLoading`:
  ```tsx
  <div 
    onClick={isLoading ? undefined : onEdit}
    className="absolute inset-0 bg-text-brown/40 backdrop-blur-xs flex items-end justify-center z-50 rounded-[24px] cursor-pointer"
  >
  ```

- [ ] **Step 3: Add click handler with stopPropagation to the modal dialog**
  Update the inner container `div` to stop click event propagation and reset the cursor:
  ```tsx
  <div 
    onClick={(e) => e.stopPropagation()}
    className="relative w-full rounded-t-[24px] shadow-2xl overflow-visible max-h-[85%] flex flex-col border-t border-outline-warm/30 font-quicksand bg-pattern cursor-default"
  >
  ```

- [ ] **Step 4: Verify syntax and formatting**
  Verify that the TSX syntax is correct and formatting is consistent.

- [ ] **Step 5: Commit changes**
  ```bash
  git add src/components/PaymentModal.tsx
  git commit -m "feat(order): allow closing payment modal on backdrop click"
  ```
