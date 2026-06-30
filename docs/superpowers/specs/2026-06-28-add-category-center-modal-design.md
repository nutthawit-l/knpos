# Center Category Modal Design Spec

This specification details the changes required to refactor the Add Category modal in `AddProduct.tsx` from an inline absolute-positioned dropdown into a centered, premium mobile-friendly overlay modal.

## 1. UX Design & Positioning
*   **Behavior**: When clicking the "+" button next to the category tag pills, a modal overlay will appear in the center of the mobile screen.
*   **Positioning**: 
    *   The modal will use `absolute inset-0 z-50 flex items-center justify-center p-6 bg-text-brown/40 backdrop-blur-xs` to overlay the entire page.
    *   This keeps the modal contained within the page's relative container (maintaining the mobile frame layout on desktop screens).
*   **Aesthetics**: 
    *   The backdrop will use the theme's brown color overlay (`bg-text-brown/40`) with a subtle blur effect (`backdrop-blur-xs`).
    *   The modal card will feature rounded corners (`rounded-[24px]`), card pattern background (`bg-pattern`), close button (`X` icon), input field, and two actions: "Cancel" and "Add Category".

## 2. Code Modifications

### [src/pages/AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx)

*   **Move JSX**: Move the category modal markup out of the nested `div` near the `Plus` button and place it at the root of the returned page markup (as a sibling to the main header/form layout) to prevent overflow or relative positioning issues.
*   **Markup Refinement**:
    *   Update the outer modal container to:
        ```tsx
        {isAddCategoryModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-text-brown/40 backdrop-blur-xs">
            <div 
              className="absolute inset-0 cursor-default"
              onClick={() => setIsAddCategoryModalOpen(false)}
            />
            <div 
              className="relative bg-white rounded-[24px] w-full max-w-[320px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] z-10 border border-outline-warm/20 p-6 flex flex-col gap-4 bg-pattern"
              onClick={(e) => e.stopPropagation()}
            >
              ...
            </div>
          </div>
        )}
        ```
    *   Ensure the inputs and buttons match the app's established design system.

## 3. Verification Plan
*   **Manual Verification**:
    1. Open the "Add Product" page.
    2. Click the "+" button next to the Category tag list.
    3. Verify that the modal appears in the center of the mobile container with a blurred backdrop.
    4. Verify that clicking the backdrop or the "Cancel" / "X" buttons closes the modal.
    5. Enter a valid category name and click "Add Category" - verify that the category is added, selected, and the modal closes.
