import { Bell, Store, Calendar, TrendingUp, PlusCircle, LogOut } from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { DASHBOARD2_DATA } from '../data/mockData';

export interface Dashboard2Props {
  readonly onNavigate?: (tab: string) => void;
  readonly onMenuClick?: () => void;
}

export default function Dashboard2({ onNavigate, onMenuClick }: Dashboard2Props) {
  const { user, logout } = useAuthStore();
  const { hasEvent } = useOrderStore();
  const hasShop = !!user?.shopId;

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
    }
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* Header */}
        <Header
          title="Boutique POS"
          onMenuClick={hasShop && hasEvent ? onMenuClick : undefined}
          rightElement={
            hasEvent ? (
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-destructive" />
              </button>
            )
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6 no-scrollbar pt-4">

          {/* Shop Summary Section */}
          <section className="space-y-3">
            <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
              {DASHBOARD2_DATA.headerTitle}
            </h2>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Sales Card */}
              <div className="col-span-2 bg-[#f8bbd0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[12px] font-medium text-[#76485a] opacity-80">
                    {DASHBOARD2_DATA.totalSalesLabel}
                  </p>
                  <h3 className="text-[28px] font-bold text-[#76485a] leading-none mt-1">
                    {DASHBOARD2_DATA.totalSalesValue}
                  </h3>
                </div>
                <div className="mt-4 flex items-center text-[#76485a] font-bold text-[12px]">
                  <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                  <span>{DASHBOARD2_DATA.totalSalesTrend}</span>
                </div>
              </div>

              {/* Active Shops Card */}
              <div className="bg-[#b5e7fe] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
                <div>
                  <Store className="w-5 h-5 text-[#37697d] mb-2" />
                  <p className="text-[12px] font-medium text-[#37697d] opacity-80">
                    {DASHBOARD2_DATA.activeShopsLabel}
                  </p>
                </div>
                <h3 className="text-[24px] font-bold text-[#37697d] leading-none mt-2">
                  {DASHBOARD2_DATA.activeShopsValue}
                </h3>
              </div>

              {/* Events this Year Card */}
              <div className="bg-[#fddeb0] p-5 rounded-[20px] shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] flex flex-col justify-between">
                <div>
                  <Calendar className="w-5 h-5 text-[#68522f] mb-2" />
                  <p className="text-[12px] font-medium text-[#68522f] opacity-80">
                    {DASHBOARD2_DATA.eventsYearLabel}
                  </p>
                </div>
                <h3 className="text-[24px] font-bold text-[#68522f] leading-none mt-2">
                  {DASHBOARD2_DATA.eventsYearValue}
                </h3>
              </div>
            </div>
          </section>

          {/* Recent Events Section */}
          <section className="space-y-3">
            <div className="flex justify-between items-end">
              <h2 className="font-bold text-[12px] tracking-widest text-[#4E342E] opacity-60 uppercase">
                {DASHBOARD2_DATA.pastEventsLabel}
              </h2>
              <button
                onClick={() => alert('Viewing all events will be supported in the next update! 🐾')}
                className="text-[#805062] font-bold text-[12px] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {DASHBOARD2_DATA.viewAllLabel}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {DASHBOARD2_DATA.events.map((event) => {
                const isProfit = event.badgeType === 'profit';
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_-2px_rgba(78,52,46,0.08)] border border-[#E0D0CC]/30 group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="h-32 w-full relative overflow-hidden bg-[#fff8f8]">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={event.title}
                        src={event.imageUrl}
                      />
                      <div
                        className={`absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${isProfit
                            ? 'bg-[#f8bbd0]/90 text-[#76485a]'
                            : 'bg-[#b5e7fe]/90 text-[#37697d]'
                          }`}
                      >
                        {event.badge}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="text-[18px] font-bold text-text-brown leading-tight">
                          {event.title}
                        </h4>
                        <p className="text-[12px] text-text-brown/70 mt-0.5">
                          {event.date}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-[#E0D0CC]/20">
                        <div>
                          <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                            {event.totalSalesLabel}
                          </p>
                          <p className="font-bold text-text-brown text-[16px]">
                            {event.totalSalesValue}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-text-brown/65 uppercase tracking-wide">
                            {event.netProfitLabel}
                          </p>
                          <p
                            className={`font-bold text-[16px] ${isProfit ? 'text-[#805062]' : 'text-[#326578]'
                              }`}
                          >
                            {event.netProfitValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Create New Event Button */}
          <section className="pt-2">
            <button
              onClick={() => onNavigate?.('create-event')}
              className="w-full bg-[#fcf1f2] border-2 border-dashed border-[#805062]/30 py-8 px-6 rounded-[20px] group hover:bg-[#ffd9e4]/20 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[#f8bbd0] flex items-center justify-center text-[#805062] group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <PlusCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[#805062] text-[20px]">
                {DASHBOARD2_DATA.createEventTitle}
              </h3>
              <p className="text-text-brown/80 text-[13px] text-center max-w-[280px]">
                {DASHBOARD2_DATA.createEventSubtitle}
              </p>
            </button>
          </section>

        </div>

        {/* Bottom Navigation */}
        {hasShop && hasEvent && <BottomNavigation activeTab="dashboard" onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
