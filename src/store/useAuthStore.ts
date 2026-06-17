import { create } from 'zustand';

export interface UserProfile {
  id: number;
  email: string;
  shopName: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registeringEmail: string | null;
  setRegisteringEmail: (email: string | null) => void;
  checkAuth: () => Promise<UserProfile | null>;
  login: (email: string, password: string) => Promise<{ success: boolean; verificationRequired?: boolean; email?: string; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  createShop: (shopName: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  registeringEmail: localStorage.getItem('registering_email') || null,

  setRegisteringEmail: (email) => {
    if (email) {
      localStorage.setItem('registering_email', email);
    } else {
      localStorage.removeItem('registering_email');
    }
    set({ registeringEmail: email });
  },

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return data.user;
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    } catch (err) {
      console.error('checkAuth failed:', err);
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      } else if (res.status === 403) {
        localStorage.setItem('registering_email', email);
        set({ registeringEmail: email, isLoading: false });
        return { success: false, verificationRequired: true, email };
      } else {
        set({ error: data.error || 'Login failed', isLoading: false });
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('registering_email', email);
        set({ registeringEmail: email, isLoading: false });
        return { success: true };
      } else {
        set({ error: data.error || 'Registration failed', isLoading: false });
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  createShop: async (shopName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/create-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user, isLoading: false });
        return { success: true };
      } else {
        set({ error: data.error || 'Failed to create shop', isLoading: false });
        return { success: false, error: data.error || 'Failed to create shop' };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  verifyOtp: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('registering_email');
        set({ user: data.user, isAuthenticated: true, registeringEmail: null, isLoading: false });
        return { success: true };
      } else {
        set({ error: data.error || 'OTP verification failed', isLoading: false });
        return { success: false, error: data.error || 'OTP verification failed' };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
