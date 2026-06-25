# Design Specification: Use Dashboard2 as GetStarted Component

## Objective
Refactor the onboarding flow of KN POS by renaming `Dashboard2.tsx` to `GetStarted.tsx` and updating `App.tsx` routing to render `<GetStarted />` directly under the `/get-started` route, resolving current compilation errors in `App.tsx`.

## Proposed Changes

### 1. File Renaming
- **Source**: `src/pages/Dashboard2.tsx`
- **Destination**: `src/pages/GetStarted.tsx`

### 2. Component Refactoring in `src/pages/GetStarted.tsx`
- Update component name from `Dashboard2` to `GetStarted`.
- Update props interface name from `Dashboard2Props` to `GetStartedProps`.
- Ensure typescript-nocheck or typed properties remain intact.

### 3. Route Configuration in `src/App.tsx`
- Remove the layout-children structure for `/get-started` since no `GetStartedLayout` exists.
- Configure path `/get-started` to render `<GetStarted />` directly.
- Import `GetStarted` from `./pages/GetStarted`.
- Remove references to non-existent layout components: `GetStartedLayout`.
- Keep `/dashboard` commented out per requirements.

## Verification Plan

### Automated Build & Compile
- Run `pnpm build` or `pnpm dev` to verify the codebase compiles successfully.
- Verify ESLint passes with `pnpm lint`.

### Manual Verification
- Access `/get-started` in dev server and ensure the Dashboard2 (now GetStarted) mock UI loads correctly.
