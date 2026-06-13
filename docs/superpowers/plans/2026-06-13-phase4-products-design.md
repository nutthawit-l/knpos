# Phase 4 Product Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the Products page to the backend to dynamically fetch and display the product catalog.

### Task 1: Dynamic Data Integration

**Files:**
- Modify: `src/pages/Products.tsx`

- [ ] **Step 1: Clean up static data & Add State**
Remove all `imgImage...` constants and the static `products` array.
Add `useEffect` to React imports.
Inside the `Products` component:
```tsx
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);
```
Change default currency in `selectedCurrency` from `USD` to `THB`.

- [ ] **Step 2: Add Price Helper**
Add this function before the `return` statement:
```tsx
  const getPrice = (product: any, currencyCode: string) => {
    const map: Record<string, string> = {
      'JPY': 'jpn_price', 'THB': 'tha_price', 'SGD': 'sgp_price',
      'USD': 'deu_price', 'EUR': 'deu_price', 'KRW': 'kor_price',
      'IDR': 'idn_price', 'CNY': 'chn_price', 'TWD': 'twn_price'
    };
    const key = map[currencyCode] || 'tha_price';
    return parseFloat(product[key]) || 0;
  };
```

- [ ] **Step 3: Update Rendering logic**
In the JSX where the products map is:
```tsx
            {/* List Items */}
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {isLoading ? (
                <div className="p-4 text-center text-[13px] text-gray-500 font-medium">
                  Loading products...
                </div>
              ) : products.map((product, index) => (
```
Inside the `.map(product => ...)` block:
- Replace `product.image` with `product.image_url`.
- Replace `product.id` (where it displays) with `PRD-${String(product.id).padStart(3, '0')}`.
- Replace `product.price.replace('$', selectedCurrency.symbol)` with `getPrice(product, selectedCurrency.code).toFixed(2)`.

- [ ] **Step 4: Verify & Commit**
Run `pnpm build && pnpm lint`.
Commit: `feat: connect Products page to dynamic products API`
