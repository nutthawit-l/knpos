# Charni POS

Charni POS is a mobile-first Point of Sale (POS) application built using Progressive Web App (PWA) technology. It is designed specifically to render on mobile screens (smartphones) and provide a seamless, native-like user experience.

The application leverages a modern frontend stack with Cloudflare bindings for database and image storage.

---

## Technical Stack

- **Frontend Framework:** React + Vite (Fast HMR)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Shadcn UI patterns)
- **State Management:** Zustand
- **Backend/Platform:** Cloudflare Pages (Functions)
- **Database:** Cloudflare D1 (SQLite database)
- **Storage:** Cloudflare R2 (Object storage for product images)

---

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Migrations
Before running the application or seeding data, initialize your database schema.

- **Local Database Migration:**
  ```bash
  make migrate
  ```
- **Remote Database Migration:**
  ```bash
  make remote-migrate
  ```

### 3. Running in Development
To run the local development server and Wrangler pages dev in parallel:
```bash
make dev
```
*(If tmux is installed, this command will run them in split panes. Otherwise, it will manage a tmux session named `knpos-dev`.)*

Alternatively, run the default Vite development server:
```bash
pnpm dev
```

---

## Database Seeding

Seeding is used to populate your database with test data (products and events/transactions). The seeding script automatically handles downloading or generating product images and uploading them to Cloudflare R2.

### Prerequisites for Seeding
The seeding process expects **User ID 1** and **Shop ID 1** to already exist in the D1 database. 

1. Ensure the schema is migrated (see [Database Migrations](#2-database-migrations)).
2. Make sure a user with `id = 1` and a shop with `id = 1` are created in the database.
3. The seeding script will check for these records and fail if they are missing.

### Running the Seed

- **Seed Local Environment:**
  ```bash
  make seed
  ```

- **Seed Remote Environment:**
  ```bash
  make remote-seed
  ```

### Seeding Scripts Details
If you want to run specific seed scripts directly:
- **Seed Products Only:** `make seed-products` (add `make remote-seed-products` for remote database)
- **Seed Events Only:** `make seed-events` (add `make remote-seed-events` for remote database)
