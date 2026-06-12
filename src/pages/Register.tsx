import { 
  Eye, 
  LayoutDashboard, 
  Package, 
  ReceiptText, 
  UserCircle2 
} from 'lucide-react';
import { useState } from 'react';

export default function Register({ 
  onNavigate, 
}: { 
  onNavigate?: (tab: string) => void, 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className='bg-surface min-h-screen flex justify-center'>
      <div className='bg-border flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {/* Status Bar (Simulated) */}
        <div className='flex items-center justify-between px-6 pt-4 pb-1 shrink-0'>
          <span className='text-[15px] font-semibold text-foreground'>9:41</span>
          <div className='flex items-center gap-1.5'>
            <div className='w-4 h-3 border border-current rounded-sm relative'>
              <div className='absolute inset-0.5 bg-current rounded-px'></div>
            </div>
            <div className='w-4 h-3 relative'>
              <div className='absolute bottom-0 left-0 w-1 h-1 bg-current'></div>
              <div className='absolute bottom-0 left-1 w-1 h-2 bg-current'></div>
              <div className='absolute bottom-0 left-2 w-1 h-3 bg-current'></div>
            </div>
          </div>
        </div>

        {/* Logo Section */}
        <div className='flex items-center justify-center gap-2 py-6 shrink-0'>
          <div className='bg-primary w-9 h-9 rounded-[14px] flex items-center justify-center'>
            <Package className='w-5 h-5 text-white' />
          </div>
          <span className='text-[20px] font-bold text-foreground'>Olsera</span>
        </div>

        {/* Register Card */}
        <div className='flex-1 px-5 overflow-y-auto'>
          <div className='bg-background rounded-[24px] p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center'>
            <div className='bg-primary-light p-3.5 rounded-full mb-4'>
              <UserCircle2 className='w-6 h-6 text-primary' />
            </div>
            
            <h1 className='text-[20px] font-bold text-foreground mb-1.5'>Create Account</h1>
            <p className='text-[13px] text-foreground-muted text-center mb-6'>
              Fill in the details below to get started.
            </p>

            <div className='w-full space-y-4 mb-6'>
              <div className='space-y-1.5'>
                <label className='text-[13px] font-semibold text-foreground flex gap-0.5'>
                  Full Name <span className='text-destructive'>*</span>
                </label>
                <input 
                  type='text' 
                  placeholder='Enter your full name'
                  className='w-full border border-border rounded-[14px] px-4 py-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/20'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-[13px] font-semibold text-foreground flex gap-0.5'>
                  Email Address <span className='text-destructive'>*</span>
                </label>
                <input 
                  type='email' 
                  placeholder='Enter your email'
                  className='w-full border border-border rounded-[14px] px-4 py-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/20'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-[13px] font-semibold text-foreground flex gap-0.5'>
                  Password <span className='text-destructive'>*</span>
                </label>
                <div className='relative'>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder='Create a password'
                    className='w-full border border-border rounded-[14px] pl-4 pr-11 py-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/20'
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground-muted'
                  >
                    <Eye className='w-4 h-4' />
                  </button>
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='text-[13px] font-semibold text-foreground flex gap-0.5'>
                  Confirm Password <span className='text-destructive'>*</span>
                </label>
                <div className='relative'>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder='Confirm your password'
                    className='w-full border border-border rounded-[14px] pl-4 pr-11 py-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/20'
                  />
                  <button 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground-muted'
                  >
                    <Eye className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>

            <button 
              className='w-full bg-primary text-white text-[15px] font-semibold py-3.5 rounded-[14px] mb-5 shadow-sm active:scale-[0.98] transition-all'
              onClick={() => onNavigate?.('dashboard')}
            >
              Register
            </button>

            <p className='text-[13px] text-foreground-muted'>
              Already have an account?{' '}
              <button 
                className='text-[16px] font-bold text-primary ml-1'
                onClick={() => onNavigate?.('login')}
              >
                Login
              </button>
            </p>
          </div>

          <div className='py-8 flex justify-center'>
            <p className='text-[11px] text-foreground-subtle'>
              © 2026 Olsera. All right reserved.
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className='bg-background border-t border-border flex items-center justify-between pb-safe z-10'>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('dashboard')}
          >
            <LayoutDashboard className='w-5 h-5 text-foreground-subtle' />
            <span className='text-[10px] font-semibold text-foreground-subtle'>
              Dashboard
            </span>
          </button>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('order')}
          >
            <Package className='w-5 h-5 text-foreground-subtle' />
            <span className='text-[10px] font-semibold text-foreground-subtle'>
              Order
            </span>
          </button>
          <button 
            className='flex-1 flex flex-col items-center justify-center py-3 gap-1'
            onClick={() => onNavigate?.('transactions')}
          >
            <ReceiptText className='w-5 h-5 text-foreground-subtle' />
            <span className='text-[10px] font-semibold text-foreground-subtle'>
              Transactions
            </span>
          </button>
        </div>

        {/* Home Indicator */}
        <div className='flex justify-center pb-2 bg-background'>
          <div className='bg-foreground-subtle h-1 w-32 rounded-full'></div>
        </div>
      </div>
    </div>
  );
}
