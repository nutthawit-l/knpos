import {
  Search,
  Calendar,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Plus,
  LayoutDashboard,
  Package,
  ReceiptText,
} from 'lucide-react';
import avatarImg from '../assets/avatar.png';

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

interface ProductsProps {
  onNavigate?: (tab: string) => void;
}

export default function Products({ onNavigate }: ProductsProps) {
  return (
    <div className='bg-[#f9fafb] min-h-screen flex justify-center'>
      <div className='bg-white flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {/* App Header */}
        <div className='flex items-center justify-between px-5 py-3 shrink-0 bg-white'>
          <button className='p-1 -ml-1'>
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
            <button className='p-1'>
              <Calendar className='w-5 h-5 text-[#1c1c1e]' />
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

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-5 pb-[80px] bg-white'>
          {/* Summary Banner */}
          <div className='bg-[#f47b20] rounded-[14px] w-full px-4 py-3 mb-5 flex items-center justify-between shadow-sm'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-[13px] text-white'>
                Total Products
              </span>
              <div className='bg-white rounded-full h-[22px] min-w-[22px] px-1.5 flex items-center justify-center'>
                <span className='font-bold text-[#f47b20] text-[12px]'>
                  0
                </span>
              </div>
              <span className='font-semibold text-[13px] text-white/80'>
                ·
              </span>
              <span className='font-bold text-[13px] text-white'>
                $0.00
              </span>
            </div>
            <ChevronRight className='w-[18px] h-[18px] text-white' />
          </div>

          {/* Product Table Data */}
          <div className='border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white'>
              <h2 className='font-semibold text-[#1c1c1e] text-[14px]'>
                Product Table Data
              </h2>
              <div className='flex items-center gap-3 text-gray-500'>
                <button>
                  <ArrowUpDown className='w-4 h-4' />
                </button>
                <button>
                  <Filter className='w-4 h-4' />
                </button>
              </div>
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
                  <div className='w-4 h-4 border border-gray-300 rounded shrink-0 bg-gray-50'></div>
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
                      {product.price}
                    </span>
                  </div>
                  <button className='w-8 h-8 rounded-[10px] bg-[#f47b20] flex items-center justify-center shrink-0'>
                    <Plus className='w-4 h-4 text-white' />
                  </button>
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
            onClick={() => onNavigate?.('products')}
          >
            <Package className='w-5 h-5 text-[#f47b20]' />
            <span className='text-[10px] font-semibold text-[#f47b20]'>
              Products
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
