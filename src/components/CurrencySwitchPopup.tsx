import { Check } from 'lucide-react';
import { currencies, type Currency } from '../types/currency';

interface CurrencySwitchPopupProps {
  selectedCode: string;
  onSelect: (currency: Currency) => void;
  onClose: () => void;
}

export default function CurrencySwitchPopup({
  selectedCode,
  onSelect,
  onClose,
}: CurrencySwitchPopupProps) {
  return (
    <>
      {/* Invisible backdrop to handle closing when clicking outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      <div 
        className="absolute right-0 top-full mt-2 bg-white rounded-[16px] w-[240px] overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.1)] z-50 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-bold text-foreground text-[14px]">Select Currency</h2>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {currencies.map((currency) => {
            const isSelected = currency.code === selectedCode;
            return (
              <button
                key={currency.code}
                onClick={() => {
                  onSelect(currency);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isSelected ? 'bg-primary-light' : 'hover:bg-surface'
                }`}
              >
                <span className="text-xl shrink-0 grayscale-[0.2]">{currency.flag}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-bold text-foreground text-[13px] leading-tight">
                    {currency.code}
                  </p>
                  <p className="text-foreground-subtle text-[10px] truncate">
                    {currency.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-[12px] ${isSelected ? 'text-foreground' : 'text-gray-400'}`}>
                    {currency.symbol}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
