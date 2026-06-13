# Phase 3: Order Page Integration

## Overview
Connect the `Order` page to the `GET /api/products` endpoint to display real products from the D1 database and R2 bucket.

## 1. Data Fetching
- Remove static `products` array and `imgImage...` constants.
- Add React state `products` initialized as an empty array, and `isLoading` initialized as true.
- Add a `useEffect` hook to `fetch('/api/products')` on mount.

## 2. Default State & Currency Mapping
- Change the initial `selectedCurrency` state to find `THB` instead of `USD`.
- Create a `getPrice(product, currencyCode)` helper to map the `selectedCurrency.code` to the correct DB field (e.g. `THB` -> `product.tha_price`).

## 3. UI Updates
- While `isLoading` is true, display a simple loading state.
- Update the item rendering to use `product.image_url` instead of `product.image`.
- Update the total calculation to use the numeric `getPrice()` helper instead of string replacement.
- Format the displayed prices with `toFixed(2)` using the numeric price.
