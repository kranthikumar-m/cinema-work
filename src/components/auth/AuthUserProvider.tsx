"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/types/auth";

interface AuthUserContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load the current session.");
  }

  const payload = (await response.json()) as { user?: AuthUser | null };
  return payload.user ?? null;
}

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    setIsLoading(true);

    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const nextUser = await fetchCurrentUser();

        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthUserContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthUserContext);

  if (!context) {
    throw new Error("useAuthUser must be used within AuthUserProvider.");
  }

  return context;
}

export function useOptionalAuthUser() {
  return useContext(AuthUserContext);
}
