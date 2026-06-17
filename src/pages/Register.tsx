import { PawPrint } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { REGISTER_DATA } from '../data/mockData';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import AuthButton from '../components/AuthButton';
import MascotLogo from '../components/MascotLogo';

export default function Register() {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleRegisterSubmit,
  } = useRegisterForm();

  return (
    <AuthLayout
      headerTitle="Charni POS"
      showHeader
      onBack={() => navigate('/login')}
    >
      {/* Branding/Logo Area */}
      <div className="flex flex-col items-center mb-6">
        <MascotLogo className="mb-4" />
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

        {error && (
          <div className="text-red-500 text-[14px] text-center font-medium bg-red-50 p-2 rounded-xl border border-red-100">
            {error}
          </div>
        )}

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
        <Link to="/login" className="w-full flex justify-center">
          <AuthButton
            fullWidth={true}
            variant="secondary"
            type="button"
          >
            {REGISTER_DATA.loginButtonText}
          </AuthButton>
        </Link>
      </div>
    </AuthLayout>
  );
}
