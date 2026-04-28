import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;

  // Impersonation — held in memory only (not persisted to localStorage)
  isImpersonating: boolean;
  originalToken: string | null;
  originalUser: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;

  startImpersonation: (token: string, user: User) => void;
  stopImpersonation: () => void;
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: initialToken,
  isImpersonating: false,
  originalToken: null,
  originalUser: null,

  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token });
  },

  setUser: (user) => set({ user }),

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isImpersonating: false, originalToken: null, originalUser: null });
  },

  isAuthenticated: () => !!get().token,

  hasPermission: (code) => get().user?.permissions?.includes(code) ?? false,

  hasRole: (role) => get().user?.role === role,

  startImpersonation: (token, user) => {
    const { token: currentToken, user: currentUser } = get();
    // Replace active token/user with impersonation ones
    localStorage.setItem('access_token', token);
    set({
      token,
      user,
      isImpersonating: true,
      originalToken: currentToken,
      originalUser: currentUser,
    });
  },

  stopImpersonation: () => {
    const { originalToken, originalUser } = get();
    if (originalToken) localStorage.setItem('access_token', originalToken);
    set({
      token: originalToken,
      user: originalUser,
      isImpersonating: false,
      originalToken: null,
      originalUser: null,
    });
  },
}));
