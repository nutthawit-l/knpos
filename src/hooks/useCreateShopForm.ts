// @ts-nocheck
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface UseCreateShopFormProps {
  readonly onNavigate?: (tab: string) => void;
}

export function useCreateShopForm({ onNavigate }: UseCreateShopFormProps = {}) {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createShop } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateShopSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsLoading(true);
    const result = await createShop(shopName);
    setIsLoading(false);

    if (result.success) {
      if (onNavigate) {
        onNavigate('dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      alert(result.error || 'Failed to create shop');
    }
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
