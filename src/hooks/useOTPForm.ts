// @ts-nocheck
import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function useOTPForm() {
  const [otp, setOtp] = useState<readonly string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  
  const navigate = useNavigate();
  const { verifyOtp, registeringEmail, isLoading, clearError } = useAuthStore();

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

  const handleVerifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    const code = otp.join('');
    if (code.length < 6) {
      alert('Please enter all 6 digits.');
      return;
    }

    if (!registeringEmail) {
      alert('Email not found. Please register again.');
      navigate('/register');
      return;
    }

    const result = await verifyOtp(registeringEmail, code);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.error || 'Failed to verify code.');
    }
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
