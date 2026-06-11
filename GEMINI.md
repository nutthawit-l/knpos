# KN POS Project Context

KN POS is a mobile Point of Sale (POS) application built using Progressive Web App (PWA) technology. It is written using modern web technologies but is designed to render on mobile phones and look and feel like a native application, Not yet Tablet and PC supports.

## Project Overview

- **Purpose:** Provide a seamless mobile POS experience using web technologies functioning as a native-like PWA.
- **Main Technologies:**
  - **Framework/Bundler:** Vite + React
  - **Language:** TypeScript
  - **Styling:** Tailwind CSS
  - **State Management:** Zustand
  - _(Note: All software uses the latest versions)_
- **Architecture:** Single standard Vite project structure (e.g., `src/components`, `src/pages`).

## Building and Running

- **Install Dependencies:** `pnpm install`
- **Run in Development:** `pnpm dev`
- **Build for Production:** `pnpm build`

## Testing and Quality

- **Testing:** There are currently no unit tests or end-to-end (E2E) tests.
- **Code Quality:** ESLint and Prettier are used for linting and formatting the codebase.

## Development Conventions

- **Pull Requests:** Always keep pull requests small and focused.
- **Commit Messages:** Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard.
- **Components:** All components must adhere to Tailwind CSS and Shadcn UI patterns.
