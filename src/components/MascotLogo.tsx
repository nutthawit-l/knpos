import { LOGIN_DATA } from '../data/mockData';

export interface MascotLogoProps {
  readonly className?: string;
  readonly sizeClassName?: string;
}

export default function MascotLogo({
  className = '',
  sizeClassName = 'w-24 h-24',
}: MascotLogoProps) {
  return (
    <div
      className={`rounded-full bg-pink-container flex items-center justify-center overflow-hidden shadow-sm border border-outline-warm shrink-0 ${sizeClassName} ${className}`}
    >
      <img
        alt={LOGIN_DATA.logoAlt}
        className="w-full h-full object-contain"
        src={LOGIN_DATA.logoUrl}
      />
    </div>
  );
}
