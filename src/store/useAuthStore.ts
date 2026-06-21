import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define User data
export interface User {
  id: string;
  email: string;
  name: string;
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
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    verifyUser: async () => {
      set({ isLoading: true });
      try {
        // Mock API verify session from Backend
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockUser: User = {
          id: "kanoon123",
          email: "kanoon123@gmail.com",
          name: "Kanoon",
          isOnboardingComplete: false
        };

        set({ user: mockUser, isAuthenticated: true });
      } catch (error) {
        set({ isAuthenticated: false, user: null });
        console.error(error);
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

        set({ user: data.user, isAuthenticated: true });
      } catch (error) {
        console.error(error);
        set({ isAuthenticated: false, user: null });
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      // Clear user data when Logout
      set({ user: null, isAuthenticated: false });
    }
  }), { name: 'AuthStore' }
  )
);
