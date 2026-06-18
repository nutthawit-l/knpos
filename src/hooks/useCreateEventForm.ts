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

  const { setCurrency, setHasEvent, setActiveEvent } = useOrderStore();

  const handleCreateEventSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventName.trim() || !startDate || !endDate) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          country,
          startDate,
          endDate,
          boothRental,
          travel,
          accommodation,
          foodAllowance,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { success: boolean; event: { id: number; name: string } };
        
        setIsLoading(false);
        setIsSuccess(true);

        // Update currency in order store
        const currencyCode = COUNTRY_CURRENCY_MAP[country] || 'THB';
        const matchedCurrency = currencies.find((c) => c.code === currencyCode);
        if (matchedCurrency) {
          setCurrency(matchedCurrency);
        }
        setHasEvent(true);
        setActiveEvent(data.event.id, data.event.name);

        // Navigate to order page after success feedback animation
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('order');
          } else {
            navigate('/dashboard', { state: { activeTab: 'order' } });
          }
        }, 1000);
      } else {
        let errorMsg = 'Failed to create event';
        try {
          const errJson = await response.json() as { error?: string };
          errorMsg = errJson.error || errorMsg;
        } catch {
          // Ignore parse failure
        }
        console.error('Failed to create event:', errorMsg);
        alert(`Failed to create event: ${errorMsg}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Create event error:', err);
      alert('A network error occurred. Please try again.');
      setIsLoading(false);
    }
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
