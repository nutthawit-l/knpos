import { useState } from 'react';
import {
  Search,
  Plus,
  FileDown,
  ArrowUpDown,
  Filter,
  LayoutDashboard,
  Package,
  ReceiptText,
} from 'lucide-react';
import avatarImg from '../assets/avatar.png';
import CurrencySwitchPopup, { currencies, type Currency } from '../components/CurrencySwitchPopup';

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
  { id: 'PRD-001', name: 'Cappuccino', price: '$4.00', image: imgImageCappuccino },
  { id: 'PRD-002', name: 'Iced Latte', price: '$4.25', image: imgImageIcedLatte },
  { id: 'PRD-003', name: 'Chocolate Croissant', price: '$3.50', image: imgImageChocolateCroissant },
  { id: 'PRD-004', name: 'Americano', price: '$3.00', image: imgImageAmericano },
  { id: 'PRD-005', name: 'Blueberry Muffin', price: '$3.25', image: imgImageBlueberryMuffin },
  { id: 'PRD-006', name: 'Caramel Macchiato', price: '$4.75', image: imgImageCaramelMacchiato },
  { id: 'PRD-007', name: 'Ham Sandwich', price: '$5.50', image: imgImageHamSandwich },
  { id: 'PRD-008', name: 'Green Tea', price: '$2.85', image: imgImageGreenTea },
  { id: 'PRD-009', name: 'Vanilla Donut', price: '$2.50', image: imgImageVanillaDonut },
  { id: 'PRD-010', name: 'Espresso', price: '$2.25', image: imgImageEspresso },
];

interface ProductsProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}

export default function Products({ onNavigate, onMenuClick }: ProductsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === 'USD') || currencies[0]);
  const [isCurrencyPopupOpen, setIsCurrencyPopupOpen] = useState(false);

  return (
    <div className='bg-[#f9fafb] min-h-screen flex justify-center'>
      <div className='bg-white flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {/* App Header */}
        <div className='flex items-center justify-between px-5 py-3 shrink-0 bg-white'>
          <button className='p-1 -ml-1' onClick={onMenuClick}>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='3' y1='12' x2='21' y2='12'></line>
              <line x1='3' y1='6' x2='21' y2='6'></line>
              <line x1='3' y1='18' x2='21' y2='18'></line>
            </svg>
          </button>
          <div className='flex items-center gap-4'>
            <button className='p-1'>
              <Search className='w-5 h-5 text-[#1c1c1e]' />
            </button>
            <button className='w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-300'>
              <img
                src={avatarImg}
                alt='Avatar'
                className='w-full h-full object-cover'
              />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className='px-5 pt-1 pb-3 shrink-0 bg-white'>
          <h1 className='text-2xl font-bold text-[#1c1c1e]'>Products</h1>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-5 pb-24 bg-white'>
          {/* Action Buttons */}
          <div className='flex flex-col gap-3 mb-6'>
            <button 
              className='w-full bg-[#f47b20] text-white font-semibold py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 shadow-sm'
              onClick={() => onNavigate?.('add-product')}
            >
              <Plus className='w-4 h-4 text-white' />
              <span>Add New Products</span>
            </button>
            <button className='w-full bg-white border border-gray-200 text-[#1c1c1e] font-semibold py-3 px-4 rounded-[14px] flex items-center justify-center gap-2'>
              <FileDown className='w-4 h-4' />
              <span>Import CSV</span>
            </button>
          </div>

          {/* Product Table Data */}
          <div className='border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white'>
              <h2 className='font-semibold text-[#1c1c1e] text-[14px]'>
                Product Table Data
              </h2>
              <div className='flex items-center gap-3 text-gray-500 relative'>
                <button>
                  <ArrowUpDown className='w-4 h-4' />
                </button>
                <button 
                  className='flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#f47b20] transition-colors hover:bg-gray-50'
                  onClick={() => setIsCurrencyPopupOpen(true)}
                >
                   <span className='w-3 h-3 rounded-full border border-[#f47b20] flex items-center justify-center text-[8px]'>
                     {selectedCurrency.symbol}
                   </span>
                   {selectedCurrency.code}
                </button>

                {isCurrencyPopupOpen && (
                  <CurrencySwitchPopup
                    selectedCode={selectedCurrency.code}
                    onSelect={setSelectedCurrency}
                    onClose={() => setIsCurrencyPopupOpen(false)}
                  />
                )}
              </div>
            </div>

            {/* Column Labels */}
            <div className='flex items-center px-4 py-2 bg-[#f9fafb] border-b border-gray-100'>
              <div className='flex-1 flex items-center gap-1'>
                <span className='text-[12px] font-medium text-gray-500'>Product Info</span>
                <Filter className='w-2.5 h-2.5 text-gray-400' />
              </div>
              <span className='text-[12px] font-medium text-gray-500'>Price ({selectedCurrency.symbol})</span>
            </div>

            {/* List Items */}
            <div className='flex flex-col'>
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 px-4 py-3 bg-white ${
                    index !== products.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                    <img
                      src={product.image}
                      alt={product.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className='flex-1 min-w-0 flex flex-col'>
                    <span className='font-semibold text-[#1c1c1e] text-[13px] truncate'>
                      {product.name}
                    </span>
                    <span className='text-gray-400 text-[11px] font-normal'>
                      {product.id}
                    </span>
                  </div>
                  <span className='font-semibold text-[#1c1c1e] text-[13px]'>
                    {product.price.replace('$', selectedCurrency.symbol)}
                  </span>
                </div>
              ))}
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
            <Package className='w-5 h-5 text-gray-400' />
            <span className='text-[10px] font-semibold text-gray-400'>
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
