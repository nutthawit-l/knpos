import { LogOut } from 'lucide-react';
import SettingItem from '../components/SettingItem';
import MascotLogo from '../components/MascotLogo';
import { SETTINGS_DATA } from '../data/mockData';
import { useSetting } from '../hooks/useSetting';

export interface SettingProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function Setting({ onNavigate }: SettingProps) {
  const { toastMessage, handleItemClick, handleSignOut } = useSetting({ onNavigate });

  return (
    <>
      <div className="space-y-6 pb-20">
          
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
    </>
  );
}
