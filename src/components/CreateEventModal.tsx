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
          <h2 className="text-[18px] font-bold text-foreground leading-[27px]">Create an Event</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-foreground">
              Start Date <span className="text-destructive">*</span>
            </label>
            <div 
              className={`flex items-center gap-3 border rounded-[14px] px-3.5 py-2.5 cursor-pointer ${activeDatePicker === 'start' ? 'border-primary' : 'border-[#e5e7eb]'}`}
              onClick={() => setActiveDatePicker('start')}
            >
              <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text"
                readOnly
                value="2026-03-01"
                className="flex-1 text-[14px] font-medium text-foreground outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-foreground">
              End Date <span className="text-destructive">*</span>
            </label>
            <div 
              className={`flex items-center gap-3 border rounded-[14px] px-3.5 py-2.5 cursor-pointer ${activeDatePicker === 'end' ? 'border-primary' : 'border-[#e5e7eb]'}`}
              onClick={() => setActiveDatePicker('end')}
            >
              <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                readOnly
                value="2026-03-31"
                className="flex-1 text-[14px] font-medium text-foreground outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Event Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-foreground">
              Enter Event Name <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-3 border border-[#e5e7eb] rounded-[14px] px-3.5 py-2.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. AFA Annual Conference"
                className="flex-1 text-[13px] text-foreground placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Event Costs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">
                Event Costs <span className="text-destructive">*</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checkedCosts.length === costOptions.length}
                  onChange={handleToggleAll}
                  className="w-3.5 h-3.5 rounded-[3px] border-[#d1d5dc] text-primary focus:ring-primary" 
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
                      className="w-3.5 h-3.5 rounded-[3px] border-[#d1d5dc] text-primary focus:ring-primary" 
                    />
                    <span className="text-[13px] font-medium text-foreground-muted">{cost}</span>
                  </label>
                  {checkedCosts.includes(cost) && (
                    <div className="ml-5">
                      <div className="flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] px-3 py-2">
                        <span className="text-foreground-subtle text-[13px]">$</span>
                        <input 
                          type="text" 
                          placeholder="0.00"
                          className="flex-1 text-[13px] text-foreground placeholder:text-foreground-subtle outline-none bg-transparent"
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
              className="flex-1 py-2.5 border border-[#e5e7eb] rounded-[14px] text-[14px] font-semibold text-foreground hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 py-2.5 bg-primary rounded-[14px] text-[14px] font-semibold text-white hover:bg-[#e06a1b] transition-colors">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
