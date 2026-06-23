import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define User data
export interface User {
  id: number | string;
  email: string;
  name: string;
  shopId?: number | null;
  shopName?: string | null;
  isOnboardingComplete: boolean;
  token?: string;
}

// Define Type for all State and Action in this store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verifyUser: () => Promise<void>;
  loginWithGoogleToken: (googleCredential: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    verifyUser: async () => {
      set({ isLoading: true });
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Session invalid or expired');
        }

        const data = await response.json();

        if (data.success && data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            shopId: data.user.shopId,
            shopName: data.user.shopName,
            isOnboardingComplete: !!data.user.shopId,
          };
          set({ user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      } catch (error) {
        set({ isAuthenticated: false, user: null });
        console.error('Session verification failed:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loginWithGoogleToken: async (responseToken: string) => {
      set({ isLoading: true });
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: responseToken}),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to login with Google');
        }

        if (data.success && data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            shopId: data.user.shopId,
            shopName: data.user.shopName,
            isOnboardingComplete: !!data.user.shopId,
          };
          set({ user, isAuthenticated: true });
        } else {
          throw new Error('Invalid user payload');
        }
      } catch (error) {
        console.error(error);
        set({ isAuthenticated: false, user: null });
      } finally {
        set({ isLoading: false });
      }
    },

    logout: async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Failed to log out from server:', error);
      } finally {
        // Always clear local authentication state regardless of network response
        set({ user: null, isAuthenticated: false });
      }
    }
  }), { name: 'AuthStore' }
  )
);
