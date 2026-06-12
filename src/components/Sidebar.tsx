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
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-[#374151]' },
  { id: 'login', label: 'Login', icon: LogIn, color: 'text-[#f47b20]' },
  { id: 'logout', label: 'Logout', icon: LogOut, color: 'text-[#ef4444]' },
];

export default function Sidebar({ isOpen, onClose, activeTab, onNavigate }: SidebarProps) {
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
                <div className='w-12 h-12 rounded-full border-2 border-[#f3f4f6] p-0.5 overflow-hidden'>
                  <img src={avatarImg} alt='User avatar' className='w-full h-full object-cover rounded-full' />
                </div>
                <div>
                  <p className='text-[15px] font-bold text-[#1c1c1e] leading-tight'>John Smith</p>
                  <p className='text-[12px] text-[#9ca3af]'>Store Manager</p>
                </div>
              </div>
              <button onClick={onClose} className='p-1 text-[#374151]'>
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='px-5 mb-4'>
              <div className='h-px bg-[#f3f4f6]' />
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
                        ? 'bg-[#fef3e8] text-[#f47b20]' 
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#f47b20]' : 'text-[#374151]'}`} />
                    <span className={`text-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className='ml-auto w-1.5 h-5 bg-[#f47b20] rounded-full' />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className='px-3 pb-8 space-y-1'>
              <div className='px-2 mb-3'>
                <div className='h-px bg-[#f3f4f6]' />
              </div>
              {footerItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] hover:bg-gray-50 transition-colors`}
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
