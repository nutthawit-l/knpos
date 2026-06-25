# Design Specification: Header Title Navigation to Root

**Date**: 2026-06-25  
**Topic**: Navigate to root (`/`) when the user clicks the header title.

---

## 1. Goal & Context
The application is a mobile POS built as a PWA using React, TypeScript, and Tailwind CSS.
Currently, the `Header` component displays the page title, but it is static and not interactive.
The goal is to allow users to click or tap the Header's title text to navigate back to the root (`/`) page.

## 2. Requirements & UX
* **Navigation Target**: The title should navigate to `/`.
* **Visual Cues**: 
  * Change cursor to pointer (`cursor-pointer`).
  * Add a hover effect to dim the text opacity to `80%` (`hover:opacity-80`).
  * Add an active state effect to dim to `75%` (`active:opacity-75`).
  * Smooth transition for opacity change (`transition-opacity`).
  * No text decoration (`decoration-none`).
* **Accessibility**: Use semantic HTML by wrapping the title text in a React Router `<Link>` element, exposing it as an `<a>` anchor tag to screen readers.

## 3. Proposed Changes

### Component Update

#### [MODIFY] [Header.tsx](file:///home/tie/Projects/knpos/src/components/Header.tsx)
- Import `Link` from `react-router-dom`.
- Wrap the `<h1 className="font-bold text-[20px] text-[#805062] tracking-tight">{title}</h1>` block in `<Link to="/" ...>`.

## 4. Verification Plan

### Manual Verification
- Run the development server (`pnpm dev`).
- Open the application.
- Navigate to a nested view (e.g., `/settings` or `/products`).
- Click/hover on the Header title text.
- Verify:
  - The cursor changes to pointer on hover.
  - The title text opacity transitions smoothly.
  - Clicking it navigates to `/` (which redirects based on onboarding status).
