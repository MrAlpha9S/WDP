import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authService } from "../api/loginService";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string, role: string, pdfFile: File) => Promise<void>;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

import { STORAGE_KEY, TOKEN_KEY } from "../utils/constants";

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while reading storage

  // Rehydrate session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          const res = await authService.getCurrentUser();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const persist = (u: User, token: string) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem(TOKEN_KEY, token);
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authService.login({ email, password });
    if (res.code === 200 && res.data?.accessToken) {
      const u = res.data.user || { email, role: res.data.user?.role };
      persist(u, res.data.accessToken);
      return u;
    } else {
      throw new Error(res.message || "Login failed");
    }
  };

  const loginWithGoogle = async () => {
    // TODO: integrate Google OAuth flow proper if needed or assume popup flow
    // For now we'll throw an error or mock if there's no actual data passed
    throw new Error("Google login not fully implemented yet");
  };

  const signup = async (name: string, email: string, password: string, role: string, pdfFile: File) => {
    // Generate a username from the email handle
    const username = email.split('@')[0];

    // Build multipart/form-data so the PDF is sent alongside the text fields
    const formData = new FormData();
    formData.append('username', username);
    formData.append('fullName', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    if (pdfFile) {
      formData.append('license', pdfFile, pdfFile.name);
    }

    const res = await authService.register(formData);
    if (res.code === 201 && res.data?.accessToken) {
      persist(res.data.user || { email, name, role }, res.data.accessToken);
    } else {
      throw new Error(res.message || "Signup failed");
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
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