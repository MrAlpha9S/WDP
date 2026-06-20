import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { setUnauthorizedHandler } from '../api/axios';
import { clearSession, getSession, saveSession, UserSession } from './storage';

interface AuthContextValue {
  session: UserSession | null;
  isLoading: boolean;
  saveAndSetSession: (session: UserSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  // Keep a ref to the latest logout so the axios interceptor always calls
  // the current version without a stale closure.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    setUnauthorizedHandler(() => logoutRef.current());

    getSession().then((stored) => {
      setSession(stored);
      setIsLoading(false);
    });
  }, []);

  const saveAndSetSession = useCallback(async (newSession: UserSession) => {
    await saveSession(newSession);
    setSession(newSession);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, saveAndSetSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
