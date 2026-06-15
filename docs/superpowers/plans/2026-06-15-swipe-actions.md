# Swipe Actions & Product Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement native-like swipe gestures on product rows to reveal Edit and Delete actions, supported by PUT/DELETE API endpoints and an adapted product editing form.

**Architecture:** A reusable React swipe component handles touch start/move/end events to translate product rows horizontally. A parent-level state ensures only one row is swiped open at a time. The database and backend functions are extended with DELETE and PUT routes.

**Tech Stack:** React 19, TypeScript 6.0, Tailwind CSS 4.0, Cloudflare D1 & R2, Lucide React icons.

---

## File Structure Changes
* **Create:** `scripts/test-api.ts` — Mock testing script for DELETE and PUT API endpoints.
* **Create:** `src/components/SwipeableProductRow.tsx` — Reusable touch-gesture swipeable row component.
* **Modify:** `functions/api/products.ts` — Add `onRequestDelete` and `onRequestPut`.
* **Modify:** `src/App.tsx` — Add `editingProduct` navigation state and pass to `AddProduct`.
* **Modify:** `src/pages/AddProduct.tsx` — Pre-populate forms and handle update PUT requests when `productToEdit` is provided.
* **Modify:** `src/pages/Products.tsx` — Integrate `SwipeableProductRow`, track open row state, and handle delete/edit triggers.

---

### Task 1: Add DELETE and PUT endpoints to products API

**Files:**
* Create: `scripts/test-api.ts`
* Modify: `functions/api/products.ts`

- [ ] **Step 1: Create the API test script**
Create `scripts/test-api.ts` to mock and run test calls to `onRequestDelete` and `onRequestPut`:

```typescript
import { onRequestDelete, onRequestPut } from '../functions/api/products';

// Mock DB implementation
const mockDb = {
  prepare: (sql: string) => ({
    bind: (...args: any[]) => ({
      run: async () => ({ success: true }),
      all: async () => ({ results: [] }),
    }),
    run: async () => ({ success: true }),
    all: async () => ({ results: [] }),
  }),
};

// Mock R2 implementation
const mockBucket = {
  put: async () => {},
};

const mockContext: any = {
  env: {
    DB: mockDb,
    IMAGES_BUCKET: mockBucket,
    R2_PUBLIC_URL: 'http://localhost/images',
  },
  request: new Request('http://localhost/api/products?id=99', {
    method: 'DELETE',
  }),
};

async function runTests() {
  console.log('Running API tests...');

  // Test DELETE
  if (typeof onRequestDelete !== 'function') {
    throw new Error('onRequestDelete is not defined');
  }
  const deleteRes = await onRequestDelete(mockContext);
  console.log('DELETE status:', deleteRes.status);
  const deleteData = await deleteRes.json();
  if (!deleteData.success) {
    throw new Error('DELETE failed');
  }

  // Test PUT
  if (typeof onRequestPut !== 'function') {
    throw new Error('onRequestPut is not defined');
  }
  const mockForm = new FormData();
  mockForm.append('name', 'Updated Product');
  mockForm.append('tha_price', '450');
  mockForm.append('image_url', 'http://localhost/images/prev.png');
  
  const putContext = {
    ...mockContext,
    request: new Request('http://localhost/api/products?id=99', {
      method: 'PUT',
      body: mockForm,
    }),
  };

  const putRes = await onRequestPut(putContext);
  console.log('PUT status:', putRes.status);
  const putData = await putRes.json();
  if (!putData.success) {
    throw new Error('PUT failed');
  }

  console.log('All API tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx scripts/test-api.ts`
Expected Output: Fail with "onRequestDelete is not defined" or similar.

- [ ] **Step 3: Implement PUT and DELETE API endpoints**
Modify `functions/api/products.ts` to implement both handlers:

