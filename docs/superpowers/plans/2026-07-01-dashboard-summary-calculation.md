# Dashboard Summary Section Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the summary section in the Dashboard page to show real calculated values instead of mockup data.

**Architecture:** Calculate Total Sales, Active Shops (in-progress events), Events this Year, and overall Net Profit Margin directly in `src/pages/Dashboard.tsx` from the existing `events` state, then display these values in the Bento Grid cards.

**Tech Stack:** React, TypeScript, Tailwind CSS

## Global Constraints
- Follow standard Vite project structure.
- Follow ESLint and Prettier standards.
- Keep pull requests small and focused.

---

### Task 1: Calculate and Display Summary Statistics in Dashboard.tsx

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `events` array state from `/api/event` call.
- Produces: Dynamically rendered text elements in the Bento grid cards.

- [ ] **Step 1: Implement summary calculation logic in Dashboard.tsx**

Modify `src/pages/Dashboard.tsx` around line 156 (before the `return` statement) to compute the metrics:

```typescript
  // 1. Group sales and profit by currency symbols
  const salesByCurrency: Record<string, number> = {};
  const profitByCurrency: Record<string, number> = {};
  let totalSalesSum = 0;
  let totalProfitSum = 0;
  let activeShopsCount = 0;
  let eventsThisYearCount = 0;

  const currentYearStr = new Date().getFullYear().toString();

  events.forEach((event) => {
    const currency = CURRENCY_SYMBOLS[event.country] || '฿';

    // Sum total sales and net profit grouped by currency
    salesByCurrency[currency] = (salesByCurrency[currency] || 0) + event.totalSales;
    profitByCurrency[currency] = (profitByCurrency[currency] || 0) + event.netProfit;

    totalSalesSum += event.totalSales;
    totalProfitSum += event.netProfit;

    // Count active shops (in-progress events)
    if (event.status === 'inprogress') {
      activeShopsCount++;
    }

    // Count events this year
    if (event.startDate && event.startDate.startsWith(currentYearStr)) {
      eventsThisYearCount++;
    }
  });

  // Helper to format currency totals (e.g. "฿142,500 + S$2,400")
  const formatCurrencyMap = (map: Record<string, number>) => {
    const entries = Object.entries(map);
    if (entries.length === 0) return '฿0';
    return entries
      .map(([sym, value]) => `${sym}${value.toLocaleString()}`)
      .join(' + ');
  };

  // Helper to format profit totals (e.g. "+฿45,200 + -S$150")
  const formatProfitCurrencyMap = (map: Record<string, number>) => {
    const entries = Object.entries(map);
    if (entries.length === 0) return '฿0';
    return entries
      .map(([sym, value]) => {
        const isLoss = value < 0;
        return `${isLoss ? '-' : '+'}${sym}${Math.abs(value).toLocaleString()}`;
      })
      .join(' + ');
  };

  const totalSalesValue = formatCurrencyMap(salesByCurrency);
  
  // Calculate overall margin percentage
  const marginPercent = totalSalesSum > 0 ? (totalProfitSum / totalSalesSum) * 100 : 0;
  const formattedMargin = `${marginPercent >= 0 ? '+' : ''}${marginPercent.toFixed(1)}% margin`;
  const profitStr = formatProfitCurrencyMap(profitByCurrency);
  const totalSalesTrend = `${profitStr} (${formattedMargin})`;
```

- [ ] **Step 2: Update Bento grid card values in Dashboard.tsx**

Replace the mock values inside the Shop Summary Section bento grid:
- Replace `{DASHBOARD2_DATA.totalSalesValue}` with `{totalSalesValue}`.
- Replace `{DASHBOARD2_DATA.totalSalesTrend}` with `{totalSalesTrend}`.
- Replace `{DASHBOARD2_DATA.activeShopsValue}` with `{activeShopsCount}`.
- Replace `{DASHBOARD2_DATA.eventsYearValue}` with `{eventsThisYearCount}`.

- [ ] **Step 3: Verify with linter and production build**

Run linting check:
```bash
pnpm lint
```
Expected output: No lint errors in modified files.

Run production build check:
```bash
pnpm build
```
Expected output: Successful build with no TypeScript/Vite compilation errors.

- [ ] **Step 4: Commit changes**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): show real calculated values in summary section"
```
