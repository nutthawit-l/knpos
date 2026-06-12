import { 
  ChevronLeft, 
  Upload, 
  Info,
  LayoutDashboard,
  Package,
  ReceiptText,
  Trash2,
} from 'lucide-react';
import avatarImg from '../assets/avatar.png';

interface AddProductProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}

export default function AddProduct({ onNavigate }: AddProductProps) {
  return (
    <div className='bg-[#f9fafb] min-h-screen flex justify-center'>
      <div className='bg-white flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {/* App Header */}
        <div className='flex items-center justify-between px-5 py-3 shrink-0 bg-white'>
          <button className='p-1 -ml-1' onClick={() => onNavigate?.('products')}>
            <ChevronLeft className='w-6 h-6 text-foreground' />
          </button>
          <div className='flex items-center gap-4'>
            <button className='w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-300'>
              <img
                src={avatarImg}
                alt='Avatar'
                className='w-full h-full object-cover'
              />
            </button>
          </div>
        </div>

        {/* Title & Top Actions */}
        <div className='px-5 pt-1 pb-3 shrink-0 bg-white'>
          <h1 className='text-2xl font-bold text-foreground mb-4'>Add New Product</h1>
          <div className='flex gap-2'>
            <button className='p-3 border border-gray-200 rounded-[14px] bg-white'>
              <Trash2 className='w-5 h-5 text-red-500' />
            </button>
            <button className='flex-1 bg-primary text-white font-semibold py-3 px-4 rounded-[14px] shadow-sm'>
              Add
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-5 pb-24 bg-white'>
          {/* Product Image Section */}
          <div className='bg-white border border-gray-200 rounded-[16px] p-4 mb-4'>
            <h2 className='font-bold text-foreground text-[14px] mb-3'>Product Image</h2>
            <div className='bg-[#f9fafb] border-2 border-gray-200 border-dashed rounded-[14px] p-6 flex flex-col items-center justify-center text-center'>
              <Upload className='w-6 h-6 text-gray-400 mb-2' />
              <p className='text-[13px] font-semibold text-foreground'>
                Drag your image here or browse here
              </p>
              <p className='text-[11px] text-gray-400'>
                Format is JPG, PNG, WEBP or HEIC.
              </p>
            </div>
            <div className='flex items-center gap-1.5 mt-2'>
              <Info className='w-3 h-3 text-gray-400' />
              <p className='text-[11px] text-gray-400'>
                Image dimensions are 500x500 pixels
              </p>
            </div>
          </div>

          {/* Product Information Section */}
          <div className='bg-white border border-gray-200 rounded-[16px] p-4 flex flex-col gap-4'>
            <h2 className='font-bold text-foreground text-[14px]'>Product Information</h2>
            
            {/* Product Name */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-[12px] font-medium text-gray-600'>Product Name</label>
              <input 
                type="text" 
                placeholder="Enter product name"
                className='w-full border border-gray-200 rounded-[14px] px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-colors'
              />
            </div>

            {/* Price Inputs */}
            {[
              { label: 'Price — Japan (JPY)', symbol: '¥', placeholder: 'e.g ¥1,000' },
              { label: 'Price — Thailand (THB)', symbol: '฿', placeholder: 'e.g ฿350' },
              { label: 'Price — Singapore (SGD)', symbol: 'S$', placeholder: 'e.g S$10' },
              { label: 'Price — America (USD)', symbol: '$', placeholder: 'e.g $10' },
              { label: 'Price — Germany (EUR)', symbol: '€', placeholder: 'e.g €9' },
              { label: 'Price — Korea (KRW)', symbol: '₩', placeholder: 'e.g ₩13,000' },
              { label: 'Price — Indonesia (IDR)', symbol: 'Rp', placeholder: 'e.g Rp150,000' },
              { label: 'Price — China (CNY)', symbol: '¥', placeholder: 'e.g ¥70' },
              { label: 'Price — Taiwan (TWD)', symbol: 'NT$', placeholder: 'e.g NT$300' },
            ].map((price, idx) => (
              <div key={idx} className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-gray-600'>{price.label}</label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400'>
                    {price.symbol}
                  </span>
                  <input 
                    type="text" 
                    placeholder={price.placeholder}
                    className='w-full border border-gray-200 rounded-[14px] pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-primary transition-colors'
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="h-6" />
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
