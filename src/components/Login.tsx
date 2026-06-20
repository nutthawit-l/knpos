import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLoginForm } from '../hooks/useLoginForm';
import { GoogleLogin } from '@react-oauth/google';
import { LOGIN_DATA } from '../data/mockData';
import AuthLayout from './AuthLayout';
import FormInput from './FormInput';
import AuthButton from './AuthButton';
import MascotLogo from './MascotLogo';

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLoginSubmit,
  } = useLoginForm();

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
      <GoogleLogin
        onSuccess={credentialResponse => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
        useOneTap
      />;

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
