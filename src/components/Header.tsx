import React from 'react';
import { Menu, ChevronLeft, FileDown, Plus } from 'lucide-react';
import avatarImg from '../assets/avatar.png';

interface HeaderProps {
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  rightElement?: React.ReactNode;
  onImportClick?: () => void;
  onAddClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onBackClick,
  rightElement,
  onImportClick,
  onAddClick,
}) => {
  return (
    <div className='flex items-center justify-between px-5 h-14 shrink-0 bg-white'>
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
      <div className='flex items-center gap-2'>
        {onImportClick && (
          <button
            onClick={onImportClick}
            className='p-2 border border-gray-200 rounded-[12px] bg-white text-gray-400'
          >
            <FileDown className='w-4 h-4' />
          </button>
        )}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className='p-2 bg-primary rounded-[12px] text-white shadow-sm'
          >
            <Plus className='w-4 h-4' />
          </button>
        )}
        {rightElement}
        <button className='w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-300 ml-2'>
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
