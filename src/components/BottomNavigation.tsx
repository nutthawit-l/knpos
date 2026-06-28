import { ShoppingCart, History, Package, Settings } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';

export interface BottomNavigationProps {
  readonly activeTab?: string;
  readonly onNavigate?: (tab: string) => void;
}

export default function BottomNavigation({
  activeTab = '',
  onNavigate,
}: BottomNavigationProps) {
  const hasEvent = useOrderStore((state) => state.hasEvent);

  return (
    <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#fcf1f2] border-t border-outline-warm/30 shadow-[0_-2px_10px_rgba(78,52,46,0.05)] rounded-t-2xl">
      <button
        disabled={!hasEvent}
        onClick={() => hasEvent && onNavigate?.('order')}
        className={`flex flex-col items-center justify-center transition-all border-none ${
          !hasEvent
            ? 'opacity-40 cursor-not-allowed px-5 py-1 text-[#504447]'
            : activeTab === 'order'
            ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1 cursor-pointer'
            : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80 cursor-pointer'
        }`}
      >
        <ShoppingCart
          className={`w-5 h-5 mb-0.5 ${
            !hasEvent
              ? 'text-[#504447]'
              : activeTab === 'order'
              ? 'text-[#76485a]'
              : 'text-[#504447]'
          }`}
        />
        <span className="text-[12px] font-bold">Order</span>
      </button>

      <button
        disabled={!hasEvent}
        onClick={() => hasEvent && onNavigate?.('transactions')}
        className={`flex flex-col items-center justify-center transition-all border-none ${
          !hasEvent
            ? 'opacity-40 cursor-not-allowed px-5 py-1 text-[#504447]'
            : activeTab === 'transactions'
            ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1 cursor-pointer'
            : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80 cursor-pointer'
        }`}
      >
        <History
          className={`w-5 h-5 mb-0.5 ${
            !hasEvent
              ? 'text-[#504447]'
              : activeTab === 'transactions'
              ? 'text-[#76485a]'
              : 'text-[#504447]'
          }`}
        />
        <span className="text-[12px] font-bold">Transaction</span>
      </button>

      <button
        onClick={() => onNavigate?.('products')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer border-none ${
          activeTab === 'products'
            ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1'
            : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80'
        }`}
      >
        <Package
          className={`w-5 h-5 mb-0.5 ${
            activeTab === 'products' ? 'text-[#76485a]' : 'text-[#504447]'
          }`}
        />
        <span className="text-[12px] font-bold">Inventory</span>
      </button>

      <button
        onClick={() => onNavigate?.('settings')}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer border-none ${
          activeTab === 'settings'
            ? 'bg-[#f8bbd0] text-[#76485a] rounded-full px-5 py-1'
            : 'bg-transparent text-[#504447] px-5 py-1 hover:opacity-80'
        }`}
      >
        <Settings
          className={`w-5 h-5 mb-0.5 ${
            activeTab === 'settings' ? 'text-[#76485a]' : 'text-[#504447]'
          }`}
        />
        <span className="text-[12px] font-bold">Settings</span>
      </button>
    </nav>
  );
}
