import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { Bell } from 'lucide-react';

// Static mapping of pathnames to layout configuration
const ROUTE_CONFIGS: Record<string, { title: string; tab: string }> = {
  '/dashboard': { title: 'Dashboard', tab: 'dashboard' },
  '/order': { title: 'New Order', tab: 'order' },
  '/transactions': { title: 'History', tab: 'transactions' },
  '/products': { title: 'Inventory', tab: 'products' },
  '/settings': { title: 'Settings', tab: 'settings' }
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Find config based on current pathname
  const config = ROUTE_CONFIGS[location.pathname] || { title: 'Boutique POS', tab: '' };

  const handleNavigate = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* Centralized Header with Dynamic Title and Bell Button */}
        <Header
          title={config.title}
          rightElement={
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
          }
        />

        {/* Sub-page Outlet */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6 no-scrollbar pt-4">
          <Outlet />
        </div>

        {/* Centralized Bottom Navigation */}
        <BottomNavigation activeTab={config.tab} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
