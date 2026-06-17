import { PawPrint } from 'lucide-react';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { REGISTER_DATA } from '../data/mockData';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';

export interface RegisterProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function Register({ onNavigate }: RegisterProps) {
  const {
    shopName,
    setShopName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleRegisterSubmit,
  } = useRegisterForm({ onNavigate });

  return (
    <AuthLayout
      headerTitle="Charni POS"
      showHeader
      onBack={() => onNavigate?.('login')}
    >
      {/* Branding/Logo Area */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 mb-4 rounded-full bg-pink-container flex items-center justify-center overflow-hidden shadow-sm border border-outline-warm">
          <img
            alt={REGISTER_DATA.logoAlt}
            className="w-full h-full object-contain"
            src={REGISTER_DATA.logoUrl}
          />
        </div>
        <h2 className="text-[28px] leading-[36px] font-bold text-text-brown text-center mb-2 mt-4">
          {REGISTER_DATA.title}
        </h2>
        <p className="text-[16px] leading-[24px] text-surface-variant-custom text-center">
          {REGISTER_DATA.subtitle}
        </p>
      </div>

      {/* Register Form */}
      <form className="space-y-6" onSubmit={handleRegisterSubmit}>
        <FormInput
          id="shop_name"
          label={REGISTER_DATA.shopNameLabel}
          placeholder={REGISTER_DATA.shopNamePlaceholder}
          required
          type="text"
          value={shopName}
          onChange={setShopName}
        />

        <FormInput
          id="email"
          label={REGISTER_DATA.emailLabel}
          placeholder={REGISTER_DATA.emailPlaceholder}
          required
          type="email"
          value={email}
          onChange={setEmail}
        />

        <FormInput
          id="password"
          label={REGISTER_DATA.passwordLabel}
          placeholder={REGISTER_DATA.passwordPlaceholder}
          required
          type="password"
          value={password}
          onChange={setPassword}
        />

        {/* Action Button */}
        <div className="pt-2">
          <AuthButton
            icon={PawPrint}
            isLoading={isLoading}
            type="submit"
            variant="primary"
          >
            {REGISTER_DATA.signUpButtonText}
          </AuthButton>
        </div>
      </form>

      {/* Already have an account divider & button */}
      <div className="mt-8 pt-6 border-t border-outline-warm/30 flex flex-col items-center gap-4">
        <p className="text-[12px] leading-[16px] text-surface-variant-custom font-medium">
          {REGISTER_DATA.loginPrompt}
        </p>
        <AuthButton
          fullWidth={false}
          variant="secondary"
          onClick={() => onNavigate?.('login')}
        >
          {REGISTER_DATA.loginButtonText}
        </AuthButton>
      </div>
    </AuthLayout>
  );
}
