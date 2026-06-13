import React from 'react';

export type TimeRange = 'Weekly' | 'Monthly' | 'Yearly';

interface TimeRangeDropdownProps {
  selectedRange: TimeRange;
  onSelect: (range: TimeRange) => void;
  onClose: () => void;
}

const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({
  selectedRange,
  onSelect,
  onClose,
}) => {
  const ranges: TimeRange[] = ['Weekly', 'Monthly', 'Yearly'];

  return (
    <>
      <div className='fixed inset-0 z-40' onClick={onClose} />
      <div className='absolute right-0 top-full mt-1.5 bg-white rounded-xl py-1.5 w-[110px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] z-50 border border-gray-100 overflow-hidden'>
        {ranges.map((range) => {
          const isSelected = range === selectedRange;
          return (
            <button
              key={range}
              onClick={() => {
                onSelect(range);
                onClose();
              }}
              className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                isSelected
                  ? 'text-primary bg-[#fff7ed]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default TimeRangeDropdown;
