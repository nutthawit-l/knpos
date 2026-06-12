import { Package, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function OTPVerify({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    if (value.length > 1) {
      // If pasting or similar, just take the first digit
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

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

        {/* OTP Card */}
        <div className='flex-1 px-5 overflow-y-auto'>
          <div className='bg-background rounded-[24px] p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center'>
            <div className='bg-primary-light p-3.5 rounded-full mb-4'>
              <ShieldCheck className='w-6 h-6 text-primary' />
            </div>

            <h1 className='text-[20px] font-bold text-foreground mb-1.5'>
              OTP Verification
            </h1>
            <p className='text-[13px] text-foreground-subtle text-center mb-6'>
              We have sent a verification code to email address{' '}
              <span className='font-bold text-foreground'>
                johndoe@examle.com
              </span>
            </p>

            <div className='flex gap-2.5 mb-6'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type='text'
                  inputMode='numeric'
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-[52px] border-2 rounded-[14px] text-center text-[18px] font-bold focus:outline-none transition-all ${
                    digit
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-white'
                  }`}
                />
              ))}
            </div>

            <button
              className='w-full bg-primary text-white text-[15px] font-semibold py-3.5 rounded-[14px] mb-5 shadow-sm active:scale-[0.98] transition-all'
              onClick={() => onNavigate?.('dashboard')}
            >
              Verify
            </button>

            <p className='text-[13px] text-foreground-subtle'>
              Resend code in{' '}
              <span className='font-bold text-primary ml-1'>00:35</span>
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
