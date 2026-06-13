import {
  LayoutDashboard,
  Package,
  ReceiptText,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import Header from '../components/Header';

const imgImageCappuccino =
  'https://www.figma.com/api/mcp/asset/4bef099a-4290-4694-8269-f0a6be4ef565';
const imgImageIcedLatte =
  'https://www.figma.com/api/mcp/asset/208f24fd-7360-4cd9-b02c-e303cc41042a';
const imgImageChocolateCroissant =
  'https://www.figma.com/api/mcp/asset/5dcf43db-bfd3-4edc-9adc-c6f6b92a3265';
const imgImageAmericano =
  'https://www.figma.com/api/mcp/asset/c50b7b00-bff5-43cc-b24e-c19a9839b963';
const imgImageBlueberryMuffin =
  'https://www.figma.com/api/mcp/asset/ab1a6628-a6d0-4413-99ff-86fe017a8e7f';
const imgImageCaramelMacchiato =
  'https://www.figma.com/api/mcp/asset/558604bc-fb0a-4518-b9d2-805af2222a30';
const imgImageHamSandwich =
  'https://www.figma.com/api/mcp/asset/d104f66c-45d5-45fd-9464-2d33254ce0c0';
const imgImageGreenTea =
  'https://www.figma.com/api/mcp/asset/00d9ff94-62af-43f8-a336-b42985c6f389';
const imgImageVanillaDonut =
  'https://www.figma.com/api/mcp/asset/59b3d410-0e4d-476c-9cff-b8619f905d34';
const imgImageEspresso =
  'https://www.figma.com/api/mcp/asset/45ac1a32-6c47-411f-bbf1-98fed0f06c60';

const transactions = [
  { id: 1, name: 'Cappuccino', sold: 312, image: imgImageCappuccino },
  { id: 2, name: 'Iced Latte', sold: 278, image: imgImageIcedLatte },
  {
    id: 3,
    name: 'Chocolate Croissant',
    sold: 195,
    image: imgImageChocolateCroissant,
  },
  { id: 4, name: 'Americano', sold: 401, image: imgImageAmericano },
  {
    id: 5,
    name: 'Blueberry Muffin',
    sold: 143,
    image: imgImageBlueberryMuffin,
  },
  {
    id: 6,
    name: 'Caramel Macchiato',
    sold: 229,
    image: imgImageCaramelMacchiato,
  },
  { id: 7, name: 'Ham Sandwich', sold: 88, image: imgImageHamSandwich },
  { id: 8, name: 'Green Tea', sold: 176, image: imgImageGreenTea },
  { id: 9, name: 'Vanilla Donut', sold: 260, image: imgImageVanillaDonut },
  { id: 10, name: 'Espresso', sold: 352, image: imgImageEspresso },
];

export default function Transactions({
  onNavigate,
  onMenuClick,
}: {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}) {
  return (
    <div className='bg-[#f9fafb] h-dvh overflow-hidden flex justify-center'>
      <div className='bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        <Header onMenuClick={onMenuClick} showNotifications={true} />

        {/* Content */}
        <div className='flex-1 flex flex-col overflow-hidden px-5 pb-24 bg-white'>
          {/* Summary */}
          <div className='bg-white border border-gray-200 rounded-[14px] p-4 mb-4 shrink-0'>
            <p className='text-[#6b7280] text-[12px] font-medium mb-3'>
              Today's Summary
            </p>
            <div className='flex gap-3'>
              <div className='flex-1 bg-primary-light rounded-[14px] p-3'>
                <p className='text-primary text-[11px] font-medium mb-1'>
                  Total Income
                </p>
                <p className='text-foreground text-[18px] font-bold'>
                  $8,120.50
                </p>
              </div>
              <div className='flex-1 bg-[#f0fdf4] rounded-[14px] p-3'>
                <p className='text-[#22c55e] text-[11px] font-medium mb-1'>
                  Products Sold
                </p>
                <p className='text-foreground text-[18px] font-bold'>1,284</p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className='flex-1 border border-gray-200 rounded-[14px] overflow-hidden flex flex-col bg-white'>
            {/* Table Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0'>
              <h2 className='font-semibold text-foreground text-[14px]'>
                Recent Transactions
              </h2>
              <div className='flex items-center gap-3 text-gray-500'>
                <button>
                  <ArrowUpDown className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Sub Header */}
            <div className='bg-[#f9fafb] border-b border-gray-100 px-4 py-2 flex justify-between items-center shrink-0'>
              <span className='text-[#6b7280] text-[12px] font-medium'>
                Product
              </span>
              <span className='text-[#6b7280] text-[12px] font-medium'>
                Total Sold
              </span>
            </div>

            {/* List Items */}
            <div className='flex-1 flex flex-col overflow-y-auto'>
              {transactions.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 bg-white ${
                    index !== transactions.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                    <img
                      src={item.image}
                      alt={item.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <span className='flex-1 font-medium text-foreground text-[13px] truncate'>
                    {item.name}
                  </span>
                  <span className='font-bold text-primary text-[13px]'>
                    {item.sold}
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
            <ReceiptText className='w-5 h-5 text-primary' />
            <span className='text-[10px] font-semibold text-primary'>
              Transactions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
