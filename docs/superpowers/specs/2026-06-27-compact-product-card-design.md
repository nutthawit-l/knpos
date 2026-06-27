# Design Spec: Compact Product Card Layout in Order Page

Compact the product cards in the **Products List/Grid** section of the Order page (`src/pages/Order.tsx`) to fit more products on screen. Specifically, change the plus/minus buttons from a horizontal bar to a vertical style positioned side-by-side with the product price at the bottom of the card.

## Proposed Changes

### Pages

#### [MODIFY] [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)

* Update the bottom layout of the product card inside the `{filteredProducts.map((product) => { ... })}` loop.
* Replace the stacked price row and quantity controls row with a single row:
  * Container: `flex items-center justify-between mt-auto w-full`
  * Left side: Price text (`font-bold text-[14px] text-[#805062]`).
  * Right side: Quantity control.
    * **If selected (qty > 0):** A vertical pill/control stack (`flex flex-col items-center bg-brand-pink/20 rounded-[20px] p-1 border border-brand-pink/30 gap-1.5`):
      * `[+]` button (`w-7 h-7 rounded-full bg-[#805062] text-white flex items-center justify-center hover:bg-[#805062]/90 active:scale-90 transition-transform cursor-pointer border-none shadow-sm`)
      * Quantity display (`font-bold text-text-brown text-[12px] min-w-[20px] text-center`)
      * `[-]` button (`w-7 h-7 rounded-full bg-white text-[#805062] flex items-center justify-center hover:bg-brand-pink/10 active:scale-90 transition-transform cursor-pointer border-none shadow-sm`)
    * **If not selected (qty == 0):** A single round pink `[+]` button (`w-8 h-8 rounded-full bg-[#ffd9e4] text-[#805062] hover:bg-brand-pink/30 active:scale-90 transition-transform flex items-center justify-center shadow-sm cursor-pointer border-none`).
* Remove unnecessary margin/padding to make the layout tight.

---

## Verification Plan

### Manual Verification
1. **Unselected State:** Open the Order page. Verify that product cards display the price on the left and a pink `[+]` button on the bottom right.
2. **Selected State:** Tap the `[+]` button on a product card. Verify that the pink `[+]` button transitions into a vertical control stack (`[+]`, qty, `[-]`) next to the price.
3. **Quantity Increment/Decrement:** Verify that clicking the vertical `[+]` increases quantity, and `[-]` decreases quantity. When quantity reaches 0, verify the controls return to the single pink `[+]` button.
4. **Layout Check:** Verify that the overall height of the cards is reduced and matches the compact design.
