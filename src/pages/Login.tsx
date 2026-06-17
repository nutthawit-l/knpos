import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { LOGIN_DATA } from '../data/mockData';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';

export interface LoginProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    handleLoginSubmit,
  } = useLoginForm({ onNavigate });

  return (
    <AuthLayout>
      {/* Logo Section */}
      <header className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 mb-4 rounded-full bg-pink-container flex items-center justify-center overflow-hidden shadow-sm border border-outline-warm">
          <img
            alt={LOGIN_DATA.logoAlt}
            className="w-full h-full object-contain"
            src={LOGIN_DATA.logoUrl}
          />
        </div>
        <h1 className="text-[28px] leading-[36px] font-bold text-text-brown tracking-tight">
          {LOGIN_DATA.title}
        </h1>
      </header>

      {/* Login Form */}
      <form className="w-full space-y-6" onSubmit={handleLoginSubmit}>
        <FormInput
          icon={Mail}
          id="email"
          label={LOGIN_DATA.emailLabel}
          placeholder={LOGIN_DATA.emailPlaceholder}
          required
          type="email"
          value={email}
          onChange={setEmail}
        />

        <div className="space-y-1">
          <FormInput
            icon={Lock}
            id="password"
            label={LOGIN_DATA.passwordLabel}
            placeholder={LOGIN_DATA.passwordPlaceholder}
            required
            type="password"
            value={password}
            onChange={setPassword}
          />
          <div className="flex justify-end pr-2">
            <button
              className="text-[12px] leading-[16px] font-bold text-secondary-custom hover:underline focus:outline-none"
              type="button"
            >
              {LOGIN_DATA.forgotPasswordText}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <AuthButton icon={ArrowRight} type="submit" variant="primary">
            {LOGIN_DATA.loginButtonText}
          </AuthButton>
        </div>

        {/* Secondary Action */}
        <div className="text-center pt-2">
          <p className="text-[16px] leading-[24px] text-surface-variant-custom font-medium">
            {LOGIN_DATA.signUpPrompt}{' '}
            <button
              className="text-text-brown font-bold hover:underline focus:outline-none"
              type="button"
              onClick={() => onNavigate?.('register')}
            >
              {LOGIN_DATA.signUpLinkText}
            </button>
          </p>
        </div>
      </form>

      {/* Aesthetic Footer */}
      <footer className="mt-12 flex items-center gap-4 text-outline-variant-warm justify-center">
        <div className="h-[1px] w-12 bg-outline-warm" />
        <span className="text-[12px] leading-[16px] uppercase tracking-widest font-bold">
          {LOGIN_DATA.footerText}
        </span>
        <div className="h-[1px] w-12 bg-outline-warm" />
      </footer>
    </AuthLayout>
  );
}