```typescript
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { success } = await context.env.DB.prepare(
      'DELETE FROM Product WHERE id = ?'
    )
      .bind(parseInt(id))
      .run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database deletion failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await context.request.formData();
    const name = formData.get('name') as string;
    const thaPrice = parseFloat(formData.get('tha_price') as string);
    const sgpPrice = formData.get('sgp_price') ? parseFloat(formData.get('sgp_price') as string) : null;
    const idnPrice = formData.get('idn_price') ? parseFloat(formData.get('idn_price') as string) : null;
    const deuPrice = formData.get('deu_price') ? parseFloat(formData.get('deu_price') as string) : null;
    const jpnPrice = formData.get('jpn_price') ? parseFloat(formData.get('jpn_price') as string) : null;
    const chnPrice = formData.get('chn_price') ? parseFloat(formData.get('chn_price') as string) : null;
    const twnPrice = formData.get('twn_price') ? parseFloat(formData.get('twn_price') as string) : null;
    const korPrice = formData.get('kor_price') ? parseFloat(formData.get('kor_price') as string) : null;

    if (!name || isNaN(thaPrice)) {
      return new Response('Missing required fields', { status: 400 });
    }

    let imageUrl = formData.get('image_url') as string || '';
    const imageFile = formData.get('image') as unknown as File;

    if (imageFile && imageFile.name) {
      const filename = `${Date.now()}-${imageFile.name}`;
      await context.env.IMAGES_BUCKET.put(filename, imageFile.stream());
      imageUrl = `${context.env.R2_PUBLIC_URL}/${filename}`;
    }

    const { success } = await context.env.DB.prepare(
      `UPDATE Product SET 
        name = ?, tha_price = ?, sgp_price = ?, idn_price = ?, deu_price = ?, 
        jpn_price = ?, chn_price = ?, twn_price = ?, kor_price = ?, image_url = ?
       WHERE id = ?`
    )
      .bind(
        name, thaPrice, sgpPrice, idnPrice, deuPrice, 
        jpnPrice, chnPrice, twnPrice, korPrice, imageUrl,
        parseInt(id)
      )
      .run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database update failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx scripts/test-api.ts`
Expected Output: "All API tests passed!"

- [ ] **Step 5: Commit**
Run:
```bash
git add functions/api/products.ts scripts/test-api.ts
git commit -m "feat: add PUT and DELETE product API endpoints with tests"
```

---

### Task 2: Pass editingProduct state from App.tsx

**Files:**
* Modify: `src/App.tsx:12-64`

- [ ] **Step 1: Check typescript compile to ensure compile verification works**
Run: `pnpm build`
Expected Output: Successful build.

- [ ] **Step 2: Add editingProduct state and pass to AddProduct page**
Modify `src/App.tsx`:

```typescript
import { useState } from 'react';
import Overview from './pages/Overview';
import Order from './pages/Order';
import Transactions from './pages/Transactions';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerify from './pages/OTPVerify';
import Sidebar from './components/Sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab !== 'add-product') {
      setEditingProduct(null);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setActiveTab('add-product');
  };

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />
      {activeTab === 'dashboard' && (
        <Overview
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'order' && (
        <Order
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'transactions' && (
        <Transactions
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      {activeTab === 'products' && (
        <Products
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProduct={handleEditProduct}
        />
      )}
      {activeTab === 'add-product' && (
        <AddProduct
          onNavigate={handleNavigate}
          onMenuClick={() => setIsSidebarOpen(true)}
          productToEdit={editingProduct}
        />
      )}
      {activeTab === 'login' && <Login onNavigate={handleNavigate} />}
      {activeTab === 'register' && <Register onNavigate={handleNavigate} />}
      {activeTab === 'otp-verify' && <OTPVerify onNavigate={handleNavigate} />}
    </>
  );
}

export default App;
```

- [ ] **Step 3: Run build to verify compilation fails on AddProduct props**
Run: `pnpm build`
Expected Output: Fail with type error indicating `productToEdit` or `onEditProduct` does not exist on respective components.

- [ ] **Step 4: Commit**
Run:
```bash
git add src/App.tsx
git commit -m "feat: add editing product state and routing in App.tsx"
```

---

### Task 3: Adapt AddProduct.tsx for Editing

**Files:**
* Modify: `src/pages/AddProduct.tsx`

- [ ] **Step 1: Modify AddProduct component props and initialization logic**
Update interface and useEffect hooks to pre-populate form fields:

```typescript
interface AddProductProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
  productToEdit?: any;
}

export default function AddProduct({ onNavigate, productToEdit }: AddProductProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    productToEdit ? productToEdit.image_url : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(productToEdit ? productToEdit.name : '');
  
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    if (!productToEdit) return {};
    return {
      THB: String(productToEdit.tha_price || ''),
      SGD: String(productToEdit.sgp_price || ''),
      JPY: String(productToEdit.jpn_price || ''),
      USD: String(productToEdit.deu_price || ''),
      EUR: String(productToEdit.deu_price || ''),
      KRW: String(productToEdit.kor_price || ''),
      IDR: String(productToEdit.idn_price || ''),
      CNY: String(productToEdit.chn_price || ''),
      TWD: String(productToEdit.twn_price || ''),
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);
```

- [ ] **Step 2: Update save logic to support PUT request when editing**
Modify `handleSave` to check `productToEdit`:

