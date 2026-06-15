import { useState, useRef, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { type Currency } from './CurrencySwitchPopup';

interface SwipeableProductRowProps {
  product: any;
  selectedCurrency: Currency;
  price: number;
  onEdit: () => void;
  onDelete: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isLast: boolean;
}

export default function SwipeableProductRow({
  product,
  selectedCurrency,
  price,
  onEdit,
  onDelete,
  isOpen,
  onOpen,
  onClose,
  isLast,
}: SwipeableProductRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentOffsetX = useRef(0);

  const buttonWidth = 140; // 2 buttons * 70px each
  const threshold = 80;

  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0);
      currentOffsetX.current = 0;
    } else {
      setOffsetX(buttonWidth);
      currentOffsetX.current = buttonWidth;
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const deltaX = startX.current - e.touches[0].clientX;
    
    // Calculate new offset based on direction and state
    let newOffset = currentOffsetX.current + deltaX;

    // Prevent swiping right past 0
    if (newOffset < 0) {
      newOffset = 0;
    }
    // Limit left swipe to slightly past the button width (resistance)
    if (newOffset > buttonWidth) {
      newOffset = buttonWidth + (newOffset - buttonWidth) * 0.3;
    }

    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (offsetX > threshold) {
      // Snap open
      setOffsetX(buttonWidth);
      currentOffsetX.current = buttonWidth;
      onOpen();
    } else {
      // Snap closed
      setOffsetX(0);
      currentOffsetX.current = 0;
      onClose();
    }
  };

  return (
    <div className="relative w-full overflow-hidden select-none shrink-0">
      {/* Underlay (Actions) */}
      <div 
        className="absolute top-0 bottom-0 right-0 flex items-center z-0 animate-none"
        style={{ width: `${buttonWidth}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-[70px] h-full bg-[#f47b20] text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors active:bg-[#d46510]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-[70px] h-full bg-red-500 text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors active:bg-red-600"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* Overlay (Product Content) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex items-center gap-3 px-4 py-3 bg-white relative z-10 select-none ${
          !isSwiping ? 'transition-transform duration-200 ease-out' : ''
        } ${!isLast ? 'border-b border-gray-100' : ''}`}
        style={{
          transform: `translateX(-${offsetX}px)`,
        }}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            draggable="false"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="font-semibold text-foreground text-[13px] truncate">
            {product.name}
          </span>
          <span className="text-gray-400 text-[11px] font-normal">
            PRD-{String(product.id).padStart(3, '0')}
          </span>
        </div>
        <span className="font-semibold text-foreground text-[13px]">
          {selectedCurrency.symbol}
          {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
