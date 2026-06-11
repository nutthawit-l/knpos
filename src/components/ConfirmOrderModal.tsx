import { ShoppingBag } from 'lucide-react';

interface ConfirmOrderModalProps {
  totalItems: number;
  totalPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmOrderModal({
  totalItems,
  totalPrice,
  onConfirm,
  onCancel,
}: ConfirmOrderModalProps) {
  return (
    <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-50 px-6 rounded-[24px]">
      <div className="bg-white rounded-2xl w-full max-w-[327px] overflow-hidden flex flex-col">
        <div className="pt-8 pb-4 px-6 flex flex-col items-center">
          <div className="bg-[#fef3e8] rounded-full w-14 h-14 flex items-center justify-center mb-4 shrink-0">
            <ShoppingBag className="w-6 h-6 text-[#f47b20]" />
          </div>
          <h2 className="font-bold text-lg text-[#1c1c1e] leading-snug mb-1">
            Confirm Order
          </h2>
          <p className="text-[#6b7280] text-[13px]">Add order to event AFA</p>
        </div>

        <div className="border-y border-gray-100 py-4 px-6 flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <span className="text-[#6b7280] text-[13px]">Total Items</span>
            <span className="font-semibold text-[#1c1c1e] text-[13px]">
              {totalItems}
            </span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span className="text-[#6b7280] text-[13px]">Total Price</span>
            <span className="font-semibold text-[#1c1c1e] text-[13px]">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-5 flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-[#1c1c1e] font-semibold text-sm text-center"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#f47b20] rounded-xl py-2.5 text-white font-semibold text-sm text-center"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
