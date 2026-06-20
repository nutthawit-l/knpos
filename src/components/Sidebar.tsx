// @ts-nocheck
import { 
  LayoutDashboard, 
  Package, 
  ReceiptText, 
  Settings, 
  LogIn, 
  LogOut,
  X
} from 'lucide-react';
import avatarImg from '../assets/avatar.png';
import { useAuthStore } from '../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'order', label: 'Order', icon: Package },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'products', label: 'Product', icon: Package },
];

const footerItems = [
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-foreground-muted' },
  { id: 'login', label: 'Login', icon: LogIn, color: 'text-primary' },
  { id: 'logout', label: 'Logout', icon: LogOut, color: 'text-destructive' },
];

export default function Sidebar({ isOpen, onClose, activeTab, onNavigate }: SidebarProps) {
  const { user } = useAuthStore();

  const filteredFooterItems = footerItems.filter(item => {
    // Hide login button when inside the dashboard (authenticated)
    if (item.id === 'login') return false;
    return true;
  });

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 flex justify-center ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div className='w-full max-w-[400px] relative h-full'>
          {/* Sidebar Content */}
          <div 
            className={`absolute left-0 top-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Profile */}
            <div className='pt-10 pb-6 px-5 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 rounded-full border-2 border-border p-0.5 overflow-hidden'>
                  <img src={avatarImg} alt='User avatar' className='w-full h-full object-cover rounded-full' />
                </div>
                <div>
                  <p className='text-[15px] font-bold text-foreground leading-tight'>{user?.shopName || 'Charni POS'}</p>
                  <p className='text-[12px] text-foreground-subtle'>{user?.email || 'Store Owner'}</p>
                </div>
              </div>
              <button onClick={onClose} className='p-1 text-foreground-muted'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-5 mb-4'>
              <div className='h-px bg-border' />
            </div>

            {/* Navigation */}
            <nav className='flex-1 px-3 space-y-1'>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] transition-colors ${
                      isActive 
                        ? 'bg-primary-light text-primary' 
                        : 'text-foreground-muted hover:bg-surface'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-foreground-muted'}`} />
                    <span className={`text-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className='ml-auto w-1.5 h-5 bg-primary rounded-full' />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className='px-3 pb-8 space-y-1'>
              <div className='px-2 mb-3'>
                <div className='h-px bg-border' />
              </div>
              {filteredFooterItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] hover:bg-surface transition-colors`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className={`text-[14px] font-medium ${item.color}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
