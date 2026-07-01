import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SETTINGS_DATA } from '../data/mockData';
import { useAuthStore } from '../store/useAuthStore';

interface UseSettingProps {
  readonly onNavigate?: (tab: string) => void;
}

export function useSetting({ onNavigate }: UseSettingProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleItemClick = (item: typeof SETTINGS_DATA.menuItems[number]) => {
    if (item.action === 'navigate' && item.target) {
      if (onNavigate) {
        onNavigate(item.target);
      } else {
        navigate(`/${item.target}`);
      }
    } else if (item.action === 'alert' && item.message) {
      showToast(item.message);
    }
  };

  const handleSignOut = async () => {
    const confirmSignOut = window.confirm(SETTINGS_DATA.signOutConfirm);
    if (confirmSignOut) {
      await logout();
      if (onNavigate) {
        onNavigate('login');
      } else {
        navigate('/login');
      }
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
