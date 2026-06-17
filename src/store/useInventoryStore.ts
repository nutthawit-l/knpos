import { create } from 'zustand';

interface InventoryState {
  stocks: Record<number, number>; // productId -> quantity
  setStock: (productId: number, stock: number) => void;
  incrementStock: (productId: number) => void;
  decrementStock: (productId: number) => void;
  initializeStocks: (productIds: number[]) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stocks: {},
  setStock: (productId, stock) =>
    set((state) => ({
      stocks: { ...state.stocks, [productId]: Math.max(0, stock) },
    })),
  incrementStock: (productId) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productId]: (state.stocks[productId] !== undefined ? state.stocks[productId] : 10) + 1,
      },
    })),
  decrementStock: (productId) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productId]: Math.max(0, (state.stocks[productId] !== undefined ? state.stocks[productId] : 10) - 1),
      },
    })),
  initializeStocks: (productIds) =>
    set((state) => {
      const newStocks = { ...state.stocks };
      productIds.forEach((id) => {
        if (newStocks[id] === undefined) {
          // Determinstic initial stock based on ID to match Stitch design mockups
          if (id === 1) newStocks[id] = 24;
          else if (id === 2) newStocks[id] = 8;
          else if (id === 3) newStocks[id] = 0;
          else if (id === 4) newStocks[id] = 42;
          else {
            // Formulaic deterministic seed: (id * 7) % 35
            newStocks[id] = (id * 7) % 35;
          }
        }
      });
      return { stocks: newStocks };
    }),
}));
