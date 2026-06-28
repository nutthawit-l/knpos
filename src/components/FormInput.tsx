import { useState, type ComponentType } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface FormInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly icon?: ComponentType<{ className?: string }>;
}

export default function FormInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  icon: Icon,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
        <input
          className={`w-full h-14 pr-4 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown ${
            Icon ? 'pl-12' : 'px-6'
          }`}
          id={id}
          placeholder={placeholder}
          required={required}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => type === 'number' && e.currentTarget.blur()}
        />
        {isPassword && (
          <button
            className="absolute right-4 text-surface-variant-custom hover:text-brand-pink transition-colors focus:outline-none"
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
