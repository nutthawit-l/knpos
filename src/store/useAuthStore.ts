import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
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

  loginWithGoogleToken: async () => {
  // loginWithGoogleToken: async (googleCredential: string) => {
    set({ isLoading: true });
    try {
      // Send credential to Backend
      // const res =
      //  await api.post('/auth/google', { token: googleCredential });
      set({ isAuthenticated: true });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    // Clear user data when Logout
    set({ user: null, isAuthenticated: false });
  }
}));
