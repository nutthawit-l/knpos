import { type ReactNode, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

export interface AuthButtonProps {
  readonly children: ReactNode;
  readonly type?: 'button' | 'submit';
  readonly onClick?: () => void;
  readonly variant?: 'primary' | 'secondary';
  readonly isLoading?: boolean;
  readonly icon?: ComponentType<{ className?: string }>;
  readonly fullWidth?: boolean;
}

export default function AuthButton({
  children,
  type = 'button',
  onClick,
  variant = 'primary',
  isLoading = false,
  icon: Icon,
  fullWidth = true,
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';

  const baseStyles =
    'h-14 font-bold text-[18px] uppercase rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 disabled:pointer-events-none';

  const variantStyles = isPrimary
    ? 'bg-brand-pink hover:bg-brand-pink-hover text-text-brown shadow-[0_4px_15px_rgba(128,80,98,0.15)]'
    : 'bg-transparent text-secondary-custom border-2 border-secondary-custom hover:bg-secondary-custom/10';

  const widthStyles = fullWidth ? 'w-full' : 'px-8';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${widthStyles}`}
      disabled={isLoading}
      type={type}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {Icon && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}
