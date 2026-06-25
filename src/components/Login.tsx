import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useLoginForm } from '../hooks/useLoginForm';
import { useAuthStore } from '../store/useAuthStore';
import { LOGIN_DATA } from '../data/mockData';
import AuthLayout from './AuthLayout';
import FormInput from './FormInput';
import AuthButton from './AuthButton';
import MascotLogo from './MascotLogo';
import { useEffect } from 'react';

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const loginWithGoogleToken = useAuthStore(
    (state) => state.loginWithGoogleToken
  );

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

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
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                await loginWithGoogleToken(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.error('Google Sign-In failed');
            }}
            theme="outline"
            shape="pill"
            size="large"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
