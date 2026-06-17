import { useState, type FormEvent } from 'react';

interface UseCreateShopFormProps {
  readonly onNavigate?: (tab: string) => void;
}

export function useCreateShopForm({ onNavigate }: UseCreateShopFormProps) {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateShopSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsLoading(true);

    // Simulate async shop creation request (1.5s delay matching design scripts)
    setTimeout(() => {
      setIsLoading(true);
      setIsLoading(false);
      onNavigate?.('dashboard');
    }, 1500);
  };

  return {
    shopName,
    setShopName,
    description,
    setDescription,
    isLoading,
    handleCreateShopSubmit,
  };
}

export type UseCreateShopFormReturn = ReturnType<typeof useCreateShopForm>;
