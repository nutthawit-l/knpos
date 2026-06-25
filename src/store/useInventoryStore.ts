import { create } from 'zustand';

interface InventoryState {
  shopId: number | null;
  fetchShopId: (userId?: number) => Promise<void>;
  setShopId: (shopId: number | null) => void;
  firstProductId: number | null;
  stocks: Record<number, number>; // productId -> local quantity
  originalStocks: Record<number, number>; // productId -> db quantity
  setStock: (productId: number, stock: number) => void;
  incrementStock: (productId: number) => void;
  decrementStock: (productId: number) => void;
  initializeStocks: (products: Array<{ id: number; stock: number }>) => void;
  saveStockChanges: () => Promise<boolean>;
  hasStockChanges: () => boolean;
  hasFirstProduct: boolean;
  checkFirstProduct: () => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  stocks: {},
  originalStocks: {},
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
        [productId]: (state.stocks[productId] !== undefined ? state.stocks[productId] : 0) + 1,
      },
    })),
  decrementStock: (productId) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productId]: Math.max(0, (state.stocks[productId] !== undefined ? state.stocks[productId] : 0) - 1),
      },
    })),
  initializeStocks: (products) =>
    set(() => {
      const newStocks: Record<number, number> = {};
      const originalStocks: Record<number, number> = {};
      products.forEach((p) => {
        newStocks[p.id] = p.stock;
        originalStocks[p.id] = p.stock;
      });
      return { stocks: newStocks, originalStocks };
    }),
  hasStockChanges: () => {
    const { stocks, originalStocks } = get();
    return Object.keys(stocks).some(
      (id) => stocks[Number(id)] !== originalStocks[Number(id)]
    );
  },
  saveStockChanges: async () => {
    const { stocks, originalStocks } = get();
    const modifiedStocks: Record<number, number> = {};
    Object.keys(stocks).forEach((idStr) => {
      const id = Number(idStr);
      if (stocks[id] !== originalStocks[id]) {
        modifiedStocks[id] = stocks[id];
      }
    });

    if (Object.keys(modifiedStocks).length === 0) return true;

    try {
      const res = await fetch('/api/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: modifiedStocks }),
      });
      if (res.ok) {
        set((state) => ({
          originalStocks: { ...state.originalStocks, ...modifiedStocks },
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to save stocks:', err);
    }
    return false;
  },
}));
