# Compact Product Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert product card layout in the Order page back to horizontal quantity controls, but replace the displayed product category with the product price to keep the overall height compact.

**Architecture:** Modify `src/pages/Order.tsx` to:
1. Revert product card wrapper class to original (no `relative` class needed).
2. Remove displayed category text completely.
3. Place the product price below the title, styled as bold with size `14px` and color `#805062`.
4. Restore horizontal quantity controls at the bottom (`mt-auto`). If selected, show `[-] qty [+]` in a horizontal pill. If not selected, show a single `[+]` button aligned to the right.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints

- Keep pull requests small and focused.
- Follow the Conventional Commits standard.
- All components must adhere to Tailwind CSS and Shadcn UI patterns.

---

### Task 1: Revert to Horizontal Controls & Replace Category with Price in Order.tsx

**Files:**
- Modify: [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)

**Interfaces:**
- Consumes: `quantities` and `selectedCurrency` from `useOrderStore`
- Produces: Horizontal controls layout with price below title in Order page

- [ ] **Step 1: Modify layout of the product card**

Update [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx) by replacing lines 218 to 281 with the following implementation:

```tsx
                    <div
                      key={product.id}
                      className={`bg-white rounded-[20px] p-3 shadow-[0_4px_12px_rgba(78,52,46,0.05)] transition-all duration-200 flex flex-col border ${isSelected
                          ? 'border-2 border-brand-pink ring-4 ring-brand-pink/10'
                          : 'border-outline-warm/40'
                        }`}
                    >
                      {/* Product Image */}
                      <div className="aspect-square rounded-xl bg-peach-container/40 relative overflow-hidden mb-3 flex items-center justify-center p-2 border border-outline-warm/15">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-[14px] text-text-brown leading-tight mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="font-bold text-[14px] text-[#805062] mb-3">
                        {selectedCurrency.symbol}{price.toFixed(2)}
                      </p>

                      {/* Action / Controls */}
                      <div className="mt-auto">
                        {isSelected ? (
                          <div className="flex items-center justify-between bg-brand-pink/20 rounded-full p-1 border border-brand-pink/30">
                            <button
                              type="button"
                              onClick={() => handleDecrement(product.id)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#805062] hover:bg-brand-pink/10 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-text-brown text-sm">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrement(product.id)}
                              className="w-7 h-7 rounded-full bg-[#805062] flex items-center justify-center text-white hover:bg-[#805062]/90 active:scale-90 transition-transform cursor-pointer border-none shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleIncrement(product.id)}
                              className="w-8 h-8 rounded-full bg-[#ffd9e4] text-[#805062] hover:bg-brand-pink/30 active:scale-90 transition-transform flex items-center justify-center shadow-sm cursor-pointer border-none"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
```

- [ ] **Step 2: Run build to verify TypeScript compilation**

Run: `pnpm build`
Expected: Compilation completes successfully with no errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/pages/Order.tsx
git commit -m "feat(order): restore horizontal controls and display price instead of category"
```
