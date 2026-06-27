# Design Spec: Fixed Event Currency in Order and Transaction Pages

Lock the POS application's currency to the country of the active/in-progress event. Replace the interactive currency switcher dropdown (`CurrencySortControls`) with a read-only currency indicator badge (`EventCurrencyIndicator`) on the Order and Transactions pages.

## User Review Required

> [!NOTE]
> The **Inventory** page (`src/pages/Inventory.tsx`) does not have a currency selector by default and is unaffected by this change.

## Proposed Changes

### Component & Types

#### [MODIFY] [currency.ts](file:///home/tie/Projects/knpos/src/types/currency.ts)
* Move and export `COUNTRY_CURRENCY_MAP` from `src/hooks/useCreateEventForm.ts` to `src/types/currency.ts` to share it between event creation and layout mount synchronization.

#### [NEW] [EventCurrencyIndicator.tsx](file:///home/tie/Projects/knpos/src/components/EventCurrencyIndicator.tsx)
* Implement a display-only indicator component.
* Reads the current active currency from `useOrderStore`.
* Styled to look like a static pill badge (using `div` instead of `button`, no hover/focus states, neutral/muted theme, no pointer cursor) indicating it is read-only.

### Application Layout & Pages

#### [MODIFY] [MainLayout.tsx](file:///home/tie/Projects/knpos/src/components/MainLayout.tsx)
* Update the active event fetching effect:
  * Extract the `country` field from the active in-progress event.
  * Map `country` to the corresponding currency code using `COUNTRY_CURRENCY_MAP`.
  * Find the currency object and call `setCurrency` from `useOrderStore` to automatically set the currency to the active event's currency.
  * This guarantees that if a user reloads the application, the currency is correctly restored from the active event in the database.

#### [MODIFY] [useCreateEventForm.ts](file:///home/tie/Projects/knpos/src/hooks/useCreateEventForm.ts)
* Import `COUNTRY_CURRENCY_MAP` from `src/types/currency.ts` instead of defining it locally.

#### [MODIFY] [Order.tsx](file:///home/tie/Projects/knpos/src/pages/Order.tsx)
* Replace the `CurrencySortControls` component with the new static `EventCurrencyIndicator`.

#### [MODIFY] [Transactions.tsx](file:///home/tie/Projects/knpos/src/pages/Transactions.tsx)
* Replace the `CurrencySortControls` component with the new static `EventCurrencyIndicator`.

---

## Verification Plan

### Manual Verification
1. **Event Creation:** Create an event in Singapore. Verify that the app sets the currency to SGD.
2. **Order Page:** Verify that the Order page displays the static `SGD` pill indicator. Verify that clicking on it does not open a popup and that it has no hover/pointer effects.
3. **Transactions Page:** Verify that the Transactions page displays the static `SGD` pill indicator.
4. **Persistency / Reload:** Reload the page while on the Order page. Verify that the active currency remains `SGD`.
5. **Event in Thailand:** End the event or start a new event in Thailand. Verify that the currency switches to `THB`.
