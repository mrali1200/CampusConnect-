import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as storage from '@/lib/storage';
import authService, { type User } from '@/lib/authService';

// Types
type Session = {
  user: User;
  accessToken: string;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  isGuest: boolean;
  isAdmin: boolean;
  profile: User | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<boolean>; // Returns true if sign out was successful
  clearError: () => void;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Helper function to create a complete user object with defaults
const createCompleteUser = (user: Partial<User> & { email: string; id?: string }): User => {
  const now = new Date().toISOString();
  const name = user.fullName || user.email?.split('@')[0] || 'User';
  
  return {
    id: user.id || `user-${Date.now()}`,
    email: user.email,
    fullName: name,
    full_name: name, // For backward compatibility
    role: user.role || 'user',
    ...(user.avatarUrl && { 
      avatarUrl: user.avatarUrl,
      avatar_url: user.avatarUrl // For backward compatibility
    }),
    ...(user.createdAt && { createdAt: user.createdAt }),
    updatedAt: now,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    user: null as User | null,
    session: null as Session | null,
    loading: true,
    error: null as Error | null,
    isGuest: false,
    isAdmin: false,
    profile: null as User | null,
  });

  const { user, session, loading, error, isGuest, isAdmin, profile } = state;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          const isAdmin = currentUser.role === 'admin';
          const token = await storage.storage.getToken();
          
          setState({
            user: currentUser,
            session: token ? { user: currentUser, accessToken: token } : null,
            loading: false,
            error: null,
            isGuest: false,
            isAdmin,
            profile: {
              ...currentUser,
              full_name: currentUser.fullName,
              avatar_url: currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName || 'U')}`,
            },
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize auth'),
        }));
      }
    };

    initializeAuth();
    
    // Set up auth state change subscription
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        setState(prev => ({
          ...prev,
          user,
          isGuest: false,
          isAdmin: user.role === 'admin',
          profile: {
            ...user,
            full_name: user.fullName,
            avatar_url: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}`,
          },
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isGuest: false,
          isAdmin: false,
          profile: null,
        }));
      }
    });
    
    return () => unsubscribe.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      const error = new Error('Please provide both email and password');
      setState(prev => ({ ...prev, loading: false, error }));
      return { user: null, session: null };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { user, error: authError } = await authService.signInWithEmail(email, password);
      
      if (authError || !user) {
        throw new Error(authError || 'Failed to sign in');
      }
      
      // Get the token after successful sign in
      const token = await storage.storage.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const newSession = { user, accessToken: token };
      const isAdmin = user.role === 'admin';
      
      setState({
        user,
        session: newSession,
        loading: false,
        error: null,
        isGuest: false,
        isAdmin,
        profile: {
          ...user,
          full_name: user.fullName,
          avatar_url: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}`,
        },
      });
      
      return { user, session: newSession };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage)
      }));
      return { user: null, session: null };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Validate input
      if (!email || !password || !fullName) {
        throw new Error('Please fill in all fields');
      }

      // Validate email format
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { user, error: authError } = await authService.signUpWithEmail(email, password, fullName);
      
      if (authError || !user) {
        // Check if this is an 'email exists' error
        if (authError?.toLowerCase().includes('already exists')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(authError || 'Failed to create account. Please try again.');
      }
      
      // Get the token after successful sign up
      const token = await storage.storage.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const newSession = { user, accessToken: token };
      const isAdmin = user.role === 'admin';

      setState({
        user,
        session: newSession,
        loading: false,
        error: null,
        isGuest: false,
        isAdmin,
        profile: {
          ...user,
          full_name: user.fullName,
          avatar_url: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}`,
        },
      });
      
      return { user, session: newSession };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setState(prev => ({ ...prev, loading: false, error: new Error(errorMessage) }));
      return { user: null, session: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Optimistically update the UI to show loading state
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // First, get the current user to determine if we should keep guest state
      const currentUser = await authService.getCurrentUser();
      const wasGuest = currentUser?.role === 'guest';
      
      // Clear the state first to prevent any race conditions
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isGuest: false,
        isAdmin: false,
        profile: null,
      });
      
      // Then perform the actual sign out
      const { error } = await authService.signOut(!wasGuest); // Don't keep guest if already a guest
      
      if (error) {
        throw new Error(error);
      }
      
      // If we got here, sign out was successful
      return true;
    } catch (error) {
      console.error('Error during sign out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      
      // Update error state but don't throw - we want to keep the app in a usable state
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage)
      }));
      
      // Return false to indicate failure, but don't throw to prevent unhandled promise rejections
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const continueAsGuest = useCallback(async () => {
    try {
      // Create a guest user without saving to storage
      const guestUser = createCompleteUser({
        id: `guest-${Date.now()}`,
        email: `guest-${Date.now()}@example.com`,
        fullName: 'Guest User',
        role: 'guest',
        avatarUrl: 'https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff',
      });

      // Create a session without persisting it
      const session: Session = { 
        user: guestUser, 
        accessToken: `guest-token-${Date.now()}` 
      };

      // Update the state without persisting to storage
      setState({
        user: guestUser,
        session,
        loading: false,
        error: null,
        isGuest: true,
        isAdmin: false,
        profile: {
          ...guestUser,
          full_name: 'Guest User',
          avatar_url: 'https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff',
        },
      });
    } catch (error) {
      console.error('Error continuing as guest:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to continue as guest')
      }));
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    session,
    loading,
    error,
    isGuest,
    isAdmin,
    profile,
    signIn,
    signUp,
    signOut,
    clearError,
    continueAsGuest,
  }), [user, session, loading, error, isGuest, isAdmin, profile, signIn, signUp, signOut, clearError, continueAsGuest]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
