import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { Bell } from 'lucide-react';

interface LocationState {
  productToEdit?: unknown;
}

interface RouteConfig {
  title: string | ((state: LocationState | null | undefined) => string);
  tab: string;
  hideBottomNav?: boolean;
  showBackButton?: boolean;
  backTo?: string | ((state: LocationState | null | undefined) => string);
}

// Static mapping of pathnames to layout configuration
const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  '/dashboard': { title: 'Dashboard', tab: 'dashboard' },
  '/order': { title: 'New Order', tab: 'order' },
  '/transactions': { title: 'History', tab: 'transactions' },
  '/products': { title: 'Inventory', tab: 'products' },
  '/settings': { title: 'Settings', tab: 'settings' },
  '/create-event': {
    title: 'Create Event',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: '/dashboard',
  },
  '/add-product': {
    title: (state) => state?.productToEdit ? 'Edit Product' : 'Add Product',
    tab: '',
    hideBottomNav: true,
    showBackButton: true,
    backTo: (state) => state?.productToEdit ? '/products' : '/dashboard',
  },
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Find config based on current pathname
  const config = ROUTE_CONFIGS[location.pathname] || { title: 'Boutique POS', tab: '' };

  const state = location.state as LocationState | null | undefined;

  const resolvedTitle = typeof config.title === 'function' 
    ? config.title(state) 
    : config.title;

  const handleNavigate = (tab: string) => {
    navigate(`/${tab}`);
  };

  const handleBack = () => {
    if (config.showBackButton && config.backTo) {
      const destination = typeof config.backTo === 'function'
        ? config.backTo(state)
        : config.backTo;
      navigate(destination);
    }
  };

  return (
    <div className="bg-[#f9fafb] h-dvh overflow-hidden flex justify-center">
      <div className="bg-white flex flex-col h-dvh w-full max-w-[400px] relative shadow-2xl overflow-hidden font-quicksand bg-pattern">
        {/* Centralized Header with Dynamic Title, Back Arrow, and Bell Button */}
        <Header
          title={resolvedTitle}
          onBackClick={config.showBackButton ? handleBack : undefined}
          rightElement={
            !config.showBackButton && (
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#805062] hover:bg-[#fcf1f2] transition-colors active:scale-95 duration-150 cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
            )
          }
        />

        {/* Sub-page Outlet */}
        <div className={`flex-1 overflow-y-auto px-5 space-y-6 no-scrollbar pt-4 ${
          config.hideBottomNav ? 'pb-8' : 'pb-24'
        }`}>
          <Outlet />
        </div>

        {/* Centralized Bottom Navigation */}
        {!config.hideBottomNav && (
          <BottomNavigation activeTab={config.tab} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}
