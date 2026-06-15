import { ShoppingBag, Loader2 } from 'lucide-react';

interface ConfirmOrderModalProps {
  totalItems: number;
  totalPrice: number;
  currencySymbol: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmOrderModal({
  totalItems,
  totalPrice,
  currencySymbol,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmOrderModalProps) {
  return (
    <div className='absolute inset-0 bg-black/45 flex items-center justify-center z-50 px-6 rounded-[24px]'>
      <div className='bg-white rounded-2xl w-full max-w-[327px] overflow-hidden flex flex-col'>
        <div className='pt-8 pb-4 px-6 flex flex-col items-center'>
          <div className='bg-primary-light rounded-full w-14 h-14 flex items-center justify-center mb-4 shrink-0'>
            <ShoppingBag className='w-6 h-6 text-primary' />
          </div>
          <h2 className='font-bold text-lg text-foreground leading-snug mb-1'>
            Confirm Order
          </h2>
          <p className='text-[#6b7280] text-[13px]'>Add order to event AFA</p>
        </div>

        <div className='border-y border-gray-100 py-4 px-6 flex flex-col gap-3'>
          <div className='flex justify-between items-center w-full'>
            <span className='text-[#6b7280] text-[13px]'>Total Items</span>
            <span className='font-semibold text-foreground text-[13px]'>
              {totalItems}
            </span>
          </div>
          <div className='flex justify-between items-center w-full'>
            <span className='text-[#6b7280] text-[13px]'>Total Price</span>
            <span className='font-semibold text-foreground text-[13px]'>
              {currencySymbol}{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className='p-5 flex gap-3 w-full'>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-foreground font-semibold text-sm text-center disabled:opacity-70'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 bg-primary rounded-xl py-2.5 text-white font-semibold text-sm text-center flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
