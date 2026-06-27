# Fixed Event Currency Implementation Plan

Lock the POS application's currency to the country of the active/in-progress event, replacing the interactive currency selector with a static display-only currency indicator.

## Proposed Changes

### Shared Types & Hooks

#### [MODIFY] [currency.ts](file:///home/tie/Projects/knpos/src/types/currency.ts)
* Move and export `COUNTRY_CURRENCY_MAP` from `src/hooks/useCreateEventForm.ts` to `src/types/currency.ts` to share it between event creation and layout mount synchronization.
```typescript
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Thailand': 'THB',
  'Singapore': 'SGD',
  'USA': 'USD',
  'Japan': 'JPY',
};
```

#### [MODIFY] [useCreateEventForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateEventForm.ts)
* Import `COUNTRY_CURRENCY_MAP` from `src/types/currency.ts` instead of defining it locally:
```typescript
import { currencies, COUNTRY_CURRENCY_MAP } from '../types/currency';
```

### Layout & Page Synchronization

#### [MODIFY] [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
* Update the active event fetching effect:
  * Extract the `country` field from the active in-progress event.
  * Map `country` to the corresponding currency code using `COUNTRY_CURRENCY_MAP`.
  * Find the currency object and call `setCurrency` from `useOrderStore` to automatically set the currency to the active event's currency.
  * This guarantees that if a user reloads the application, the currency is correctly restored from the active event in the database.
```typescript
        const events = data as Array<{ id: number; name: string; country: string; status: string }>;
        const activeEvent = events.find((e) => e.status === 'inprogress');
        if (activeEvent) {
          setHasEvent(true);
          setActiveEvent(activeEvent.id, activeEvent.name);
          
          // Sync currency with active event's country
          const currencyCode = COUNTRY_CURRENCY_MAP[activeEvent.country] || 'THB';
          const matchedCurrency = currencies.find((c) => c.code === currencyCode);
          if (matchedCurrency) {
            useOrderStore.getState().setCurrency(matchedCurrency);
          }
        } else {
```

### Components & Pages

#### [NEW] [EventCurrencyIndicator.tsx](file:///home/tie/Projects/knpos/src/components/EventCurrencyIndicator.tsx)
* Implement a display-only indicator component.
* Reads the current active currency from `useOrderStore`.
* Styled to look like a static pill badge (using `div` instead of `button`, no hover/focus states, neutral/muted theme, no pointer cursor) indicating it is read-only.
```tsx
import { useOrderStore } from '../store/useOrderStore';

export default function EventCurrencyIndicator() {
  const { selectedCurrency } = useOrderStore();

  return (
    <div className='flex items-center gap-1.5 bg-[#f6ebed] rounded-full px-3 py-1.5 text-[11px] font-bold text-text-brown select-none border border-outline-warm/25'>
      <span className='w-3.5 h-3.5 rounded-full bg-[#805062] flex items-center justify-center text-[9px] text-white font-bold'>
        {selectedCurrency.symbol}
      </span>
      <span>{selectedCurrency.code}</span>
    </div>
  );
}
```

#### [MODIFY] [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)
* Replace the `CurrencySortControls` component with the new static `EventCurrencyIndicator`.
```tsx
import EventCurrencyIndicator from '../components/EventCurrencyIndicator';
...
        {/* Categories header with Currency switcher */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[12px] font-bold uppercase tracking-wider text-text-brown opacity-60 pl-2">Categories</span>
          <EventCurrencyIndicator />
        </div>
```

#### [MODIFY] [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
* Replace the `CurrencySortControls` component with the new static `EventCurrencyIndicator`.
```tsx
import EventCurrencyIndicator from '../components/EventCurrencyIndicator';
...
          {/* Currency Switcher Row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-text-brown opacity-60">
              Overview
            </span>
            <EventCurrencyIndicator />
          </div>
```

---

## Verification Plan

### Automated Tests
- Run `pnpm build` to verify type checking and compilation.

### Manual Verification
1. **Event Creation:** Start an event in Singapore. Verify that the app sets the currency to SGD.
2. **Order Page:** Verify that the Order page displays the static `SGD` pill indicator. Verify that clicking on it does not open a popup and that it has no hover/pointer effects.
3. **Transactions Page:** Verify that the Transactions page displays the static `SGD` pill indicator.
4. **Persistency / Reload:** Reload the page while on the Order page. Verify that the active currency remains `SGD`.
5. **Event in Thailand:** End the event or start a new event in Thailand. Verify that the currency switches to `THB`.
