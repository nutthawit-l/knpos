# Transactions List Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the Transactions page so that only the transaction list/items section scrolls vertically, while the Hero Section and Tab Buttons remain fixed at the top of the viewport.

**Architecture:** Update `MainLayout.tsx` route configs to set `disableLayoutScroll: true` for `/transactions`, preventing outer page scroll. Then update `Transactions.tsx` using flexbox to fill height, fixing the hero/tabs and making the list container overflow-y-auto.

**Tech Stack:** React, Tailwind CSS, TypeScript

## Global Constraints
- All components must adhere to Tailwind CSS and Shadcn UI patterns.
- Follow the Conventional Commits standard for commit messages.
- Run `pnpm run lint` and `pnpm run build` to verify code changes.

---

### Task 1: Update MainLayout Route Configuration

**Files:**
- Modify: `src/components/MainLayout.tsx`

**Interfaces:**
- Consumes: None
- Produces: Disables layout-level scrolling for the `/transactions` path.

- [ ] **Step 1: Modify MainLayout route configuration**

Modify the `/transactions` entry in `ROUTE_CONFIGS` in `src/components/MainLayout.tsx` to set `disableLayoutScroll: true`.

```typescript
  '/transactions': {
    title: (_, activeEventName) => activeEventName ? `Transaction of ${activeEventName}` : 'Transaction',
    tab: 'transactions',
    disableLayoutScroll: true,
  },
```

- [ ] **Step 2: Run build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```
Expected: The build and lint pass successfully.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/MainLayout.tsx
git commit -m "feat(layout): disable outer layout scroll for transactions page"
```

---

### Task 2: Implement Inner Scroll on Transactions Page

**Files:**
- Modify: `src/pages/Transactions.tsx`

**Interfaces:**
- Consumes: `disableLayoutScroll: true` config from MainLayout.
- Produces: Flexbox layout for the Transactions page with a scrollable list and static header/tabs.

- [ ] **Step 1: Restructure Transactions.tsx layout and containers**

Apply the following modifications to `src/pages/Transactions.tsx`:
1. Change the root container div's className to `flex flex-col min-h-0 h-full space-y-5`.
2. Add `shrink-0` to the Hero Section's `<section className="...">`.
3. Wrap the tabs/list section in `<section className="flex-1 flex flex-col min-h-0 space-y-4">`.
4. Add `shrink-0` to the tab buttons container `div`'s className.
5. Update the `{/* List */}` container div to have className `flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-3 pb-6`.
6. Move the `{/* Aesthetic Footer Mascot sticker */}` div inside the `{/* List */}` container as the last child (below the conditional tab rendering block).

Replacement Details:

```tsx
  return (
    <>
      <div className="flex flex-col min-h-0 h-full space-y-5">
          {/* Hero Section: Total Performance */}
          <section className="relative overflow-hidden bg-pink-container rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(78,52,46,0.08)] border border-white/40 shrink-0">
            {/* Decorative circle */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-blue/30 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-[14px] text-[#805062]">Total Sales Today</p>
                <EventCurrencyIndicator />
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-text-brown tracking-tight">
                  {selectedCurrency.symbol}
                  {summary.daily_total_income.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-surface-variant-custom text-[11px] bg-white/50 px-2 py-0.5 rounded-full font-bold">
                  +12% vs yesterday
                </span>
              </div>
              <div className="flex items-center gap-4 bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                <div className="bg-brand-blue p-2 rounded-xl text-[#326578]">
                  <ShoppingBasket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[12px] text-surface-variant-custom font-semibold">Total Items Sold</p>
                  <p className="font-bold text-text-brown text-xl">
                    {summary.daily_total_product_sold} {summary.daily_total_product_sold === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content List / Tabs */}
          <section className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex justify-between items-center px-1 gap-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                <button
                  onClick={() => setActiveTab('top5')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${activeTab === 'top5'
                      ? 'bg-[#805062] text-white border-transparent'
                      : 'bg-white text-surface-variant-custom border-outline-warm hover:bg-[#eae0e1]/20'
                    }`}
                >
                  Top 5
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${activeTab === 'all'
                      ? 'bg-[#805062] text-white border-transparent'
                      : 'bg-white text-surface-variant-custom border-outline-warm hover:bg-[#eae0e1]/20'
                    }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${activeTab === 'orders'
                      ? 'bg-[#805062] text-white border-transparent'
                      : 'bg-white text-surface-variant-custom border-outline-warm hover:bg-[#eae0e1]/20'
                    }`}
                >
                  Order by Order
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-3 pb-6">
              {isLoading ? (
                <div className="p-8 text-center text-[14px] text-text-brown font-medium bg-white rounded-[24px] border border-outline-warm/20">
                  Loading sales data...
                </div>
              ) : activeTab === 'orders' ? (
                /* Order by Order View */
                orders.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[#9ca3af] font-medium bg-white rounded-[24px] border border-outline-warm/20">
                    No transactions recorded today.
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-[24px] flex items-center justify-between shadow-[0_4px_12px_rgba(78,52,46,0.04)] border border-outline-warm/30 hover:translate-y-[-1px] transition-transform duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#b5e7fe]/40 p-3 rounded-2xl text-[#326578]">
                          <ReceiptText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-brown text-sm">Order #{order.id}</h3>
                          <p className="text-xs text-[#9ca3af] font-semibold">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#805062] text-sm">
                          {selectedCurrency.symbol}
                          {order.total_income.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-surface-variant-custom font-semibold">
                          {order.total_product_sold} {order.total_product_sold === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Best Selling Items View */
                displayedItems.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[#9ca3af] font-medium bg-white rounded-[24px] border border-outline-warm/20">
                    No products sold today.
                  </div>
                ) : (
                  displayedItems.map((item, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={item.product_id}
                        className="bg-white p-4 rounded-[24px] flex items-center gap-4 shadow-[0_4px_12px_rgba(78,52,46,0.04)] border border-outline-warm/30 hover:translate-y-[-1px] transition-transform duration-200"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface border border-outline-warm/15 flex items-center justify-center p-1">
                            <img
                              className="w-full h-full object-contain mix-blend-multiply"
                              src={item.image_url}
                              alt={item.product_name}
                            />
                          </div>
                          <div
                            className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm ${rank === 1
                                ? 'bg-brand-peach text-text-brown'
                                : 'bg-[#eae0e1] text-surface-variant-custom'
                              }`}
                          >
                            {rank}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-brown truncate text-sm">
                            {item.product_name}
                          </h3>
                          <p className="text-xs text-[#9ca3af] font-semibold">
                            {item.total_sold_today} {item.total_sold_today === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-[#805062] text-sm">
                            {item.total_sold_today} Sold
                          </p>
                          {rank === 1 && (
                            <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-1 border border-green-100">
                              <TrendingUp className="w-3 h-3" />
                              <span>Trending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* Aesthetic Footer Mascot sticker */}
              <div className="flex flex-col items-center justify-center py-6 opacity-60 select-none shrink-0">
                <div className="relative">
                  <MascotLogo
                    sizeClassName="w-16 h-16"
                    className="border-4 border-white shadow-md floating-animation mb-2"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#805062] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                    CHARNI
                  </div>
                </div>
                <p className="font-bold text-xs text-text-brown">Great job today!</p>
              </div>
            </div>
          </section>
      </div>
```

- [ ] **Step 2: Run build and lint**

Run:
```bash
pnpm run lint && pnpm run build
```
Expected: The build and lint pass successfully.

- [ ] **Step 3: Commit changes**

```bash
git add src/pages/Transactions.tsx
git commit -m "feat(transactions): implement inner vertical scroll for transaction items"
```
