import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useLoginForm } from '../hooks/useLoginForm';
import { useAuthStore } from '../store/useAuthStore';
import { LOGIN_DATA } from '../data/mockData';
import AuthLayout from './AuthLayout';
import FormInput from './FormInput';
import AuthButton from './AuthButton';
import MascotLogo from './MascotLogo';

export interface LoginProps {}

export default function Login(_props: Readonly<LoginProps>) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLoginSubmit,
  } = useLoginForm();

  const loginWithGoogleToken = useAuthStore((state) => state.loginWithGoogleToken);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await loginWithGoogleToken(tokenResponse.access_token);
    },
    onError: () => {
      console.error('Google Sign-In failed');
    },
  });

  return (
    <AuthLayout>
      {/* Logo Section */}
      <header className="flex flex-col items-center mb-8">
        <MascotLogo className="mb-4" />
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

        <div className="space-y-2">
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
              className="text-[12px] leading-[16px] font-bold text-secondary-custom hover:underline focus:outline-none cursor-pointer"
              type="button"
            >
              {LOGIN_DATA.forgotPasswordText}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-[14px] text-center font-medium bg-red-50 p-2 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <AuthButton icon={ArrowRight} type="submit" variant="primary" isLoading={isLoading}>
            {LOGIN_DATA.loginButtonText}
          </AuthButton>
        </div>

        {/* Secondary Action */}
        <div className="text-center pt-2">
          <p className="text-[16px] leading-[24px] text-surface-variant-custom font-medium">
            {LOGIN_DATA.signUpPrompt}{' '}
            <Link
              className="text-text-brown font-bold hover:underline focus:outline-none"
              to="/register"
            >
              {LOGIN_DATA.signUpLinkText}
            </Link>
          </p>
        </div>
      </form>

      {/* Aesthetic Google Divider & Button */}
      <div className="w-full flex flex-col items-center gap-4 mt-8">
        <div className="flex items-center gap-4 w-full text-text-brown">
          <div className="h-[1px] flex-1 bg-outline-warm" />
          <span className="text-[12px] leading-[16px] uppercase tracking-widest font-bold">OR</span>
          <div className="h-[1px] flex-1 bg-outline-warm" />
        </div>
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full h-14 bg-white border-2 border-outline-warm hover:bg-surface text-text-brown font-bold text-[18px] rounded-full shadow-sm active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google Logo"
            className="w-6 h-6 object-contain"
          />
          <span>Sign in with Google</span>
        </button>
      </div>
    </AuthLayout>
  );
}
