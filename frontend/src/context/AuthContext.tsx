import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { loadFromSupabase, syncProfileToSupabase, syncAchievementToSupabase } from '../utils/supabaseSync';
import { initSupabaseSync } from '../utils/profileStorage';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string, name: string, dob: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => null,
  signUpWithEmail: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mutable ref so profileStorage can call sync without re-renders
  const userRef = { current: user };
  userRef.current = user;

  // Wire up profileStorage sync once on mount
  useState(() => {
    initSupabaseSync(
      (userId, profile) => syncProfileToSupabase(userId, profile),
      (userId, achievementId) => syncAchievementToSupabase(userId, achievementId),
      () => userRef.current?.id ?? null,
    );
  });

  const handleSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    if (newSession?.user) {
      // Merge remote Supabase data into localStorage
      await loadFromSupabase(newSession.user.id, newSession);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session).finally(() => setLoading(false));
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/profile' },
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return 'Supabase not configured';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string,
    dob: string,
  ): Promise<string | null> => {
    if (!supabase) return 'Supabase not configured';
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      // Store name + date_of_birth in profiles table immediately
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        date_of_birth: dob,
        updated_at: new Date().toISOString(),
      });
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
