import React, { createContext, useContext, useState } from "react";
import { User, SignupFormData, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (
    email: string,
    password: string,
    role: "spectator" | "jockey",
  ) => {
    setIsLoading(true);
    try {
      // Mock authentication - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser({
        id: Math.random().toString(36).substr(2, 9),
        username: email.split("@")[0],
        email,
        role,
        certificateUploaded: role === "jockey" ? true : false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // Mock registration - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Don't auto-login, user should login manually
      // This just validates the registration was successful
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
