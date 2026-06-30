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
