# Design Spec: Disable Number Input Spinners and Scroll-to-Change Value

## Context
In the mobile POS application, touchpad or mouse wheel scrolling on focused numeric input boxes (specifically Stock Quantity and Price) causes the input value to decrease or increase unintentionally. We want to remove the up/down spin buttons (arrows) and prevent the wheel scrolling from modifying input values.

## Proposed Changes

### Global CSS (`src/index.css`)
Hide Webkit and Firefox spin buttons for all `input[type="number"]` inputs.

```css
/* Hide number input spinners globally */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
```

### Shared Input Components
Update [FormInput](file:///home/tie/Projects/knpos/src/components/FormInput.tsx) and [TextInput](file:///home/tie/Projects/knpos/src/components/TextInput.tsx) to blur the input when `wheel` events are fired, preventing scroll value changes:
```tsx
onWheel={(e) => type === 'number' && e.currentTarget.blur()}
```

### Product Pages
For raw `<input type="number">` elements representing multi-currency prices, add:
```tsx
onWheel={(e) => e.currentTarget.blur()}
```
This applies to:
* [AddProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddProduct.tsx)
* [AddFirstProduct.tsx](file:///home/tie/Projects/knpos/src/pages/AddFirstProduct.tsx)

## Verification
1. Run a build check (`pnpm build`) to ensure TypeScript compilation passes.
2. Manually verify in the UI that spin buttons are hidden and scrolling no longer adjusts values.
