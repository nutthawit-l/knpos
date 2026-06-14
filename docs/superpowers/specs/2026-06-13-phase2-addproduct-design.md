# Phase 2: Product Management (AddProduct)

## Overview
Connect the frontend `AddProduct` UI to the backend API. This enables users to select an image, fill out pricing details, and upload the product to the Cloudflare R2 bucket and D1 database.

## 1. API Enhancement (`functions/api/products.ts`)
*   **Environment Variable:** Add an `R2_PUBLIC_URL` binding to `wrangler.toml` so the API knows the public base URL of the R2 bucket.
*   **POST Endpoint Logic:**
    *   Extract the `image` field from `FormData` as a `File` object.
    *   Generate a unique filename by prepending the current timestamp to the original filename (e.g., `Date.now() + '-' + file.name`).
    *   Upload the `File` stream to the `IMAGES_BUCKET` R2 binding.
    *   Construct the final `image_url` by combining `R2_PUBLIC_URL` and the generated filename.
    *   Insert the new product record into the D1 database and return a success response.

## 2. Frontend State & UI (`src/pages/AddProduct.tsx`)
*   **State Management:**
    *   `name` (string)
    *   `prices` (object mapping currency codes to string/number values)
    *   `imageFile` (File | null)
    *   `imagePreview` (string | null) for displaying the selected image.
    *   `isLoading` (boolean) to show a loading state during form submission.
*   **Image Upload Component:**
    *   Replace the static dashed box with a clickable/droppable area powered by a hidden `<input type="file" accept="image/*" />`.
    *   When a file is selected, update `imageFile` and use `URL.createObjectURL` to set `imagePreview`. Display the preview image instead of the upload icon.

## 3. Form Submission
*   **Trigger:** The checkmark button in the header triggers the `handleSave` function.
*   **Validation:** Ensure `name`, `prices.THB` (Thai Price), and `imageFile` are provided before proceeding.
*   **Request:**
    *   Construct a new `FormData` object.
    *   Append `name`, `image`, and all provided price fields.
    *   Execute a `fetch` request to `POST /api/products`.
*   **Success Handling:** On a successful 201 response, navigate the user back to the products list (`onNavigate?.('products')`).
