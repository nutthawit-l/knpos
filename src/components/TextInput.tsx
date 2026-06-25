import { type ComponentType } from 'react';

export interface TextInputProp {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly icon?: ComponentType<{ className?: string }>;
}

export default function TextInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  icon: Icon,
}: TextInputProp) {
  return (
    <div className="space-y-2">
      <label
        className="text-[14px] leading-5 font-bold text-text-brown pl-4"
        htmlFor={id}
      >
        {label}{required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-4 w-5 h-5 text-surface-variant-custom" />
        )}
        <input
          className={`w-full h-14 pr-4 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-6 placeholder:text-outline-variant-warm font-medium text-text-brown ${
            Icon ? 'pl-12' : 'px-6'
          }`}
          id={id}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
