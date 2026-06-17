import { useState } from 'react';
import { SETTINGS_DATA } from '../data/mockData';

interface UseSettingProps {
  readonly onNavigate?: (tab: string) => void;
}

export function useSetting({ onNavigate }: UseSettingProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleItemClick = (item: typeof SETTINGS_DATA.menuItems[number]) => {
    if (item.action === 'navigate' && item.target) {
      onNavigate?.(item.target);
    } else if (item.action === 'alert' && item.message) {
      showToast(item.message);
    }
  };

  const handleSignOut = () => {
    const confirmSignOut = window.confirm(SETTINGS_DATA.signOutConfirm);
    if (confirmSignOut) {
      onNavigate?.('login');
    }
  };

  return {
    toastMessage,
    setToastMessage,
    handleItemClick,
    handleSignOut,
  };
}

export type UseSettingReturn = ReturnType<typeof useSetting>;
