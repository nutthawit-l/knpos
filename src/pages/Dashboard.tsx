import {
  Bell,
  ShoppingCart,
  History,
  Package,
  Settings,
  Store,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import MascotLogo from '../components/MascotLogo';

export interface DashboardProps {
  readonly onNavigate?: (tab: string) => void;
  readonly onMenuClick?: () => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* TopAppBar */}
        <header className="bg-[#fff8f8] flex justify-between items-center px-5 h-16 w-full sticky top-0 z-50 border-b border-outline-warm/20">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-[20px] text-[#805062] tracking-tight">Charni POS</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6">
          {/* Greeting Section */}
          <section className="flex items-end gap-4 pt-4">
            <MascotLogo sizeClassName="w-20 h-20" className="floating-animation" />
            <div className="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm border border-outline-warm relative mb-2 flex-1">
              <p className="font-bold text-text-brown text-[14px] leading-[20px]">
                "Hi there! I'm Charni. I'm so excited to help you start your business journey today!"
              </p>
              <div className="absolute -left-2 bottom-0 w-4 h-4 bg-white border-l border-b border-outline-warm rotate-45 transform origin-top-left"></div>
            </div>
          </section>

          {/* Quick Guide */}
          <section className="bg-[#b5e7fe] rounded-[20px] p-5">
            <h3 className="font-bold text-[12px] tracking-widest text-[#37697d] uppercase mb-4">
              Quick Guide
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0">
                  1
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Create your shop
                </p>
              </li>
              <li className="flex gap-3 items-start opacity-60">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0">
                  2
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Add your products to inventory
                </p>
              </li>
              <li className="flex gap-3 items-start opacity-60">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0">
                  3
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Create your event
                </p>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-[#326578]/10">
              <p className="font-medium text-[12px] italic text-[#154d5f]">
                Tip: You can change these later in Settings.
              </p>
            </div>
          </section>

          {/* Action Blocks */}
          <div className="space-y-4">
            {/* Primary CTA: Create Your Shop */}
            <button
              onClick={() => onNavigate?.('register')}
              className="w-full text-left bg-white border-2 border-[#f8bbd0] rounded-[20px] p-5 hover:shadow-md transition-all duration-300 active:scale-95 overflow-hidden relative group cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="w-14 h-14 bg-[#f8bbd0] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Store className="w-7 h-7 text-[#805062]" />
                  </div>
                  <h3 className="text-[28px] leading-[36px] font-bold text-text-brown mb-2">
                    Create Your Shop
                  </h3>
                  <p className="text-[16px] leading-[24px] text-[#504447]">
                    Set your shop name, logo, and currency to begin.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[#805062] font-bold text-[14px]">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#f8bbd0] opacity-20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </button>

            {/* Add Product Block */}
            <button
              onClick={() => onNavigate?.('products')}
              className="w-full text-left bg-white border-2 border-[#f8bbd0] rounded-[20px] p-5 hover:shadow-md transition-all duration-300 active:scale-95 overflow-hidden relative group opacity-70 cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="w-14 h-14 bg-[#b5e7fe] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Package className="w-7 h-7 text-[#326578]" />
                  </div>
                  <h3 className="text-[28px] leading-[36px] font-bold text-text-brown mb-2">
                    Add Product
                  </h3>
                  <p className="text-[16px] leading-[24px] text-[#504447]">
                    Fill your inventory with your amazing items.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[#326578] font-bold text-[14px]">
                  <span>Go to Inventory</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#b5e7fe] opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </button>

            {/* Create New Event Block */}
            <section className="opacity-70">
              <button
                onClick={() => onNavigate?.('order')}
                className="w-full bg-[#fcf1f2] border-2 border-dashed border-[#805062]/30 py-8 px-6 rounded-[20px] group hover:bg-[#ffd9e4]/10 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-[#f8bbd0] flex items-center justify-center text-[#805062] group-hover:scale-110 transition-transform duration-300">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-[#805062] text-[20px]">
                  Create New Event
                </h3>
                <p className="text-[#504447] text-[14px] leading-[20px] text-center max-w-xs">
                  Start logging sales and managing products for your next event.
                </p>
              </button>
            </section>
          </div>

          {/* Footer Illustration Content */}
          <section className="py-6 flex flex-col items-center text-center space-y-6">
            <div className="w-full max-w-[280px] aspect-square bg-white rounded-[40px] shadow-sm border border-outline-warm flex items-center justify-center p-6 mx-auto">
              <img
                alt="Empty Shop"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWZ2jOhkWHoWtTZcH730W_qh0nGmJ6toLGpHWcwBSrbRkADHwAFGsDMoU1H3Erdfu2GZl13Lz-Hab2zRQw0fKIa5Vd0q6wc4dfst53kOjIG28w9NkZ5tSQkuWqSYMQa3pdh7nRyg__3y4OWT--X07l0On639t05qz_zn1BjkcX20ae8uZEJIbuoEQk59N9GWX_H419fSIPq79C1oc2zgm79lC60Ed-E99XIT3ALnpFhFv5k9FieGwYy8XNPpPmXMBgHa6ZArCZfGE"
              />
            </div>
            <div className="space-y-2 pb-6">
              <h4 className="font-bold text-[20px] text-text-brown">
                Every big dream starts small.
              </h4>
              <p className="font-medium text-[16px] text-[#504447] px-8">
                Ready to transform this empty space into your dream boutique?
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#fcf1f2] border-t border-outline-warm/30 shadow-[0_-2px_10px_rgba(78,52,46,0.05)] rounded-t-2xl">
          <button
            onClick={() => onNavigate?.('order')}
            className="flex flex-col items-center justify-center text-surface-variant-custom px-5 py-1 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <ShoppingCart className="w-5 h-5 mb-0.5 text-[#504447]" />
            <span className="text-[12px] font-bold text-[#504447]">Sales</span>
          </button>
          <button
            onClick={() => onNavigate?.('transactions')}
            className="flex flex-col items-center justify-center text-surface-variant-custom px-5 py-1 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <History className="w-5 h-5 mb-0.5 text-[#504447]" />
            <span className="text-[12px] font-bold text-[#504447]">History</span>
          </button>
          <button
            onClick={() => onNavigate?.('products')}
            className="flex flex-col items-center justify-center text-surface-variant-custom px-5 py-1 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <Package className="w-5 h-5 mb-0.5 text-[#504447]" />
            <span className="text-[12px] font-bold text-[#504447]">Inventory</span>
          </button>
          <button
            onClick={() => onNavigate?.('settings')}
            className="flex flex-col items-center justify-center text-surface-variant-custom px-5 py-1 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <Settings className="w-5 h-5 mb-0.5 text-[#504447]" />
            <span className="text-[12px] font-bold text-[#504447]">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
