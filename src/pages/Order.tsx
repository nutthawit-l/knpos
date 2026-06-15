import { useState, useEffect } from 'react';
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

import CurrencySortControls from '../components/CurrencySortControls';
import { useOrderStore } from '../store/useOrderStore';

// Dynamic products are fetched from the API.

interface OrderProps {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}

export default function Order({ onNavigate, onMenuClick }: OrderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    quantities,
    selectedCurrency,
    setCurrency: setSelectedCurrency,
    incrementItem: handleIncrement,
    decrementItem: handleDecrement,
    removeItem,
    clearOrder,
  } = useOrderStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // Increments and decrements are handled globally via useOrderStore

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPrice = (product: any, currencyCode: string) => {
    const map: Record<string, string> = {
      JPY: 'jpn_price',
      THB: 'tha_price',
      SGD: 'sgp_price',
      USD: 'deu_price',
      EUR: 'deu_price',
      KRW: 'kor_price',
      IDR: 'idn_price',
      CNY: 'chn_price',
      TWD: 'twn_price',
    };
    const key = map[currencyCode] || 'tha_price';
    return parseFloat(product[key]) || 0;
  };

  const totalCount = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );
  const totalCost = products.reduce((sum, product) => {
    const qty = quantities[product.id] || 0;
    return sum + getPrice(product, selectedCurrency.code) * qty;
  }, 0);

  return (
    <div className='bg-[#f9fafb] h-dvh overflow-hidden flex justify-center'>
      <div className='bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {isModalOpen && (
          <CreateEventModal onClose={() => setIsModalOpen(false)} />
        )}
        {isConfirmModalOpen && (
          <ConfirmOrderModal
            totalItems={totalCount}
            totalPrice={totalCost}
            currencySymbol={selectedCurrency.symbol}
            isLoading={isConfirming}
            onCancel={() => setIsConfirmModalOpen(false)}
            onConfirm={async () => {
              setIsConfirming(true);
              
              const orderItems = products
                .filter((p) => quantities[p.id] > 0)
                .map((p) => ({
                  product_id: p.id,
                  quantity: quantities[p.id],
                  price_per_unit: getPrice(p, selectedCurrency.code),
                }));

              try {
                const response = await fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    currency_code: selectedCurrency.code,
                    total_income: totalCost,
                    total_product_sold: totalCount,
                    items: orderItems,
                  }),
                });

                if (response.ok) {
                  clearOrder();
                  onNavigate?.('transactions');
                  setIsConfirmModalOpen(false);
                } else {
                  let errorMsg = 'Unknown error';
                  const contentType = response.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    try {
                      const errJson = await response.json() as { error?: string };
                      errorMsg = errJson.error || errorMsg;
                    } catch {
                      // Fallback if parsing fails
                    }
                  } else {
                    errorMsg = await response.text();
                  }
                  console.error('Checkout failed:', errorMsg);
                  alert(`Checkout failed: ${errorMsg}`);
                }
              } catch (err) {
                console.error('Checkout error:', err);
                alert('A network error occurred. Please check your connection and try again.');
              } finally {
                setIsConfirming(false);
              }
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
              <span className='font-semibold text-[13px] text-white/80'>·</span>
              <span className='font-bold text-[13px] text-white'>
                {selectedCurrency.symbol}
                {totalCost.toFixed(2)}
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
              {isLoading ? (
                <div className='p-4 text-center text-[13px] text-gray-500 font-medium'>
                  Loading products...
                </div>
              ) : (
                products.map((product, index) => {
                  const qty = quantities[product.id] || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 px-4 py-3 bg-white ${
                        index !== products.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <button
                        className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]'
                            : 'border border-gray-300 bg-surface'
                        }`}
                        onClick={() =>
                          isSelected
                            ? removeItem(product.id)
                            : handleIncrement(product.id)
                        }
                      >
                        {isSelected && (
                          <Check
                            className='w-3 h-3 text-white'
                            strokeWidth={3}
                          />
                        )}
                      </button>
                      <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div className='flex-1 min-w-0 flex flex-col'>
                        <span className='font-semibold text-foreground text-[13px] truncate'>
                          {product.name}
                        </span>
                        <span className='text-gray-400 text-[11px] font-normal'>
                          {selectedCurrency.symbol}
                          {getPrice(product, selectedCurrency.code).toFixed(2)}
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
                })
              )}
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