```typescript
  const handleSave = async () => {
    if (!name || !prices['THB'] || (!imageFile && !productToEdit)) {
      alert('Name, Thai Price, and Image are required.');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (productToEdit) {
        formData.append('image_url', productToEdit.image_url);
      }
      formData.append('tha_price', prices['THB']);

      const currencyMap: Record<string, string> = {
        JPY: 'jpn_price',
        SGD: 'sgp_price',
        USD: 'deu_price',
        EUR: 'deu_price',
        KRW: 'kor_price',
        IDR: 'idn_price',
        CNY: 'chn_price',
        TWD: 'twn_price',
        THB: 'tha_price',
      };

      Object.entries(prices).forEach(([currency, val]) => {
        if (currency !== 'THB' && val && currencyMap[currency]) {
          formData.append(currencyMap[currency], val);
        }
      });

      const url = productToEdit ? `/api/products?id=${productToEdit.id}` : '/api/products';
      const method = productToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        onNavigate?.('products');
      } else {
        const errorText = await res.text();
        alert('Failed to save: ' + errorText);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 3: Update Header & Save button text in JSX**
Change AddProduct header and button titles based on `productToEdit`:

```typescript
        <Header 
          title={productToEdit ? 'Edit Product' : 'Add Product'}
          onBackClick={() => onNavigate?.('products')} 
        />
```
*(Make sure to verify if `Header` accepts a `title` prop in `src/components/Header.tsx`, otherwise add it or change it inline inside `AddProduct`).*
Update the Save button text:
```typescript
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                productToEdit ? 'Save Changes' : 'Confirm'
              )}
```

- [ ] **Step 4: Verify Header title configuration**
Let's check `src/components/Header.tsx` implementation to make sure it handles `title` or how headers are custom configured.

- [ ] **Step 5: Run typecheck**
Run: `pnpm build`
Expected Output: Type error only for missing `onEditProduct` in `Products.tsx`.

- [ ] **Step 6: Commit**
Run:
```bash
git add src/pages/AddProduct.tsx
git commit -m "feat: adapt AddProduct page to handle edit mode"
```

---

### Task 4: Create SwipeableProductRow Component

**Files:**
* Create: `src/components/SwipeableProductRow.tsx`

- [ ] **Step 1: Implement the SwipeableProductRow component**
Create `src/components/SwipeableProductRow.tsx` with full touch handling:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { type Currency } from './CurrencySwitchPopup';

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

export default function SwipeableProductRow({
  product,
  selectedCurrency,
  price,
  onEdit,
  onDelete,
  isOpen,
  onOpen,
  onClose,
  isLast,
}: SwipeableProductRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentOffsetX = useRef(0);

  const buttonWidth = 140; // 2 buttons * 70px each
  const threshold = 80;

  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0);
      currentOffsetX.current = 0;
    } else {
      setOffsetX(buttonWidth);
      currentOffsetX.current = buttonWidth;
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const deltaX = startX.current - e.touches[0].clientX;
    
    // Calculate new offset based on direction and state
    let newOffset = currentOffsetX.current + deltaX;

    // Prevent swiping right past 0
    if (newOffset < 0) {
      newOffset = 0;
    }
    // Limit left swipe to slightly past the button width (resistance)
    if (newOffset > buttonWidth) {
      newOffset = buttonWidth + (newOffset - buttonWidth) * 0.3;
    }

    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (offsetX > threshold) {
      // Snap open
      setOffsetX(buttonWidth);
      currentOffsetX.current = buttonWidth;
      onOpen();
    } else {
      // Snap closed
      setOffsetX(0);
      currentOffsetX.current = 0;
      onClose();
    }
  };

  return (
    <div className="relative w-full overflow-hidden select-none shrink-0">
      {/* Underlay (Actions) */}
      <div 
        className="absolute top-0 bottom-0 right-0 flex items-center z-0"
        style={{ width: `${buttonWidth}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-[70px] h-full bg-[#f47b20] text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors active:bg-[#d46510]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-[70px] h-full bg-red-500 text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors active:bg-red-600"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* Overlay (Product Content) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex items-center gap-3 px-4 py-3 bg-white relative z-10 select-none ${
          !isSwiping ? 'transition-transform duration-200 ease-out' : ''
        } ${!isLast ? 'border-b border-gray-100' : ''}`}
        style={{
          transform: `translateX(-${offsetX}px)`,
        }}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            draggable="false"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="font-semibold text-foreground text-[13px] truncate">
            {product.name}
          </span>
          <span className="text-gray-400 text-[11px] font-normal">
            PRD-{String(product.id).padStart(3, '0')}
          </span>
        </div>
        <span className="font-semibold text-foreground text-[13px]">
          {selectedCurrency.symbol}
          {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify component compiles**
Run: `pnpm build`
Expected Output: Component compiles, build succeeds (except Products.tsx which we will fix next).

- [ ] **Step 3: Commit**
Run:
```bash
git add src/components/SwipeableProductRow.tsx
git commit -m "feat: implement reusable SwipeableProductRow component"
```

---

### Task 5: Integrate SwipeableProductRow and delete logic in Products.tsx

**Files:**
* Modify: `src/pages/Products.tsx`

- [ ] **Step 1: Check header properties**
Verify `src/components/Header.tsx` supports custom titles. If not, add `title?: string` to it first. Let's look at `Header.tsx` structure:
```typescript
// Look at Header file to see props
```

- [ ] **Step 2: Update Products page code to use SwipeableProductRow and support row selection & deletion**
Modify `src/pages/Products.tsx` to handle the swipe states, callback triggers, and DELETE request API calls:

```typescript
import { useState, useEffect } from 'react';
import { Filter, LayoutDashboard, Package, ReceiptText } from 'lucide-react';
import Header from '../components/Header';
import { currencies, type Currency } from '../components/CurrencySwitchPopup';
import CurrencySortControls from '../components/CurrencySortControls';
import SwipeableProductRow from '../components/SwipeableProductRow';

