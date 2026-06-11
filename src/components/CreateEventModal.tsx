import { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import DatePickerModal from './DatePickerModal';

interface CreateEventModalProps {
  onClose: () => void;
}

export default function CreateEventModal({ onClose }: CreateEventModalProps) {
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);
  const [checkedCosts, setCheckedCosts] = useState<string[]>([]);

  const costOptions = ['Booth', 'Travel', 'Hotel', 'Meals', 'Other'];
  
  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setCheckedCosts(costOptions);
    } else {
      setCheckedCosts([]);
    }
  };

  const handleToggleCost = (cost: string) => {
    setCheckedCosts(prev => 
      prev.includes(cost) ? prev.filter(c => c !== cost) : [...prev, cost]
    );
  };

  return (
    <div className="absolute inset-0 bg-black/45 z-50 flex items-center justify-center p-5">
      <div className="bg-white w-full max-w-[335px] rounded-2xl flex flex-col overflow-hidden relative">
        {activeDatePicker && (
          <DatePickerModal 
            onClose={() => setActiveDatePicker(null)} 
            onConfirm={() => setActiveDatePicker(null)} 
          />
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <h2 className="text-[18px] font-bold text-[#1c1c1e] leading-[27px]">Create an Event</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#1c1c1e]">
              Start Date <span className="text-[#ef4444]">*</span>
            </label>
            <div 
              className={`flex items-center gap-3 border rounded-[14px] px-3.5 py-2.5 cursor-pointer ${activeDatePicker === 'start' ? 'border-[#f47b20]' : 'border-[#e5e7eb]'}`}
              onClick={() => setActiveDatePicker('start')}
            >
              <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text"
                readOnly
                value="2026-03-01"
                className="flex-1 text-[14px] font-medium text-[#1c1c1e] outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#1c1c1e]">
              End Date <span className="text-[#ef4444]">*</span>
            </label>
            <div 
              className={`flex items-center gap-3 border rounded-[14px] px-3.5 py-2.5 cursor-pointer ${activeDatePicker === 'end' ? 'border-[#f47b20]' : 'border-[#e5e7eb]'}`}
              onClick={() => setActiveDatePicker('end')}
            >
              <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                readOnly
                value="2026-03-31"
                className="flex-1 text-[14px] font-medium text-[#1c1c1e] outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Event Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#1c1c1e]">
              Enter Event Name <span className="text-[#ef4444]">*</span>
            </label>
            <div className="flex items-center gap-3 border border-[#e5e7eb] rounded-[14px] px-3.5 py-2.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. AFA Annual Conference"
                className="flex-1 text-[13px] text-[#1c1c1e] placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Event Costs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-[#1c1c1e]">
                Event Costs <span className="text-[#ef4444]">*</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checkedCosts.length === costOptions.length}
                  onChange={handleToggleAll}
                  className="w-3.5 h-3.5 rounded-[3px] border-[#d1d5dc] text-[#f47b20] focus:ring-[#f47b20]" 
                />
                <span className="text-[12px] font-medium text-[#6b7280]">Select All</span>
              </label>
            </div>
            
            <div className="flex flex-col gap-3">
              {costOptions.map((cost) => (
                <div key={cost} className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input 
                      type="checkbox" 
                      checked={checkedCosts.includes(cost)}
                      onChange={() => handleToggleCost(cost)}
                      className="w-3.5 h-3.5 rounded-[3px] border-[#d1d5dc] text-[#f47b20] focus:ring-[#f47b20]" 
                    />
                    <span className="text-[13px] font-medium text-[#374151]">{cost}</span>
                  </label>
                  {checkedCosts.includes(cost) && (
                    <div className="ml-5">
                      <div className="flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] px-3 py-2">
                        <span className="text-[#9ca3af] text-[13px]">$</span>
                        <input 
                          type="text" 
                          placeholder="0.00"
                          className="flex-1 text-[13px] text-[#1c1c1e] placeholder:text-[#9ca3af] outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#e5e7eb] rounded-[14px] text-[14px] font-semibold text-[#1c1c1e] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 py-2.5 bg-[#f47b20] rounded-[14px] text-[14px] font-semibold text-white hover:bg-[#e06a1b] transition-colors">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
