import { type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FormSelectProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly string[];
  readonly icon?: ComponentType<{ className?: string }>;
  readonly disabled?: boolean;
}

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  icon: Icon,
  disabled = false,
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label
        className="text-[14px] leading-[20px] font-bold text-text-brown pl-4"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-4 w-5 h-5 text-surface-variant-custom" />
        )}
        <select
          className={`w-full h-14 pr-12 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] font-medium text-text-brown appearance-none cursor-pointer disabled:opacity-50 disabled:bg-[#f9fafb] ${
            Icon ? 'pl-12' : 'px-6'
          }`}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 w-5 h-5 text-text-brown pointer-events-none opacity-60" />
      </div>
    </div>
  );
}
