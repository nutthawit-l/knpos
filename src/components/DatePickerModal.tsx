import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface DatePickerModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function DatePickerModal({ onClose, onConfirm }: DatePickerModalProps) {
  return (
    <div className="absolute bottom-0 left-0 w-full z-10 bg-white border-t border-[#e5e7eb] rounded-b-[16px] pb-1">
      <div className="w-full mx-auto overflow-hidden px-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-transparent">
          <h3 className="text-[14px] font-semibold text-[#1c1c1e]">Select Date</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Picker Area (Visual Mock) */}
        <div className="px-4 py-2 relative">
          <div className="absolute top-[68px] left-4 right-4 h-7 bg-[#fef3e8] rounded-[10px] pointer-events-none" />
          
          <div className="flex justify-between relative z-10">
            {/* Days Column */}
            <div className="flex-1 flex flex-col items-center">
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="h-[120px] w-full overflow-y-auto flex flex-col items-center text-[13px] snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-[48px]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div key={day} className="h-6 flex items-center justify-center snap-center shrink-0 w-full">
                    <span className={`${day === 1 ? 'text-[18px] font-bold text-[#1c1c1e]' : 'text-gray-400'}`}>{day}</span>
                  </div>
                ))}
              </div>
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Months Column */}
            <div className="flex-[1.5] flex flex-col items-center">
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="h-[120px] w-full overflow-y-auto flex flex-col items-center text-[13px] snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-[48px]">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                  <div key={month} className="h-6 flex items-center justify-center snap-center shrink-0 w-full">
                    <span className={`${i === 2 ? 'text-[18px] font-bold text-[#1c1c1e]' : 'text-gray-400'}`}>{month}</span>
                  </div>
                ))}
              </div>
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Years Column */}
            <div className="flex-[1.2] flex flex-col items-center">
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="h-[120px] w-full overflow-y-auto flex flex-col items-center text-[13px] snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-[48px]">
                {Array.from({ length: 20 }, (_, i) => 2020 + i).map(year => (
                  <div key={year} className="h-6 flex items-center justify-center snap-center shrink-0 w-full">
                    <span className={`${year === 2026 ? 'text-[18px] font-bold text-[#1c1c1e]' : 'text-gray-400'}`}>{year}</span>
                  </div>
                ))}
              </div>
              <button className="py-1 text-gray-400 z-10 bg-white w-full flex justify-center">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 pt-2">
          <button 
            onClick={onConfirm}
            className="w-full bg-[#f47b20] text-white rounded-[14px] py-2.5 text-[14px] font-semibold hover:bg-[#e06a1b] transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
