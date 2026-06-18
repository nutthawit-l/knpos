import { create } from 'zustand';
import { currencies, type Currency } from '../types/currency';

interface OrderState {
  quantities: Record<number, number>; // productId -> quantity
  selectedCurrency: Currency;
  hasEvent: boolean;
  activeEventId: number | null;
  activeEventName: string | null;
  setHasEvent: (hasEvent: boolean) => void;
  setActiveEvent: (id: number | null, name: string | null) => void;
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
  activeEventId: localStorage.getItem('active_event_id') ? Number(localStorage.getItem('active_event_id')) : null,
  activeEventName: localStorage.getItem('active_event_name') || null,
  
  setHasEvent: (hasEvent) => {
    localStorage.setItem('has_event', String(hasEvent));
    set({ hasEvent });
  },

  setActiveEvent: (id, name) => {
    if (id !== null) {
      localStorage.setItem('active_event_id', String(id));
    } else {
      localStorage.removeItem('active_event_id');
    }
    if (name !== null) {
      localStorage.setItem('active_event_name', name);
    } else {
      localStorage.removeItem('active_event_name');
    }
    set({ activeEventId: id, activeEventName: name });
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
