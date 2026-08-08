"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isOnline = useNetworkStatus();
  
  const client = createSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session }, error } = await client.auth.getSession();
      
      if (mounted) {
        if (session) {
          setSession(session);
          setUser(session.user);
        } else if (error) {
          console.error("Auth session error:", error.message);
        }
        setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  // Handle routing based on auth state and network status
  useEffect(() => {
    if (loading) return;

    // Define routes that require authentication
    const protectedRoutes = ["/test"];
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !user) {
      if (!isOnline) {
        // If offline and unauthenticated, redirect to login
        router.replace("/login?redirectedFrom=" + encodeURIComponent(pathname));
      } else {
        // If online and unauthenticated, redirect to login
        router.replace("/login?redirectedFrom=" + encodeURIComponent(pathname));
      }
    }
  }, [user, loading, pathname, router, isOnline]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
