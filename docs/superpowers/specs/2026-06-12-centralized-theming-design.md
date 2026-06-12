# Design Specification: Centralized Theming

## Objective
Refactor the KN POS frontend to use a centralized Design System / Theming approach. Transition from hardcoded arbitrary hex values in Tailwind classes to semantic design tokens utilizing Tailwind CSS v4's native `@theme` directive.

## Architecture
- **Theme Definition**: All design tokens will be centralized in `src/index.css`.
- **Methodology**: Define CSS variables directly within the `@theme` directive.
- **Consumption**: Components will use standard Tailwind utility classes that reference the new semantic names (e.g., `text-primary` instead of `text-[#f47b20]`).

## Design Tokens
The following semantic tokens will be established in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-primary: #f47b20;
  --color-primary-light: #fef3e8;

  /* Surfaces & Backgrounds */
  --color-background: #ffffff;
  --color-surface: #f9fafb;

  /* Text & Foreground */
  --color-foreground: #1c1c1e;
  --color-foreground-muted: #374151;
  --color-foreground-subtle: #9ca3af;

  /* Borders & Dividers */
  --color-border: #f3f4f6;

  /* Semantic UI */
  --color-destructive: #ef4444;
}
```

## Refactoring Strategy
1. **Target Identification**: Locate all arbitrary hex values currently used in the `src/` directory (e.g., `[#f47b20]`, `[#fef3e8]`, `[#374151]`).
2. **Mapping Implementation**: Update the utility class prefixes to utilize the new semantic variables.
   - `text-[#f47b20]` ➔ `text-primary`
   - `bg-[#f47b20]` ➔ `bg-primary`
   - `bg-[#fef3e8]` ➔ `bg-primary-light`
   - `text-[#374151]` ➔ `text-foreground-muted`
   - `text-[#1c1c1e]` ➔ `text-foreground`
   - `text-[#9ca3af]` ➔ `text-foreground-subtle`
   - `border-[#f3f4f6]` ➔ `border-border`
   - `bg-[#f3f4f6]` ➔ `bg-border`
   - `text-[#ef4444]` ➔ `text-destructive`
   - `bg-gray-50` ➔ `bg-surface`
3. **Execution**: Perform updates component-by-component, starting with core layout structures (e.g., `Sidebar.tsx`, `App.tsx`) and proceeding through the page components. Render and verify identical UI state post-refactor.

## Scope Limits
- This spec covers the introduction of the centralized theme and the refactoring of existing hardcoded colors to use the new token system.
- It does not introduce new features or new UI elements outside of the theming context.
- Single-theme support only (no dark mode or multi-tenant themes in this phase).
