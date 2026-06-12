import { useState } from 'react';
import {
  Calendar,
  ChevronRight,
  Plus,
  Minus,
  Check,
  LayoutDashboard,
  Package,
  ReceiptText,
} from 'lucide-react';
import Header from '../components/Header';
import CreateEventModal from '../components/CreateEventModal';
import ConfirmOrderModal from '../components/ConfirmOrderModal';
import { currencies, type Currency } from '../components/CurrencySwitchPopup';
import CurrencySortControls from '../components/CurrencySortControls';

const imgImageCappuccino = "https://www.figma.com/api/mcp/asset/b3f54ed9-1ba6-4554-89ea-f1d21d10dedc";
const imgImageIcedLatte = "https://www.figma.com/api/mcp/asset/74dfc525-2491-46aa-9801-3998de3c8cfe";
const imgImageChocolateCroissant = "https://www.figma.com/api/mcp/asset/d4502458-1117-4ff7-ab83-3edd0960055f";
const imgImageAmericano = "https://www.figma.com/api/mcp/asset/be4fa76b-1408-4a44-b1ff-601932955c0f";
const imgImageBlueberryMuffin = "https://www.figma.com/api/mcp/asset/09a1aa38-1920-4eba-9ca4-193d4abd9631";
const imgImageCaramelMacchiato = "https://www.figma.com/api/mcp/asset/c7c5b1e0-9eb0-4b6d-b1d9-4381156a4ac2";
const imgImageHamSandwich = "https://www.figma.com/api/mcp/asset/7b5609bd-af99-4ac3-af0d-a2b53d88ecc4";
const imgImageGreenTea = "https://www.figma.com/api/mcp/asset/39d4d6fb-b408-453b-b360-5dcf0a383848";
const imgImageVanillaDonut = "https://www.figma.com/api/mcp/asset/5fc86fcd-e257-4bb4-873e-5c858f628db3";
const imgImageEspresso = "https://www.figma.com/api/mcp/asset/db9fcdb0-ab24-4d35-98d1-9b1819a52103";

const products = [
  { id: 1, name: 'Cappuccino', price: '$4.00', image: imgImageCappuccino },
  { id: 2, name: 'Iced Latte', price: '$4.25', image: imgImageIcedLatte },
  { id: 3, name: 'Chocolate Croissant', price: '$3.50', image: imgImageChocolateCroissant },
  { id: 4, name: 'Americano', price: '$3.00', image: imgImageAmericano },
  { id: 5, name: 'Blueberry Muffin', price: '$3.25', image: imgImageBlueberryMuffin },
  { id: 6, name: 'Caramel Macchiato', price: '$4.75', image: imgImageCaramelMacchiato },
  { id: 7, name: 'Ham Sandwich', price: '$5.50', image: imgImageHamSandwich },
  { id: 8, name: 'Green Tea', price: '$2.85', image: imgImageGreenTea },
  { id: 9, name: 'Vanilla Donut', price: '$2.50', image: imgImageVanillaDonut },
  { id: 10, name: 'Espresso', price: '$2.25', image: imgImageEspresso },
];

interface OrderProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}

