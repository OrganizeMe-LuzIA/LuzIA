"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  EMAIL_STORAGE_KEY,
  LEGACY_PHONE_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  clearStoredSession,
} from "@/lib/auth/session";

interface AuthContextValue {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (token: string, email?: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedEmail =
      window.localStorage.getItem(EMAIL_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_PHONE_STORAGE_KEY);

    setToken(storedToken);
    setEmail(storedEmail);
    setIsLoading(false);
  }, []);

  const setSession = useCallback((nextToken: string, nextEmail?: string) => {
    setToken(nextToken);
    setEmail(nextEmail || null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      if (nextEmail) {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, nextEmail);
      }
    }
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setEmail(null);

    clearStoredSession();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      isAuthenticated: Boolean(token),
      isLoading,
      setSession,
      clearSession,
    }),
    [token, email, isLoading, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser utilizado dentro de AuthProvider.");
  }
  return context;
}
