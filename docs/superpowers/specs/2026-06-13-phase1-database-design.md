# Phase 1: Database & Storage Foundation

## Overview
Set up the Cloudflare D1 database and R2 storage for the KN POS application, including a serverless API for the frontend and a data seeding mechanism.

## 1. Database Schema
Table: `Product` in Cloudflare D1

*   `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
*   `name` (TEXT NOT NULL)
*   `tha_price` (REAL NOT NULL)
*   `sgp_price` (REAL)
*   `idn_price` (REAL)
*   `deu_price` (REAL)
*   `jpn_price` (REAL)
*   `chn_price` (REAL)
*   `twn_price` (REAL)
*   `kor_price` (REAL)
*   `image_url` (TEXT NOT NULL)
*   `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## 2. Cloudflare Infrastructure
*   **R2 Bucket:** Named `charnipos-images`. Public access will be enabled so the frontend can safely display the images via `image_url`.
*   **API (Cloudflare Pages Functions):** We will use Pages Functions to act as a backend.
    *   `functions/api/products.ts`
    *   **GET `/api/products`**: Queries the D1 database and returns all products.
    *   **POST `/api/products`**: Receives form data, uploads the image file to the `charnipos-images` R2 bucket, retrieves the public URL, and inserts the new product record into the D1 database.

## 3. Data Seeding Strategy
*   The user will manually prepare the images and provide a CSV file containing the product data, which will already include the final `image_url` for each row.
*   We will write a Node.js seed script (`scripts/seed.ts`) that parses this CSV and inserts the records directly into the D1 database.