interface ProductsProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
  onEditProduct?: (product: any) => void;
}

export default function Products({ onNavigate, onMenuClick, onEditProduct }: ProductsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies.find((c) => c.code === 'THB') || currencies[0],
  );

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openRowId, setOpenRowId] = useState<number | null>(null);

  const fetchProducts = () => {
    setIsLoading(true);
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getPrice = (product: any, currencyCode: string) => {
    const map: Record<string, string> = {
      'JPY': 'jpn_price', 'THB': 'tha_price', 'SGD': 'sgp_price',
      'USD': 'deu_price', 'EUR': 'deu_price', 'KRW': 'kor_price',
      'IDR': 'idn_price', 'CNY': 'chn_price', 'TWD': 'twn_price'
    };
    const key = map[currencyCode] || 'tha_price';
    return parseFloat(product[key]) || 0;
  };

  const handleDeleteProduct = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (openRowId === id) {
          setOpenRowId(null);
        }
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during deletion.');
    }
  };

  return (
    <div 
      className='bg-[#f9fafb] h-dvh overflow-hidden flex justify-center'
      onClick={() => setOpenRowId(null)}
    >
      <div className='bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        <Header
          onMenuClick={onMenuClick}
          onImportClick={() => console.log('Import CSV')}
          onAddClick={() => onNavigate?.('add-product')}
        />

        {/* Content */}
        <div className='flex-1 flex flex-col overflow-hidden px-5 pb-24 bg-white'>
          {/* Categories */}

          {/* Product Table Data */}
          <div className='flex-1 border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0'>
              <h2 className='font-semibold text-foreground text-[14px]'>
                Product Table Data
              </h2>
              <CurrencySortControls
                selectedCurrency={selectedCurrency}
                onSelectCurrency={setSelectedCurrency}
              />
            </div>

            {/* Column Labels */}
            <div className='flex items-center px-4 py-2 bg-[#f9fafb] border-b border-gray-100 shrink-0'>
              <div className='flex-1 flex items-center gap-1'>
                <span className='text-[12px] font-medium text-gray-500'>
                  Product Info
                </span>
                <Filter className='w-2.5 h-2.5 text-gray-400' />
              </div>
              <span className='text-[12px] font-medium text-gray-500'>
                Price ({selectedCurrency.symbol})
              </span>
            </div>

            {/* List Items */}
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {isLoading ? (
                <div className="p-4 text-center text-[13px] text-gray-500 font-medium">
                  Loading products...
                </div>
              ) : products.map((product, index) => (
                <SwipeableProductRow
                  key={product.id}
                  product={product}
                  selectedCurrency={selectedCurrency}
                  price={getPrice(product, selectedCurrency.code)}
                  onEdit={() => onEditProduct?.(product)}
                  onDelete={() => handleDeleteProduct(product.id)}
                  isOpen={openRowId === product.id}
                  onOpen={() => setOpenRowId(product.id)}
                  onClose={() => {
                    if (openRowId === product.id) {
                      setOpenRowId(null);
                    }
                  }}
                  isLast={index === products.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className='absolute bottom-0 w-full max-w-[400px] bg-white border-t border-gray-100 flex items-center justify-between pb-safe z-10'>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Dashboard
            </span>
          </button>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('order')}
          >
            <Package className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Order
            </span>
          </button>
          <button
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('transactions')}
          >
            <ReceiptText className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Transactions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run final builds and check formatting**
Run: `pnpm build && pnpm lint`
Expected Output: Successful compilation with no ESLint errors.

- [ ] **Step 4: Commit**
Run:
```bash
git add src/pages/Products.tsx
git commit -m "feat: integrate SwipeableProductRow and delete API flow into Products page"
```
