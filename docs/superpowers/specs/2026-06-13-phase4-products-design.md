# Phase 4: Product Page Integration

## Overview
Connect the `Products` page (`src/pages/Products.tsx`) to the `GET /api/products` endpoint to display real products from the D1 database.

## 1. Data Fetching
- Remove the static `products` array and Figma image URL constants.
- Add React state `products` initialized as an empty array, and `isLoading` initialized as true.
- Add a `useEffect` hook to fetch data from `/api/products` on component mount.

## 2. Currency Mapping & Formatting
- Change the initial `selectedCurrency` state from `USD` to `THB`.
- Reuse the `getPrice(product, currencyCode)` helper logic to pull the correct database column for the selected currency.
- Format the database numeric `id` to a string like `PRD-001` using `String(product.id).padStart(3, '0')`.

## 3. UI Updates
- Show a simple loading state (`"Loading products..."`) while data is being fetched.
- Update the mapping loop to render `product.image_url` for the image source.
- Update the price rendering to display the dynamically fetched price.
