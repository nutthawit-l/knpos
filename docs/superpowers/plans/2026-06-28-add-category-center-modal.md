# Center Category Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Add Category interface in `AddProduct.tsx` to open as a centered, premium mobile overlay modal instead of an inline bottom-popup.

**Architecture:** Use absolute positioning (`absolute inset-0`) with a high z-index (`z-[100]`) to overlay the modal within the mobile container. The modal will render a blurred backdrop and a centered card for entering and submitting a new category.

**Tech Stack:** React, Tailwind CSS, Lucide Icons (X, Plus)

## Global Constraints

- Framework/Bundler: Vite + React
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand
- Components: Adhere to Tailwind CSS and Shadcn UI patterns

---

### Task 1: Refactor Category Modal layout in AddProduct.tsx

**Files:**
- Modify: `src/pages/AddProduct.tsx`

**Interfaces:**
- Consumes: Existing state variables `isAddCategoryModalOpen`, `newCategoryName`, `setSelectedCategory`, and handlers `handleAddCategory`, `handleConfirmAddCategory`.

- [ ] **Step 1: Move and update the modal markup in AddProduct.tsx**

Remove the inline popup container markup inside the category selection block and place it at the very bottom of the component's JSX, right inside the root wrapper `div`.

Update the structure and CSS classes to center the modal and render a blurred backdrop.

Modify the JSX to look like this at the end of the return statement (just before the closing `</div>` of the root container):

```tsx
      {/* Submit Action */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="w-full h-14 bg-brand-pink hover:bg-brand-pink-hover active:scale-[0.97] transition-all rounded-full flex items-center justify-center gap-2 text-text-brown font-bold text-[16px] uppercase tracking-wide shadow-md disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-text-brown" />
              <span>Saving...</span>
            </>
          ) : (
            <span>
              {productToEdit
                ? ADD_PRODUCT_DATA.saveChangesButtonText
                : ADD_PRODUCT_DATA.saveButtonText}
            </span>
          )}
        </button>
      </div>
    </div>

    {/* Center Modal for Adding Category */}
    {isAddCategoryModalOpen && (
      <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-text-brown/40 backdrop-blur-xs">
        {/* Backdrop click listener */}
        <div 
          className="absolute inset-0 cursor-default"
          onClick={() => setIsAddCategoryModalOpen(false)}
        />
        
        {/* Modal card */}
        <div 
          className="relative bg-white rounded-[24px] w-full max-w-[320px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] z-10 border border-outline-warm/20 p-6 flex flex-col gap-4 bg-pattern"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-brown text-[16px]">Add Category</h2>
            <button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(false)}
              className="p-1 text-[#805062] hover:opacity-80 border-none bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-1 text-left">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className="w-full h-12 px-5 rounded-full border-2 border-outline-warm focus:border-brand-pink focus:outline-none text-[14px] font-medium text-text-brown shadow-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(false)}
              className="px-5 py-2.5 rounded-full border-2 border-outline-warm text-[13px] font-bold text-text-brown bg-transparent cursor-pointer hover:bg-outline-warm/10 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAddCategory}
              className="px-5 py-2.5 rounded-full bg-brand-pink text-text-brown text-[13px] font-bold border-none cursor-pointer hover:bg-brand-pink-hover transition-all active:scale-95 shadow-md"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: Clean up the old popup code from Category Selection**

Locate and remove the old inline popup rendering code inside the Category selection container.

Specifically, replace the code from:
```tsx
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="w-9 h-9 rounded-full bg-peach-container text-text-brown flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
                    aria-label="Add Category"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {isAddCategoryModalOpen && (
                    <>
                      {/* Backdrop */}
                      ...
                    </>
                  )}
                </div>
```

with just the Plus button:
```tsx
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-9 h-9 rounded-full bg-peach-container text-text-brown flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
                  aria-label="Add Category"
                >
                  <Plus className="w-5 h-5" />
                </button>
```

- [ ] **Step 3: Run the build to verify no compilation errors**

Run: `pnpm build`
Expected: Successful production build without TypeScript or bundler errors.

- [ ] **Step 4: Commit the changes**

Run: `git commit -am "feat: refactor add category modal to center modal in AddProduct"`
Expected: Commit success.
