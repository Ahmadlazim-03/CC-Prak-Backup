"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isAuthConfigured } from "@/lib/supabase-browser";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isAuthConfigured();

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb) throw new Error("Login belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_ANON_KEY kosong).");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const sb = getSupabaseBrowser();
    if (!sb) throw new Error("Login belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_ANON_KEY kosong).");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      const sb = getSupabaseBrowser();
      if (!sb) throw new Error("Registrasi belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_ANON_KEY kosong).");
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      // Bila email confirmation aktif, session belum ada → perlu konfirmasi.
      return { needsConfirm: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        configured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
