import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string, role: string, pdfFile: File) => Promise<void>;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "velo_user";

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while reading storage

  // Rehydrate session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (u: User) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  // Replace these with your real API calls
  const login = async (email: string, _password: string) => {
    // TODO: await api.post("/auth/login", { email, password })
    const u: User = { email };
    persist(u);
  };

  const loginWithGoogle = async () => {
    // TODO: integrate Google OAuth flow
    const u: User = { email: "google-user@gmail.com", name: "Google User" };
    persist(u);
  };

  const signup = async (name: string, email: string, _password: string, role: string, pdfFile: File) => {
    // TODO: await api.post("/auth/signup", { name, email, password })
    const u: User = { email, name, role };
    persist(u);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}