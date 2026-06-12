import { Eye, Package } from 'lucide-react';
import { useState } from 'react';

export default function Login({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='bg-surface min-h-screen flex justify-center'>
      <div className='bg-border flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-hidden font-sans'>
        {/* Logo Section */}
        <div className='flex items-center justify-center gap-2 py-6 shrink-0'>
          <div className='bg-primary w-9 h-9 rounded-[14px] flex items-center justify-center'>
            <Package className='w-5 h-5 text-white' />
          </div>
          <span className='text-[20px] font-bold text-foreground'>Olsera</span>
        </div>

        {/* Login Card */}
        <div className='flex-1 px-5 overflow-y-auto'>
          <div className='bg-background rounded-[24px] p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center'>
            <h1 className='text-[20px] font-bold text-foreground mb-1.5'>
              Welcome Back
            </h1>
            <p className='text-[13px] text-foreground-muted text-center mb-6'>
              Glad to see you again. Log in to your account.
            </p>

            <div className='w-full space-y-4 mb-6'>
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
                    placeholder='Enter your password'
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
            </div>

            <div className='w-full flex items-center justify-between mb-6'>
              <label className='flex items-center gap-2 cursor-pointer group'>
                <input type='checkbox' className='hidden' />
                <div className='w-4 h-4 border-2 border-foreground-subtle rounded-[4px] group-hover:border-primary transition-colors'></div>
                <span className='text-[12px] font-medium text-foreground-muted'>
                  Keep me login
                </span>
              </label>
              <button className='text-[12px] font-semibold text-primary'>
                Forgot Password?
              </button>
            </div>

            <button
              className='w-full bg-primary text-white text-[15px] font-semibold py-3.5 rounded-[14px] mb-5 shadow-sm active:scale-[0.98] transition-all'
              onClick={() => onNavigate?.('dashboard')}
            >
              Login
            </button>

            <p className='text-[13px] text-foreground-muted'>
              Don't have an account?{' '}
              <button
                className='text-[16px] font-bold text-primary ml-1'
                onClick={() => onNavigate?.('register')}
              >
                Register
              </button>
            </p>
          </div>

          <div className='py-8 flex justify-center'>
            <p className='text-[11px] text-foreground-subtle'>
              © 2026 Olsera. All right reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
