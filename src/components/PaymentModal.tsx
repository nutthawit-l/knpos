import { Banknote, Loader2 } from 'lucide-react';
import MascotLogo from './MascotLogo';

export interface PaymentItem {
  readonly id: number;
  readonly name: string;
  readonly quantity: number;
  readonly pricePerUnit: number;
}

export interface PaymentModalProps {
  readonly isOpen: boolean;
  readonly items: readonly PaymentItem[];
  readonly currencySymbol: string;
  readonly isLoading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly onEdit: () => void;
}

export default function PaymentModal({
  isOpen,
  items,
  currencySymbol,
  isLoading,
  onConfirm,
  onCancel,
  onEdit,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  const tax = subtotal * 0.07;
  const totalAmount = subtotal + tax;

  return (
    <div className="absolute inset-0 bg-text-brown/40 backdrop-blur-xs flex items-end justify-center z-50 rounded-[24px]">
      <div className="relative w-full rounded-t-[24px] shadow-2xl overflow-visible max-h-[85%] flex flex-col border-t border-outline-warm/30 font-quicksand bg-pattern">
        
        {/* Mascot Clerk Speech & Logo */}
        <div className="absolute -top-16 left-5 z-50 pointer-events-none">
          <div className="relative floating-animation flex items-end gap-3">
            <MascotLogo
              sizeClassName="w-20 h-20"
              className="border-4 border-white shadow-md"
            />
            <div className="bg-white px-3.5 py-2 rounded-2xl rounded-bl-none shadow-md border border-outline-warm/50 mb-1">
              <p className="text-text-brown font-bold text-[12px] leading-tight whitespace-nowrap">
                Ready to checkout!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-10 pb-4 border-b border-outline-warm/30 text-center shrink-0">
          <h2 className="text-[20px] font-bold text-text-brown leading-snug">
            Order Summary
          </h2>
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar">
          {items.map((item) => {
            const itemTotal = item.pricePerUnit * item.quantity;
            return (
              <div key={item.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-text-brown font-bold text-[14px] truncate">
                      {item.name}
                    </p>
                    <p className="text-surface-variant-custom/75 text-[12px] font-medium mt-0.5">
                      {item.quantity} x {currencySymbol}{item.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-text-brown font-bold text-[14px]">
                      {currencySymbol}{itemTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-outline-warm/20" />
              </div>
            );
          })}
        </div>

        {/* Totals & Actions Section */}
        <div className="bg-pink-container/30 px-6 py-6 rounded-t-[24px] border-t border-outline-warm/40 shrink-0">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-surface-variant-custom/80 text-[14px] font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-text-brown">
                {currencySymbol}{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-surface-variant-custom/80 text-[14px] font-medium">
              <span>Tax (7%)</span>
              <span className="font-bold text-text-brown">
                {currencySymbol}{tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-outline-warm/50">
              <span className="text-text-brown font-bold text-[16px]">Total Amount</span>
              <div className="text-right">
                <span className="text-primary font-bold text-[22px]">
                  {currencySymbol}{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full h-12 bg-brand-pink hover:bg-brand-pink-hover text-text-brown font-bold uppercase rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM PAYMENT</span>
                  <Banknote className="w-5 h-5 text-text-brown" />
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="py-2 px-4 text-destructive font-bold text-[14px] hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent active:scale-98"
              >
                Cancel
              </button>
              <span className="text-text-brown/20 select-none">|</span>
              <button
                type="button"
                onClick={onEdit}
                disabled={isLoading}
                className="py-2 px-4 text-text-brown/60 font-bold text-[14px] hover:text-text-brown transition-colors cursor-pointer border-none bg-transparent active:scale-98"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
