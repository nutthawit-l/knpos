import { create } from 'zustand';
import { currencies, type Currency } from '../types/currency';

interface OrderState {
  quantities: Record<number, number>; // productId -> quantity
  selectedCurrency: Currency;
  hasEvent: boolean;
  setHasEvent: (hasEvent: boolean) => void;
  setCurrency: (currency: Currency) => void;
  incrementItem: (productId: number) => void;
  decrementItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  quantities: {},
  selectedCurrency: currencies.find((c) => c.code === 'THB') || currencies[0],
  hasEvent: localStorage.getItem('has_event') === 'true',
  
  setHasEvent: (hasEvent) => {
    localStorage.setItem('has_event', String(hasEvent));
    set({ hasEvent });
  },
  
  setCurrency: (currency) => set({ selectedCurrency: currency }),
  
  incrementItem: (productId) =>
    set((state) => ({
      quantities: {
        ...state.quantities,
        [productId]: (state.quantities[productId] || 0) + 1,
      },
    })),
    
  decrementItem: (productId) =>
    set((state) => {
      const current = state.quantities[productId] || 0;
      const newQuantities = { ...state.quantities };
      if (current <= 1) {
        delete newQuantities[productId];
      } else {
        newQuantities[productId] = current - 1;
      }
      return { quantities: newQuantities };
    }),
    
  removeItem: (productId) =>
    set((state) => {
      const newQuantities = { ...state.quantities };
      delete newQuantities[productId];
      return { quantities: newQuantities };
    }),
    
  clearOrder: () => set({ quantities: {} }),
}));
