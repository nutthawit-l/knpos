import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function useRegisterForm() {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    const result = await register(shopName, email, password);
    if (result.success) {
      navigate('/verify-otp');
    } else {
      alert(result.error || 'Failed to register');
    }
  };

  return {
    shopName,
    setShopName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleRegisterSubmit,
  };
}
export type UseRegisterFormReturn = ReturnType<typeof useRegisterForm>;
