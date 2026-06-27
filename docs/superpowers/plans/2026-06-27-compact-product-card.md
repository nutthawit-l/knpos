# Compact Product Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact the size of product cards in the Products List/Grid of the Order page by changing the quantity controls to a vertical layout that stacks upwards from the bottom-right, reusing the space above the plus button and avoiding card height expansion.

**Architecture:** Modify `src/pages/Order.tsx` to:
1. Make the product card container `relative`.
2. Add `pr-8` to the product title and category to avoid overlapping with controls.
3. Absolutely position the quantity controls at the bottom-right (`absolute bottom-3 right-3`).
4. In the selected state, render a vertical pill with the minus button `[-]` at the top, quantity text in the middle, and plus button `[+]` at the bottom. This ensures the `[+]` button remains in the same position and the controls grow upwards.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints

- Keep pull requests small and focused.
- Follow the Conventional Commits standard.
- All components must adhere to Tailwind CSS and Shadcn UI patterns.

---

### Task 1: Update Product Card Layout in Order.tsx

**Files:**
- Modify: [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)

**Interfaces:**
- Consumes: `quantities` and `selectedCurrency` from `useOrderStore`
- Produces: Compact card layout with absolutely positioned vertical controls

- [ ] **Step 1: Modify layout of the product card**

Update [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx) as follows:
1. Add `relative` to the product card wrapper container (line 218).
2. Add `pr-8` to the product title `h3` (line 233).
3. Add `pr-8` to the category `p` (line 236).
4. Replace the `{/* Action / Price */}` section and quantity control markup (lines 240-281) to place the price at the bottom-left and the controls in an `absolute bottom-3 right-3` container.

Specifically, replace the code starting from `{/* Info */}` to the end of the card return block with:

```tsx
                    {/* Info */}
                    <h3 className="font-bold text-[14px] text-text-brown leading-tight mb-1 truncate pr-8">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-outline-variant-warm font-medium mb-3 pr-8">
                      {product.category_name || 'General'}
                    </p>

                    {/* Action / Price */}
                    <div className="mt-auto pt-1">
                      <span className="font-bold text-[14px] text-[#805062]">
                        {selectedCurrency.symbol}{price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Controls (Absolutely Positioned) */}
                    <div className="absolute bottom-3 right-3 z-10">
                      {isSelected ? (
                        <div className="flex flex-col items-center bg-brand-pink/20 rounded-[16px] p-0.5 border border-brand-pink/30 gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDecrement(product.id)}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#805062] hover:bg-brand-pink/10 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-text-brown text-[11px] min-w-[18px] text-center leading-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(product.id)}
                            className="w-6 h-6 rounded-full bg-[#805062] flex items-center justify-center text-white hover:bg-[#805062]/90 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleIncrement(product.id)}
                          className="w-8 h-8 rounded-full bg-[#ffd9e4] text-[#805062] hover:bg-brand-pink/30 active:scale-90 transition-transform flex items-center justify-center shadow-sm cursor-pointer border-none"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
```

- [ ] **Step 2: Run build to verify TypeScript compilation**

Run: `pnpm build`
Expected: Compilation completes successfully with no errors in `src/pages/Order.tsx`.

- [ ] **Step 3: Run dev server to verify visually**

Run: `pnpm dev`
Expected: Server starts successfully. Verify on the UI that:
1. When not selected, the price is at the bottom left and the pink `[+]` button is at the bottom right.
2. When clicked, the `[+]` button transitions to the vertical controls with the `[+]` button at the bottom and `[-]` at the top.
3. The card height does not expand when a product is selected.
4. Tap targets work correctly and update the order state.

- [ ] **Step 4: Commit changes**

```bash
git add src/pages/Order.tsx
git commit -m "feat(order): absolute position vertical quantity controls to prevent card height expansion"
```
