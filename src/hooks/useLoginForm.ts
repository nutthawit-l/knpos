import { useState, type FormEvent } from 'react';

interface UseLoginFormProps {
  onNavigate?: (tab: string) => void;
}

export function useLoginForm({ onNavigate }: UseLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulate login and navigate to dashboard
    onNavigate?.('dashboard');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    handleLoginSubmit,
  };
}
export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
