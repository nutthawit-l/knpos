# Phase 3 Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect Order UI to backend to dynamically fetch and display products.

### Task 1: Dynamic Data Integration

**Files:**
- Modify: `src/pages/Order.tsx`

- [ ] **Step 1: Clean up static data & Add State**
Remove all `imgImage...` constants and the static `products` array.
Add `useEffect` to React imports.
Inside the `Order` component:
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
Change default currency from `USD` to `THB`.

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

- [ ] **Step 3: Update Calculations**
Replace `totalCost` calculation with:
```tsx
  const totalCost = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    return sum + (getPrice(product, selectedCurrency.code) * qty);
  }, 0);
```

- [ ] **Step 4: Update Rendering**
If `isLoading` is true, show a simple `<div className="p-4 text-center text-gray-500">Loading products...</div>` where the products map is.
Inside the `.map(product => ...)`:
Replace `product.image` with `product.image_url`.
Replace `product.price.replace('$', selectedCurrency.symbol)` with `getPrice(product, selectedCurrency.code).toFixed(2)`.

- [ ] **Step 5: Verify & Commit**
Run `pnpm build && pnpm lint`.
Commit: `feat: connect Order page to dynamic products API`
