import { useState, useRef, type FormEvent } from 'react';

interface UseOTPFormProps {
  onNavigate?: (tab: string) => void;
}

export function useOTPForm({ onNavigate }: UseOTPFormProps) {
  const [otp, setOtp] = useState<readonly string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character in case of double-input
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    // Auto focus previous input on Backspace if current cell is empty
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate verification delay (e.g. 1.5 seconds)
    setTimeout(() => {
      setIsLoading(false);
      onNavigate?.('dashboard');
    }, 1500);
  };

  return {
    otp,
    isLoading,
    inputRefs,
    handleChange,
    handleKeyDown,
    handleVerifySubmit,
  };
}
export type UseOTPFormReturn = ReturnType<typeof useOTPForm>;
