import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { LOGIN_DATA } from '../data/mockData';

export interface LoginProps {
  readonly onNavigate?: (tab: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    handleLoginSubmit,
  } = useLoginForm({ onNavigate });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Entrance animation trigger
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    // Parallax background movement
    const handleMouseMove = (e: MouseEvent) => {
      const f1 = document.getElementById('float-1');
      const f2 = document.getElementById('float-2');
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      if (f1) {
        f1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      }
      if (f2) {
        f2.style.transform = `translate(${-x * 50}px, ${-y * 50}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="bg-surface min-h-screen flex justify-center items-center font-quicksand overflow-hidden relative">
      {/* Floating Atmosphere Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div
          className="absolute top-10 left-10 w-32 h-32 bg-pink-container rounded-full blur-3xl transition-transform duration-300 ease-out"
          id="float-1"
        />
        <div
          className="absolute bottom-20 right-10 w-48 h-48 bg-peach-container rounded-full blur-3xl transition-transform duration-300 ease-out"
          id="float-2"
        />
      </div>

      {/* Main Mobile Shell */}
      <div className="bg-white flex flex-col h-screen w-full max-w-[400px] relative shadow-2xl overflow-y-auto z-10 border border-outline-warm">
        <main
          className={`flex-1 px-6 py-12 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
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
            {/* Email Input */}
            <div className="space-y-1">
              <label
                className="text-[14px] leading-[20px] font-bold text-text-brown ml-4"
                htmlFor="email"
              >
                {LOGIN_DATA.emailLabel}
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-surface-variant-custom" />
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown"
                  id="email"
                  placeholder={LOGIN_DATA.emailPlaceholder}
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label
                className="text-[14px] leading-[20px] font-bold text-text-brown ml-4"
                htmlFor="password"
              >
                {LOGIN_DATA.passwordLabel}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-surface-variant-custom" />
                <input
                  className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-outline-warm bg-white focus:border-brand-pink focus:ring-0 focus:outline-none transition-all duration-200 text-[16px] leading-[24px] placeholder:text-outline-variant-warm font-medium text-text-brown"
                  id="password"
                  placeholder={LOGIN_DATA.passwordPlaceholder}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 text-surface-variant-custom hover:text-brand-pink transition-colors focus:outline-none"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
              <button
                className="w-full bg-brand-pink hover:bg-brand-pink-hover text-text-brown text-[20px] font-bold py-4 rounded-full shadow-md shadow-brand-pink/30 transition-all flex items-center justify-center gap-2 active:scale-95 duration-200 focus:outline-none"
                type="submit"
              >
                <span>{LOGIN_DATA.loginButtonText}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
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
          <footer className="mt-12 flex items-center gap-4 text-outline-variant-warm">
            <div className="h-[1px] w-12 bg-outline-warm" />
            <span className="text-[12px] leading-[16px] uppercase tracking-widest font-bold">
              {LOGIN_DATA.footerText}
            </span>
            <div className="h-[1px] w-12 bg-outline-warm" />
          </footer>
        </main>
      </div>
    </div>
  );
}
