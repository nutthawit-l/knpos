# Design Document: PaymentModal Backdrop Click to Edit Order

Allow the user to click on the skim screen/backdrop overlay of the `PaymentModal` to dismiss the modal and return to the order screen with their selections preserved for editing, matching the "Edit" button behavior.

## Proposed Changes

### [PaymentModal Component](file:///home/tie/Projects/knpos/src/components/PaymentModal.tsx)

Modify the outer container `div` of `PaymentModal` to listen for clicks and trigger `onEdit` when clicked. To prevent the click from triggering when clicking inside the actual modal container, we will stop event propagation on the inner container. We also guard against clicks when `isLoading` is true.

```tsx
export default function PaymentModal({
  isOpen,
  items,
  currencySymbol,
  isLoading,
  onConfirm,
  onCancel,
  onEdit,
}: PaymentModalProps) {
  if (!isOpen) return null;

  // ...
  
  return (
    <div 
      onClick={isLoading ? undefined : onEdit}
      className="absolute inset-0 bg-text-brown/40 backdrop-blur-xs flex items-end justify-center z-50 rounded-[24px] cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-t-[24px] shadow-2xl overflow-visible max-h-[85%] flex flex-col border-t border-outline-warm/30 font-quicksand bg-pattern cursor-default"
      >
        {/* ... */}
      </div>
    </div>
  );
}
```

## Verification Plan

### Manual Verification
1. Open the POS app, add items to the cart, and click **Process Payment**.
2. When the `PaymentModal` appears, click on the semi-transparent backdrop/skim screen area outside the modal card.
3. Verify that the modal closes and the cart selections are preserved, allowing you to edit the order and recommit.
4. Verify that clicking inside the modal card does *not* close it.
5. Verify that during payment processing (`isLoading` is true), clicking the backdrop has no effect.
