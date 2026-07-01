# Design Spec: Dashboard Summary Section Calculation

This document outlines the design and calculations for displaying real data in the dashboard summary (Bento grid) section instead of mock values.

## Context
The POS dashboard displays a "Shop Summary" bento grid at the top when there is at least one ended event. The data in this grid was previously mocked inside `src/data/mockData.ts` as `DASHBOARD2_DATA`. This spec details how to compute these values dynamically using the existing `events` array state.

## Proposed Changes

### Summary Calculations
We will calculate the statistics directly in the `Dashboard` component from the `events` list returned by the `/api/event` API.

#### 1. Currency Symbols
We will use the existing `CURRENCY_SYMBOLS` mapping in `Dashboard.tsx` to resolve event currency symbols based on `event.country`:
- `Thailand` -> `฿`
- `Singapore` -> `S$`
- `USA` -> `$`
- `Japan` -> `¥`

#### 2. Metrics & Calculation Formulae
- **Total Sales**: Sum of `totalSales` for all events. Since events can be across multiple currencies/countries, we group the totals by currency symbol and format them combined (e.g., `฿142,500 + S$2,400`).
- **Active Shops**: Count of events currently in-progress (`status === 'inprogress'`).
- **Events this Year**: Count of events whose `startDate` falls in the current calendar year.
- **Trend/Subtext**: Displays the sum of net profits grouped by currency, followed by the overall profit margin percentage:
  $$\text{Margin \%} = \left(\frac{\text{Total Net Profit}}{\text{Total Sales}}\right) \times 100$$
  Example output format: `+฿45,200 (+31.7% margin)`.

### Files to Modify
- [Dashboard.tsx](file:///home/tie/Projects/knpos/src/pages/Dashboard.tsx)

## Verification Plan
1. Ensure the dashboard loads without errors.
2. Confirm the Bento Grid summary calculations display matching values against individual events listed below.
3. Validate formatting of mixed currencies if multiple events exist with different countries.
