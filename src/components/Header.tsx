import React from 'react';
import { Menu, ChevronLeft, FileDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeaderProps {
  readonly title?: string;
  readonly onMenuClick?: () => void;
  readonly onBackClick?: () => void;
  readonly rightElement?: React.ReactNode;
  readonly onImportClick?: () => void;
  readonly onAddClick?: () => void;
}

export default function Header({
  title = 'Charni POS',
  onMenuClick,
  onBackClick,
  rightElement,
  onImportClick,
  onAddClick,
}: HeaderProps) {
  return (
    <header className="bg-[#fff8f8] flex justify-between items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0 select-none">
      <div className="flex items-center gap-3">
        {onBackClick ? (
          <button
            onClick={onBackClick}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          onMenuClick && (
            <button
              onClick={onMenuClick}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          )
        )}
        <Link
          to="/"
          className="hover:opacity-80 active:opacity-75 transition-opacity cursor-pointer decoration-none"
        >
          <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">{title}</h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {onImportClick && (
          <button
            onClick={onImportClick}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer"
          >
            <FileDown className="w-5 h-5" />
          </button>
        )}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#805062] text-white hover:bg-[#805062]/90 transition-colors active:scale-95 duration-150 cursor-pointer shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        {rightElement}
      </div>
    </header>
  );
}
