import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useOrderStore } from '../store/useOrderStore';
import BottomNavigation from '../components/BottomNavigation';
import CurrencySortControls from '../components/CurrencySortControls';

export default function Transactions({
  onNavigate,
  onMenuClick,
}: {
  onNavigate?: (tab: string) => void;
  onMenuClick?: () => void;
}) {
  const { selectedCurrency, setCurrency } = useOrderStore();
  const [summary, setSummary] = useState({ daily_total_income: 0, daily_total_product_sold: 0 });
  const [itemsSold, setItemsSold] = useState<Array<{ product_id: number; product_name: string; image_url: string; total_sold_today: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setIsLoading(true);
        setSummary({ daily_total_income: 0, daily_total_product_sold: 0 });
        setItemsSold([]);
      }
    });

    // Determine the browser timezone offset in hours to align local midnight business bounds correctly
    const tzOffset = -new Date().getTimezoneOffset() / 60;
    fetch(`/api/transactions?currency=${selectedCurrency.code}&tzOffset=${tzOffset}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setSummary(data.summary);
          setItemsSold(data.products || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCurrency]);

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
                  {selectedCurrency.symbol}
                  {summary.daily_total_income.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className='flex-1 bg-[#f0fdf4] rounded-[14px] p-3'>
                <p className='text-[#22c55e] text-[11px] font-medium mb-1'>
                  Products Sold
                </p>
                <p className='text-foreground text-[18px] font-bold'>
                  {summary.daily_total_product_sold.toLocaleString()}
                </p>
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
                <CurrencySortControls
                  selectedCurrency={selectedCurrency}
                  onSelectCurrency={setCurrency}
                />
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
              {isLoading ? (
                <div className='p-4 text-center text-[13px] text-gray-500 font-medium'>
                  Loading transaction data...
                </div>
              ) : itemsSold.length === 0 ? (
                <div className='p-8 text-center text-[13px] text-gray-400 font-medium'>
                  No transactions recorded today.
                </div>
              ) : (
                itemsSold.map((item, index) => (
                  <div
                    key={item.product_id}
                    className={`flex items-center gap-3 px-4 py-3 bg-white ${
                      index !== itemsSold.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0'>
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <span className='flex-1 font-medium text-foreground text-[13px] truncate'>
                      {item.product_name}
                    </span>
                    <span className='font-bold text-primary text-[13px]'>
                      {item.total_sold_today}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab="transactions" onNavigate={onNavigate} />
      </div>
    </div>
  );
}
