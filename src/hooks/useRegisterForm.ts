import { useState, type FormEvent } from 'react';

interface UseRegisterFormProps {
  onNavigate?: (tab: string) => void;
}

export function useRegisterForm({ onNavigate }: UseRegisterFormProps) {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate async registration request (e.g. 1.5s delay matching design scripts)
    setTimeout(() => {
      setIsLoading(false);
      onNavigate?.('otp-verify');
    }, 1500);
  };

  return {
    shopName,
    setShopName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleRegisterSubmit,
  };
}
export type UseRegisterFormReturn = ReturnType<typeof useRegisterForm>;
