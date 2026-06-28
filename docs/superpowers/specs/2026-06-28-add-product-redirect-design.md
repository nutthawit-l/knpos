# Redirect Behavior for AddProduct

Change the redirect behavior of `SAVE PRODUCT` in the `AddProduct` page to redirect directly to `/products` instead of dynamically choosing between `/products` and `/dashboard`.

## Proposed Changes

### AddProduct Page

Modify [AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx):
- Remove the unused `handleBack` function.
- Change the save success redirect to `navigate('/products')` directly.

`AddFirstProduct.tsx` remains unchanged per user instructions.
