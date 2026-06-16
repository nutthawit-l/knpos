import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import CurrencySwitchPopup from './CurrencySwitchPopup';
import { type Currency } from '../types/currency';

interface CurrencySortControlsProps {
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
}

export default function CurrencySortControls({
  selectedCurrency,
  onSelectCurrency,
}: CurrencySortControlsProps) {
  const [isCurrencyPopupOpen, setIsCurrencyPopupOpen] = useState(false);

  return (
    <div className='flex items-center gap-3 text-gray-500 relative'>
      <button>
        <ArrowUpDown className='w-4 h-4' />
      </button>
      <button
        className='flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-surface'
        onClick={() => setIsCurrencyPopupOpen(true)}
      >
        <span className='w-3 h-3 rounded-full border border-primary flex items-center justify-center text-[8px]'>
          {selectedCurrency.symbol}
        </span>
        {selectedCurrency.code}
      </button>

      {isCurrencyPopupOpen && (
        <CurrencySwitchPopup
          selectedCode={selectedCurrency.code}
          onSelect={onSelectCurrency}
          onClose={() => setIsCurrencyPopupOpen(false)}
        />
      )}
    </div>
  );
}
