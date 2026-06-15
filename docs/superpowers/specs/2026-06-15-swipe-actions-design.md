# Spec: Native-like Swipe Actions for Products

## 1. Overview & Context
KN POS is a mobile-first Point of Sale (POS) Progressive Web App (PWA). To enhance the user experience on mobile screen sizes, we are implementing a native-like "swipe-to-action" gesture on product rows. Swiping a row to the left will reveal action buttons underneath (Edit and Delete).

## 2. Requirements & Constraints
* **Gesture Support:** Left swipe gesture on product rows to reveal actions, with a snap-open threshold of `80px`.
* **Single-Open Behavior:** Only one product row can be swiped open at a time. Swiping another row or clicking outside will close the currently open row.
* **Touch Events Only:** Gestures will strictly support mobile touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`). Desktop mouse drag is not required.
* **Actions:**
  * **Edit:** Settings/Gear icon (`#f47b20` brand orange), triggers adaptation of the existing Add Product page to edit the selected product.
  * **Delete:** Trash icon (`bg-red-500`), triggers a confirmation dialog and then deletes the product via the API.
* **API Expansion:** The API must be extended to support `PUT` (update product details) and `DELETE` (remove product).

---

## 3. UI & Gesture Architecture

### Component: `SwipeableProductRow`
* **File Location:** `src/components/SwipeableProductRow.tsx`
* **Structure:**
  * **Bottom Layer (Actions underlay):** Fixed block positioned absolutely behind the row. Width = `140px` (70px for Edit, 70px for Delete).
  * **Top Layer (Product info card):** Standard item layout containing image, name, and price. Styled with `bg-white z-10` to hide the actions when closed.
* **Gesture Logic:**
  * `onTouchStart`: Records starting touch coordinates (`clientX`). If another row is currently open, it notifies the parent to close it.
  * `onTouchMove`: Tracks delta movement. Translates the top layer to the left by `Math.min(140, deltaX)` pixels if swiping left.
  * `onTouchEnd`: Evaluates snap-threshold (`80px`):
    * If `deltaX > 80px`, snap open to full `140px` offset and trigger `onOpen()`.
    * Otherwise, snap closed to `0px` offset and trigger `onClose()`.
* **Props interface:**
  ```typescript
  interface SwipeableProductRowProps {
    product: any;
    selectedCurrency: Currency;
    price: number;
    onEdit: () => void;
    onDelete: () => void;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    isLast: boolean;
  }
  ```

### Parent Page Integration: `src/pages/Products.tsx`
* Manage state for which row is open:
  ```typescript
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  ```
* Render `SwipeableProductRow` in the product mapping loop.
* Clear `openRowId` when tapping anywhere on the container page.

---

## 4. API Endpoints (`functions/api/products.ts`)

### 1. `DELETE /api/products?id=<id>`
* Removes a product from the SQLite D1 database.
* Returns `200 OK` on success:
  ```json
  { "success": true }
  ```

### 2. `PUT /api/products?id=<id>`
* Updates product details. Accepts `multipart/form-data`.
* If a new `image` file is uploaded:
  * Upload to the Cloudflare R2 bucket.
  * Update `image_url` field with the new public URL.
* If no new image is provided:
  * Retain the existing `image_url` passed from the client form data.
* Returns `200 OK` on success:
  ```json
  { "success": true }
  ```

---

## 5. Edit Flow adaptation (`src/pages/AddProduct.tsx` & `src/App.tsx`)

### Navigation & State (`src/App.tsx`)
* Maintain `editingProduct` state in `App.tsx`:
  ```typescript
  const [editingProduct, setEditingProduct] = useState<any>(null);
  ```
* When Edit is clicked, set `editingProduct` and navigate to `add-product`.
* Pass `productToEdit={editingProduct}` to the `AddProduct` component.

### Adaptation (`src/pages/AddProduct.tsx`)
* Detect mode by checking if `productToEdit` is passed.
* Initialize forms with the product values:
  * Name, prices for all currencies.
  * Image preview set to `productToEdit.image_url`. No new image upload is required to save changes.
* Handle submission:
  * If editing, submit using a `PUT` request to `/api/products?id=${productToEdit.id}` instead of a `POST` request.
  * If no new image file was selected, send the existing `image_url` string in the form data.

---

## 6. Verification Criteria
* **Gesture Test:** Verify that swipe transitions snap back when pulled $<80px$ and stay open when pulled $>80px$.
* **Single Open Test:** Verify that swiping row B automatically snaps open row A back to its closed state.
* **Edit Flow Test:** Verify modifying product name/price/image updates database state and is reflected immediately in the product table.
* **Delete Flow Test:** Verify clicking delete prompts a confirmation, deletes the database entry, and removes the row from the table.
