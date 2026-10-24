import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import * as api from '../api/endpoints';
import { mockApi } from '../api/mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Verify the stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    (USE_MOCK ? mockApi.getMe() : api.getMe())
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const tokens = USE_MOCK
      ? await mockApi.login()
      : await api.login(data);
    localStorage.setItem('access_token', tokens.access_token);
    const me = USE_MOCK ? await mockApi.getMe() : await api.getMe();
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await api.register(data);
    // After registration, log them in
    await login({ email: data.email, password: data.password });
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
