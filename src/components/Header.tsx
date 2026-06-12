import React from 'react';
import { Search, Bell, Menu, ChevronLeft } from 'lucide-react';
import avatarImg from '../assets/avatar.png';

interface HeaderProps {
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  rightElement?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onBackClick,
  showSearch = true,
  showNotifications = false,
  rightElement,
}) => {
  return (
    <div className='flex items-center justify-between px-5 py-3 shrink-0 bg-white'>
      <div className='flex items-center'>
        {onBackClick ? (
          <button className='p-1 -ml-1' onClick={onBackClick}>
            <ChevronLeft className='w-6 h-6 text-foreground' />
          </button>
        ) : (
          <button className='p-1 -ml-1' onClick={onMenuClick}>
            <Menu className='w-6 h-6 text-foreground' />
          </button>
        )}
      </div>
      <div className='flex items-center gap-4'>
        {showSearch && (
          <button className='p-1'>
            <Search className='w-5 h-5 text-foreground' />
          </button>
        )}
        {showNotifications && (
          <button className='p-1 relative'>
            <Bell className='w-5 h-5 text-foreground' />
            <span className='absolute top-1 right-1.5 w-2 h-2 bg-[#fb2c36] rounded-full border border-white'></span>
          </button>
        )}
        {rightElement}
        <button className='w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-300'>
          <img
            src={avatarImg}
            alt='Avatar'
            className='w-full h-full object-cover'
          />
        </button>
      </div>
    </div>
  );
};

export default Header;
