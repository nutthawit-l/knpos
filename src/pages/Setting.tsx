import { ArrowLeft, LogOut } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useOrderStore } from '../store/useOrderStore';
import SettingItem from '../components/SettingItem';
import MascotLogo from '../components/MascotLogo';
import { SETTINGS_DATA } from '../data/mockData';
import { useSetting } from '../hooks/useSetting';
import avatarImg from '../assets/avatar.png';

export interface SettingProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function Setting({ onNavigate }: SettingProps) {
  const { toastMessage, handleItemClick, handleSignOut } = useSetting({ onNavigate });
  const { hasEvent } = useOrderStore();

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex justify-between items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="mr-1 hover:opacity-80 transition-opacity duration-200 bg-transparent border-none cursor-pointer p-1 -ml-1 text-[#805062]"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">
              {SETTINGS_DATA.headerTitle}
            </h1>
          </div>
          <div className="flex items-center">
            <img
              alt="Shop Owner Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-brand-pink/40 shadow-sm"
              src={avatarImg}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5 space-y-6 no-scrollbar">
          
          {/* Settings List Container */}
          <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(78,52,46,0.04)] border border-outline-warm/30">
            {/* Header Block */}
            <div className="bg-brand-peach/10 px-6 py-4 border-b border-outline-warm/20">
              <h3 className="font-bold text-[12px] text-text-brown/70 tracking-wider uppercase">
                {SETTINGS_DATA.sectionTitle}
              </h3>
            </div>
            
            {/* Menu Items */}
            <nav className="divide-y divide-outline-warm/25">
              {SETTINGS_DATA.menuItems.map((item) => (
                <SettingItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  iconName={item.iconName}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </nav>

            {/* Logout Section */}
            <div className="p-5 bg-[#fcf1f2]/30 border-t border-outline-warm/20">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full border-2 border-outline-warm/75 text-text-brown font-bold text-[14px] hover:bg-white transition-all active:scale-[0.97] duration-150 cursor-pointer bg-transparent"
              >
                <LogOut className="w-4 h-4 text-text-brown" />
                {SETTINGS_DATA.signOutText}
              </button>
            </div>
          </div>

          {/* Sticker mascot decoration */}
          <div className="flex flex-col items-center justify-center py-4 opacity-50 select-none">
            <div className="relative">
              <MascotLogo
                sizeClassName="w-14 h-14"
                className="border-4 border-white shadow-md floating-animation mb-2"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#805062] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                CHARNI
              </div>
            </div>
            <p className="font-bold text-[10px] text-text-brown">Charni POS v1.0.0</p>
          </div>
        </div>

        {/* Floating Custom Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-white/95 backdrop-blur-md border border-brand-pink/50 rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-container flex items-center justify-center overflow-hidden border border-brand-pink/30 shrink-0">
                <MascotLogo sizeClassName="w-9 h-9" />
              </div>
              <p className="text-[13px] font-bold text-text-brown leading-tight">
                {toastMessage}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        {hasEvent && <BottomNavigation activeTab="settings" onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
