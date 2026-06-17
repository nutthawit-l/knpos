import { Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOTPForm } from '../hooks/useOTPForm';
import { useAuthStore } from '../store/useAuthStore';
import { OTP_DATA } from '../data/mockData';
import AuthLayout from '../components/AuthLayout';
import AuthButton from '../components/AuthButton';
import MascotLogo from '../components/MascotLogo';

export default function OTPVerify() {
  const navigate = useNavigate();
  const { error } = useAuthStore();
  const {
    otp,
    isLoading,
    inputRefs,
    handleChange,
    handleKeyDown,
    handleVerifySubmit,
  } = useOTPForm();

  return (
    <AuthLayout
      headerTitle="Charni POS"
      showHeader
      onBack={() => navigate('/register')}
    >
      {/* Mascot / Logo Section with Mail Badge */}
      <div className="mb-8 relative flex justify-center">
        <MascotLogo />
        <div className="absolute bottom-0 translate-x-8 bg-brand-blue p-2 rounded-full shadow-md border border-outline-warm text-text-brown flex items-center justify-center">
          <Mail className="w-4 h-4" />
        </div>
      </div>

      {/* Title & Subtext */}
      <h2 className="text-[28px] leading-[36px] font-bold text-text-brown text-center mb-2">
        {OTP_DATA.title}
      </h2>
      <p className="text-[16px] leading-[24px] text-surface-variant-custom text-center mb-10 px-4">
        {OTP_DATA.subtitle}
      </p>

      {/* Verification Form */}
      <form className="w-full" onSubmit={handleVerifySubmit}>
        {/* OTP Input Grid */}
        <div className="grid grid-cols-6 gap-2 mb-6 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              aria-label={`Digit ${index + 1}`}
              className="w-full h-14 sm:h-16 text-center text-2xl font-bold bg-surface border-2 border-outline-warm rounded-2xl text-text-brown transition-all focus:outline-none focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/20"
              inputMode="numeric"
              maxLength={1}
              type="text"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e.key)}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-[14px] text-center font-medium bg-red-50 p-2 rounded-xl border border-red-100 mb-6">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8">
          <AuthButton
            icon={CheckCircle}
            isLoading={isLoading}
            type="submit"
            variant="primary"
          >
            {OTP_DATA.verifyButtonText}
          </AuthButton>
        </div>
      </form>

      {/* Resend Code Link */}
      <div className="flex flex-col gap-2 items-center">
        <p className="text-[12px] leading-[16px] text-surface-variant-custom font-medium">
          {OTP_DATA.resendPrompt}
        </p>
        <button
          className="text-[14px] leading-[20px] font-bold text-secondary-custom bg-brand-blue/20 px-4 py-2 rounded-full hover:bg-brand-blue/30 transition-colors focus:outline-none cursor-pointer"
          type="button"
        >
          {OTP_DATA.resendButtonText}
        </button>
      </div>
    </AuthLayout>
  );
}
