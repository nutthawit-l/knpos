import { useState, useRef } from 'react';
import {
  Upload,
  Info,
  LayoutDashboard,
  Package,
  ReceiptText,
  Loader2,
} from 'lucide-react';
import Header from '../components/Header';

interface AddProductProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}

export default function AddProduct({ onNavigate }: AddProductProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name || !prices['THB'] || !imageFile) {
      alert('Name, Thai Price, and Image are required.');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('image', imageFile);
      formData.append('tha_price', prices['THB']);

      const currencyMap: Record<string, string> = {
        JPY: 'jpn_price',
        SGD: 'sgp_price',
        USD: 'deu_price',
        EUR: 'deu_price',
        KRW: 'kor_price',
        IDR: 'idn_price',
        CNY: 'chn_price',
        TWD: 'twn_price',
        THB: 'tha_price',
      };

      Object.entries(prices).forEach(([currency, val]) => {
        if (currency !== 'THB' && val && currencyMap[currency]) {
          formData.append(currencyMap[currency], val);
        }
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onNavigate?.('products');
      } else {
        const errorText = await res.text();
        alert('Failed to save: ' + errorText);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-[#f9fafb] min-h-screen flex justify-center'>
      <div className='bg-white flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        <Header onBackClick={() => onNavigate?.('products')} />

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-5 pb-24 bg-white'>
          <div className='pt-2' />
          {/* Product Image Section */}
          <div className='bg-white border border-gray-200 rounded-[16px] p-4 mb-4'>
            <h2 className='font-bold text-foreground text-[14px] mb-3'>
              Product Image
            </h2>
            <div
              className='bg-[#f9fafb] border-2 border-gray-200 border-dashed rounded-[14px] p-6 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden'
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt='Preview'
                  className='absolute inset-0 w-full h-full object-cover'
                />
              ) : (
                <>
                  <Upload className='w-6 h-6 text-gray-400 mb-2' />
                  <p className='text-[13px] font-semibold text-foreground'>
                    Drag your image here or browse here
                  </p>
                  <p className='text-[11px] text-gray-400'>
                    Format is JPG, PNG, WEBP or HEIC.
                  </p>
                </>
              )}
              <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                accept='image/*'
                onChange={handleImageChange}
              />
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
            <h2 className='font-bold text-foreground text-[14px]'>
              Product Information
            </h2>

            {/* Product Name */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-[12px] font-medium text-gray-600'>
                Product Name
              </label>
              <input
                type='text'
                placeholder='Enter product name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full border border-gray-200 rounded-[14px] px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-colors'
              />
            </div>

            {/* Price Inputs */}
            {[
              {
                label: 'Price — Thailand (THB)',
                currency: 'THB',
                symbol: '฿',
                placeholder: 'e.g ฿350',
              },
              {
                label: 'Price — Singapore (SGD)',
                currency: 'SGD',
                symbol: 'S$',
                placeholder: 'e.g S$10',
              },
              {
                label: 'Price — Japan (JPY)',
                currency: 'JPY',
                symbol: '¥',
                placeholder: 'e.g ¥1,000',
              },
              {
                label: 'Price — America (USD)',
                currency: 'USD',
                symbol: '$',
                placeholder: 'e.g $10',
              },
              {
                label: 'Price — Germany (EUR)',
                currency: 'EUR',
                symbol: '€',
                placeholder: 'e.g €9',
              },
              {
                label: 'Price — Korea (KRW)',
                currency: 'KRW',
                symbol: '₩',
                placeholder: 'e.g ₩13,000',
              },
              {
                label: 'Price — Indonesia (IDR)',
                currency: 'IDR',
                symbol: 'Rp',
                placeholder: 'e.g Rp150,000',
              },
              {
                label: 'Price — China (CNY)',
                currency: 'CNY',
                symbol: '¥',
                placeholder: 'e.g ¥70',
              },
              {
                label: 'Price — Taiwan (TWD)',
                currency: 'TWD',
                symbol: 'NT$',
                placeholder: 'e.g NT$300',
              },
            ].map((price, idx) => (
              <div key={idx} className='flex flex-col gap-1.5'>
                <label className='text-[12px] font-medium text-gray-600'>
                  {price.label}
                </label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400'>
                    {price.symbol}
                  </span>
                  <input
                    type='text'
                    placeholder={price.placeholder}
                    value={prices[price.currency] || ''}
                    onChange={(e) =>
                      setPrices((prev) => ({
                        ...prev,
                        [price.currency]: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-200 rounded-[14px] pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-primary transition-colors'
                  />
                </div>
              </div>
            ))}
          </div>
          <div className='h-6' />
          <div className='flex items-center gap-3'>
            <button
              className='flex-1 py-3 border border-gray-200 rounded-[14px] text-[14px] font-bold text-gray-400'
              onClick={() => onNavigate?.('products')}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className='flex-1 py-3 bg-[#f47b20] rounded-[14px] text-[14px] font-bold text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm'
              )}
            </button>
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
