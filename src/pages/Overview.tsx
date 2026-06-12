import {
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  LayoutDashboard,
  Package,
  ReceiptText,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import avatarImg from '../assets/avatar.png';

const data = [
  { name: 'Mon', revenue: 7000, orders: 4000, profit: 3000 },
  { name: 'Tue', revenue: 11000, orders: 6000, profit: 5000 },
  { name: 'Wed', revenue: 18000, orders: 9000, profit: 7000 },
  { name: 'Thu', revenue: 14000, orders: 6000, profit: 5000 },
  { name: 'Fri', revenue: 21000, orders: 11000, profit: 9000 },
  { name: 'Sat', revenue: 16000, orders: 8000, profit: 6000 },
  { name: 'Sun', revenue: 11000, orders: 5000, profit: 4000 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const revenue = payload.find((p) => p.dataKey === 'revenue')?.value;
    const orders = payload.find((p) => p.dataKey === 'orders')?.value;
    const profit = payload.find((p) => p.dataKey === 'profit')?.value;

    return (
      <div className='bg-white border border-gray-200 p-2.5 shadow-sm min-w-[120px]'>
        <p className='text-[#0a0a0a] text-[14px] font-medium mb-1.5'>{label}</p>
        {revenue !== undefined && (
          <p className='text-primary text-[13px] mb-1'>
            revenue : ${revenue.toLocaleString()}
          </p>
        )}
        {orders !== undefined && (
          <p className='text-[#22c55e] text-[13px] mb-1'>
            orders : ${orders.toLocaleString()}
          </p>
        )}
        {profit !== undefined && (
          <p className='text-[#fda06a] text-[13px]'>
            profit : ${profit.toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function Overview({ onNavigate, onMenuClick }: { onNavigate?: (tab: string) => void, onMenuClick?: () => void }) {
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
              <Search className='w-5 h-5 text-foreground' />
            </button>
            <button className='p-1 relative'>
              <Bell className='w-5 h-5 text-foreground' />
              <span className='absolute top-1 right-1.5 w-2 h-2 bg-[#fb2c36] rounded-full border border-white'></span>
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
          <h1 className='text-2xl font-bold text-foreground'>Overview</h1>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-5 pb-24 bg-white'>
          <div className='bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'>
            {/* Card Header */}
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-[14px] font-semibold text-foreground'>
                Sales Performance
              </h2>
              <button className='flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500'>
                Weekly
                <ChevronDown className='w-3.5 h-3.5' />
              </button>
            </div>

            {/* Value */}
            <div className='flex items-baseline gap-2 mb-1'>
              <span className='text-[20px] font-bold text-foreground'>
                $20,234
              </span>
              <div className='flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full'>
                <TrendingUp className='w-3 h-3 text-green-500' />
                <span className='text-[11px] font-semibold text-green-500'>
                  12%
                </span>
              </div>
              <span className='text-[11px] text-gray-400 ml-1'>
                vs last week
              </span>
            </div>

            {/* Legend */}
            <div className='flex items-center gap-3 mt-4 mb-6'>
              <div className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-primary'></span>
                <span className='text-[10px] text-gray-500'>Revenue</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-[#22c55e]'></span>
                <span className='text-[10px] text-gray-500'>Orders</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-[#fda06a]'></span>
                <span className='text-[10px] text-gray-500'>Profit</span>
              </div>
            </div>

            {/* Chart */}
            <div className='h-[180px] w-full mt-2'>
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart
                  data={data}
                  margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey='name'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(val) =>
                      val === 0 ? '0K' : `${val / 1000}K`
                    }
                    ticks={[0, 5500, 11000, 16500, 22000]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar
                    dataKey='revenue'
                    barSize={16}
                    fill='var(--color-primary)'
                    radius={[4, 4, 4, 4]}
                  />
                  <Line
                    type='monotone'
                    dataKey='orders'
                    stroke='#22c55e'
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='profit'
                    stroke='#fda06a'
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className='absolute bottom-0 w-full max-w-[400px] bg-white border-t border-gray-100 flex items-center justify-between pb-safe z-10'>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className='w-5 h-5 text-primary' />
            <span className='text-[10px] font-semibold text-primary'>
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
