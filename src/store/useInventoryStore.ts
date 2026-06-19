import { create } from 'zustand';

interface InventoryState {
  shopId: number | null;
  fetchShopId: (userId?: number) => Promise<void>;
  setShopId: (shopId: number | null) => void;
  firstProductId: number | null;
  stocks: Record<number, number>; // productId -> quantity
  setStock: (productId: number, stock: number) => void;
  incrementStock: (productId: number) => void;
  decrementStock: (productId: number) => void;
  initializeStocks: (productIds: number[]) => void;
  hasFirstProduct: boolean;
  checkFirstProduct: () => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stocks: {},
  hasFirstProduct: false,
  shopId: null,
  firstProductId: null,
  fetchShopId: async (userId) => {
    fetch(`/api/shop?user_id=${userId}&limit=1&fields=id`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exists) {
          set({ shopId: data.shop_id });
        }
      })
      .catch((err) => console.error('Failed to query shop member:', err));
  },
  setShopId: (shopId) => set({ shopId }),
  checkFirstProduct: async () => {
    try {
      const res = await fetch('/api/product');
      if (res.ok) {
        const data = await res.json();
        const has = Array.isArray(data) && data.length > 0;
        set({ hasFirstProduct: has });
        return has;
      }
    } catch (err) {
      console.error('Failed to check product:', err);
    }
    return false;
  },
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
