"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // FIX: createClient() must be stable — creating it in the component body
  // produces a new object reference on every render, which makes the useEffect
  // below re-fire (supabase is in its dep array), which calls setUser(),
  // which re-renders, which creates a new supabase client... infinite loop.
  // useRef gives us one stable instance for the lifetime of this component.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Session error:", error.message);
          if (error.message.includes("Refresh Token")) {
            await supabase.auth.signOut();
          }
        }

        if (!mounted) return;
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // FIX: empty dep array — supabase is now stable via ref, no need
  // to list it here. This effect runs once on mount only.

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
