import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Store,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Header from '../components/Header';
import MascotLogo from '../components/MascotLogo';

export interface DashboardProps {
  readonly onNavigate?: (tab: string) => void;
  readonly onMenuClick?: () => void;
}

export default function Dashboard({ onNavigate, onMenuClick }: DashboardProps) {
  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        <Header onMenuClick={onMenuClick} showNotifications={true} />

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
          <section className="bg-brand-blue/10 rounded-[20px] p-5 border border-brand-blue/20">
            <h3 className="font-bold text-[12px] tracking-widest text-[#2d5c6e] uppercase mb-4">
              Quick Guide
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0 border border-brand-blue/30 shadow-sm">
                  1
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Create your shop
                </p>
              </li>
              <li className="flex gap-3 items-start opacity-60">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0 border border-brand-blue/30 shadow-sm">
                  2
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Add your products to inventory
                </p>
              </li>
              <li className="flex gap-3 items-start opacity-60">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#326578] text-xs font-bold shrink-0 border border-brand-blue/30 shadow-sm">
                  3
                </span>
                <p className="font-medium text-[16px] text-text-brown">
                  Create your event
                </p>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-brand-blue/10">
              <p className="font-medium text-[12px] italic text-[#2d5c6e]">
                Tip: You can change these later in Settings.
              </p>
            </div>
          </section>

          {/* Action Blocks */}
          <div className="space-y-4">
            {/* Primary CTA: Create Your Shop */}
            <button
              onClick={() => onNavigate?.('register')}
              className="w-full text-left bg-white border-2 border-brand-pink/30 rounded-[20px] p-5 hover:shadow-md transition-all duration-300 active:scale-95 overflow-hidden relative group cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="w-14 h-14 bg-brand-pink/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Store className="w-7 h-7 text-brand-pink-hover" />
                  </div>
                  <h3 className="font-bold text-[20px] text-text-brown mb-2">
                    Create Your Shop
                  </h3>
                  <p className="font-medium text-[14px] text-surface-variant-custom">
                    Set your shop name, logo, and currency to begin.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-brand-pink-hover font-bold text-[14px]">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-pink/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </button>

            {/* Add Product Block */}
            <button
              onClick={() => onNavigate?.('products')}
              className="w-full text-left bg-white border-2 border-outline-warm/30 rounded-[20px] p-5 hover:shadow-md transition-all duration-300 active:scale-95 overflow-hidden relative group opacity-70 cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="w-14 h-14 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Package className="w-7 h-7 text-brand-blue" />
                  </div>
                  <h3 className="font-bold text-[20px] text-text-brown mb-2">
                    Add Product
                  </h3>
                  <p className="font-medium text-[14px] text-surface-variant-custom">
                    Fill your inventory with your amazing items.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-brand-blue font-bold text-[14px]">
                  <span>Go to Inventory</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-blue/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </button>

            {/* Create New Event Block */}
            <section className="opacity-70">
              <button
                onClick={() => onNavigate?.('order')}
                className="w-full bg-white/50 border-2 border-dashed border-outline-warm py-8 px-6 rounded-[20px] group hover:bg-brand-pink/10 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-pink-container flex items-center justify-center text-brand-pink-hover group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-[20px] text-text-brown">
                  Create New Event
                </h3>
                <p className="font-medium text-surface-variant-custom text-[14px] text-center max-w-xs">
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
              <p className="font-medium text-[16px] text-surface-variant-custom px-8">
                Ready to transform this empty space into your dream boutique?
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full max-w-[400px] bg-white border-t border-gray-100 flex items-center justify-between pb-safe z-10">
          <button
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-semibold text-primary">
              Dashboard
            </span>
          </button>
          <button
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            onClick={() => onNavigate?.('order')}
          >
            <Package className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-400">
              Order
            </span>
          </button>
          <button
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            onClick={() => onNavigate?.('transactions')}
          >
            <ReceiptText className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-400">
              Transactions
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
