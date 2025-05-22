import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Type assertion for Supabase v1 API
// This helps TypeScript understand the older API format
type SupabaseV1Auth = {
  session: () => Session | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => { data: any };
};

// Cast supabase.auth to the v1 format
const auth = supabase.auth as unknown as SupabaseV1Auth;

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
  } | null;
  isLoading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthState['profile']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // For Supabase v1.35.7
    // Get current session
    const session = auth.session();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      loadUserProfile(session.user.id);
    }

    // Listen for auth changes
    const { data: authListener } = auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Cleanup subscription
    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // For Supabase v1.35.7
    const { error, user } = await auth.signUp(
      email,
      password
    );
    
    // If signup successful, update the profile with full name
    if (user && !error) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: email,
          updated_at: new Date().toISOString()
        });
        
      if (profileError) throw profileError;
    }
    
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    // For Supabase v1.35.7
    const { error } = await auth.signIn(
      email,
      password
    );

    if (error) throw error;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setIsLoading(false);
  };

  const signOut = async () => {
    // If in guest mode, just reset the guest state
    if (isGuest) {
      setIsGuest(false);
      return;
    }
    
    // Otherwise, sign out from Supabase
    const { error } = await auth.signOut();
    if (error) throw error;
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    isGuest,
    signUp,
    signIn,
    continueAsGuest,
    signOut,
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}