export default function Order({ onNavigate, onMenuClick }: OrderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies.find((c) => c.code === 'USD') || currencies[0],
  );

  const handleIncrement = (id: number) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const totalCount = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const totalCost = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    const price = parseFloat(product.price.replace('$', ''));
    return sum + (price * qty);
  }, 0);

  return (
    <div className='bg-[#f9fafb] h-dvh overflow-hidden flex justify-center'>
      <div className='bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {isModalOpen && <CreateEventModal onClose={() => setIsModalOpen(false)} />}
        {isConfirmModalOpen && (
          <ConfirmOrderModal
            totalItems={totalCount}
            totalPrice={totalCost}
            onCancel={() => setIsConfirmModalOpen(false)}
            onConfirm={() => {
              setIsConfirmModalOpen(false);
              setQuantities({});
              onNavigate?.('transactions');
            }}
          />
        )}
        
        <Header
          onMenuClick={onMenuClick}
          rightElement={
            <button className='p-1' onClick={() => setIsModalOpen(true)}>
              <Calendar className='w-5 h-5 text-foreground' />
            </button>
          }
        />

        {/* Content */}
        <div className='flex-1 flex flex-col overflow-hidden px-5 pb-[80px] bg-white'>
          {/* Summary Banner */}
          <button 
            className='bg-primary rounded-[14px] w-full px-4 py-3 mb-5 flex items-center justify-between shadow-sm border-none cursor-pointer'
            onClick={() => {
              if (totalCount > 0) setIsConfirmModalOpen(true);
            }}
          >
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-[13px] text-white'>
                Total Order
              </span>
              <div className='bg-white rounded-full h-[22px] min-w-[22px] px-1.5 flex items-center justify-center'>
                <span className='font-bold text-primary text-[12px]'>
                  {totalCount}
                </span>
              </div>
              <span className='font-semibold text-[13px] text-white/80'>
                ·
              </span>
              <span className='font-bold text-[13px] text-white'>
                {selectedCurrency.symbol}{totalCost.toFixed(2)}
              </span>
            </div>
            <ChevronRight className='w-[18px] h-[18px] text-white' />
          </button>

          {/* Product Table Data */}
          <div className='flex-1 border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white'>
              <h2 className='font-semibold text-foreground text-[14px]'>
                Order Items
              </h2>
              <CurrencySortControls
                selectedCurrency={selectedCurrency}
                onSelectCurrency={setSelectedCurrency}
              />
            </div>

            {/* List Items */}
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {products.map((product, index) => {
                const qty = quantities[product.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 bg-white ${
                      index !== products.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <button 
                      className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary border-primary drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]' : 'border border-gray-300 bg-surface'
                      }`}
                      onClick={() => isSelected ? setQuantities(prev => { const rest = { ...prev }; delete rest[product.id]; return rest; }) : handleIncrement(product.id)}
                    >
                      {isSelected && <Check className='w-3 h-3 text-white' strokeWidth={3} />}
                    </button>
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                      <img
                        src={product.image}
                        alt={product.name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='flex-1 min-w-0 flex flex-col'>
                      <span className='font-semibold text-foreground text-[13px] truncate'>
                        {product.name}
                      </span>
                      <span className='text-gray-400 text-[11px] font-normal'>
                        {product.price.replace('$', selectedCurrency.symbol)}
                      </span>
                    </div>
                    
                    {isSelected ? (
                      <div className='flex items-center gap-2'>
                        <button 
                          className='w-7 h-7 rounded-[10px] bg-primary flex items-center justify-center shrink-0'
                          onClick={() => handleDecrement(product.id)}
                        >
                          <Minus className='w-4 h-4 text-white' />
                        </button>
                        <span className='w-5 text-center font-bold text-foreground text-[13px]'>
                          {qty}
                        </span>
                        <button 
                          className='w-7 h-7 rounded-[10px] bg-primary flex items-center justify-center shrink-0'
                          onClick={() => handleIncrement(product.id)}
                        >
                          <Plus className='w-4 h-4 text-white' />
                        </button>
                      </div>
                    ) : (
                      <button 
                        className='w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center shrink-0'
                        onClick={() => handleIncrement(product.id)}
                      >
                        <Plus className='w-4 h-4 text-white' />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className='absolute bottom-0 w-full max-w-[400px] bg-white border-t border-gray-100 flex items-center justify-between pb-safe z-10'>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Dashboard
            </span>
          </button>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('order')}
          >
            <Package className='w-5 h-5 text-primary' />
            <span className='text-[10px] font-semibold text-primary'>
              Order
            </span>
          </button>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('transactions')}
          >
            <ReceiptText className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
              Transactions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}