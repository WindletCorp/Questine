"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCachedSession, refreshSession, type CachedSession } from "./session";
import { createSupabaseBrowserClient } from "../supabase/client";

interface AuthContextType {
  session: CachedSession | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CachedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      // 1. Instantly check local cache
      const cached = await getCachedSession();
      if (cached) {
        setSession(cached);
        setIsLoading(false); // We have enough to render immediately
      }

      // 2. Refresh in background (if online)
      const fresh = await refreshSession();
      setSession(fresh);
      
      // If we didn't end loading earlier because there was no cache, end it now
      if (!cached) {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const logout = async () => {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    setSession(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
