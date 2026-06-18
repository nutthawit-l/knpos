import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { currencies } from '../types/currency';

interface UseCreateEventFormProps {
  readonly onNavigate?: (tab: string) => void;
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Thailand': 'THB',
  'Singapore': 'SGD',
  'USA': 'USD',
  'Japan': 'JPY',
};

export function useCreateEventForm({ onNavigate }: UseCreateEventFormProps = {}) {
  const [eventName, setEventName] = useState('');
  const [country, setCountry] = useState('Thailand');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [boothRental, setBoothRental] = useState('');
  const [travel, setTravel] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [foodAllowance, setFoodAllowance] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { setCurrency, setHasEvent } = useOrderStore();

  const handleCreateEventSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventName.trim() || !startDate || !endDate) return;

    setIsLoading(true);

    // Simulate async event creation (1s delay matching design scripts)
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // Update currency in order store
      const currencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';
      const matchedCurrency = currencies.find((c) => c.code === currencyCode);
      if (matchedCurrency) {
        setCurrency(matchedCurrency);
      }
      setHasEvent(true);

      // Navigate to order page after success feedback animation
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('order');
        } else {
          navigate('/dashboard', { state: { activeTab: 'order' } });
        }
      }, 1000);
    }, 1000);
  };

  const activeCurrencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';

  return {
    eventName,
    setEventName,
    country,
    setCountry,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    boothRental,
    setBoothRental,
    travel,
    setTravel,
    accommodation,
    setAccommodation,
    foodAllowance,
    setFoodAllowance,
    isLoading,
    isSuccess,
    activeCurrencyCode,
    handleCreateEventSubmit,
  };
}

export type UseCreateEventFormReturn = ReturnType<typeof useCreateEventForm>;
