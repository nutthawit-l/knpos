import React from 'react';
import { User, Store, Calendar, Users, ChevronRight, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  User,
  Store,
  Calendar,
  Users,
};

export interface SettingItemProps {
  readonly title: string;
  readonly description: string;
  readonly iconName: string;
  readonly onClick?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  iconName,
  onClick,
}) => {
  const IconComponent = iconMap[iconName] || User;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 hover:bg-[#fcf1f2]/40 transition-all group active:scale-[0.98] duration-150 cursor-pointer border-none text-left bg-transparent"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full bg-brand-blue/30 flex items-center justify-center text-[#326578] shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-text-brown leading-tight truncate">
            {title}
          </p>
          <p className="text-[12px] text-surface-variant-custom mt-0.5 font-medium leading-normal">
            {description}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-outline-variant-warm group-hover:translate-x-1 transition-transform shrink-0" />
    </button>
  );
};

export default SettingItem;
