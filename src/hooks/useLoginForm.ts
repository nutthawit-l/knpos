// @ts-nocheck
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.verificationRequired) {
      navigate('/verify-otp');
    } else {
      alert(result.error || 'Failed to login');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    isLoading,
    error,
    togglePasswordVisibility,
    handleLoginSubmit,
  };
}
export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
