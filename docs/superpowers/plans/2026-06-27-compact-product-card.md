# Compact Product Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact the size of product cards in the Products List/Grid of the Order page by changing the quantity controls to a vertical layout side-by-side with the product price.

**Architecture:** Modify `src/pages/Order.tsx` to group the price and quantity controls side-by-side using Flexbox. When selected, the quantity controls will render as a vertical pill with `[+]`, quantity text, and `[-]`. When not selected, a single pink `[+]` button will align to the right of the price.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints

- Keep pull requests small and focused.
- Follow the Conventional Commits standard.
- All components must adhere to Tailwind CSS and Shadcn UI patterns.

---

### Task 1: Update Product Card Action/Price Section

**Files:**
- Modify: [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx#L240-L281)

**Interfaces:**
- Consumes: `quantities` and `selectedCurrency` from `useOrderStore`
- Produces: Updated compact card layout in UI

- [ ] **Step 1: Modify layout of the Action/Price section**

Update [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx) to align the price and quantity controls side-by-side inside a single flex row. Replace the code in lines 240-281 with the following implementation:

```tsx
                    {/* Action / Price */}
                    <div className="mt-auto flex items-center justify-between w-full min-h-[36px] pt-1">
                      <span className="font-bold text-[14px] text-[#805062]">
                        {selectedCurrency.symbol}{price.toFixed(2)}
                      </span>

                      {isSelected ? (
                        <div className="flex flex-col items-center bg-brand-pink/20 rounded-[16px] p-0.5 border border-brand-pink/30 gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleIncrement(product.id)}
                            className="w-6 h-6 rounded-full bg-[#805062] flex items-center justify-center text-white hover:bg-[#805062]/90 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-text-brown text-[11px] min-w-[18px] text-center leading-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDecrement(product.id)}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#805062] hover:bg-brand-pink/10 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleIncrement(product.id)}
                          className="w-8 h-8 rounded-full bg-[#ffd9e4] text-[#805062] hover:bg-brand-pink/30 active:scale-90 transition-transform flex items-center justify-center shadow-sm cursor-pointer border-none shrink-0"
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
1. When not selected, the price and pink `[+]` button are side-by-side, saving significant vertical card height.
2. When selected, the controls transition into a compact vertical pill next to the price.
3. Tap targets are easy to click and update the order state correctly.

- [ ] **Step 4: Commit changes**

```bash
git add src/pages/Order.tsx
git commit -m "feat(order): change quantity controls to vertical layout next to price"
```
