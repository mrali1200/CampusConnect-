/**
 * Mock Authentication Service
 * This is a temporary solution for development purposes only.
 * In production, you should use the real Supabase authentication.
 */

import { User } from '@supabase/supabase-js';

// Mock user data
const MOCK_USERS = [
  {
    id: 'mock-user-1',
    email: 'student@example.com',
    user_metadata: {
      full_name: 'Student User',
      avatar_url: 'https://ui-avatars.com/api/?name=Student+User&background=0D8ABC&color=fff',
    },
  },
  {
    id: 'mock-user-2',
    email: 'organizer@example.com',
    user_metadata: {
      full_name: 'Event Organizer',
      avatar_url: 'https://ui-avatars.com/api/?name=Event+Organizer&background=0D8ABC&color=fff',
    },
  },
];

// Mock authentication state
let currentUser: User | null = null;
let authListeners: ((user: User | null) => void)[] = [];

export const mockAuth = {
  // Get the current user
  getCurrentUser: () => currentUser,
  
  // Sign in with email and password
  signInWithEmail: async (email: string, password: string) => {
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (user) {
      // Create a proper User object with all required fields
      currentUser = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'authenticated',
      } as unknown as User;
      
      authListeners.forEach(listener => listener(currentUser));
      return { data: { user: currentUser }, error: null };
    }
    
    return { data: { user: null }, error: new Error('Invalid credentials') };
  },
  
  // Sign up with email and password
  signUpWithEmail: async (email: string, password: string, metadata: any) => {
    const newUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: {
        full_name: metadata.full_name || 'New User',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.full_name || 'New User')}&background=0D8ABC&color=fff`,
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'authenticated',
    } as unknown as User;
    
    // Add to mock users list with proper type
    MOCK_USERS.push({
      id: newUser.id,
      email: newUser.email as string,
      user_metadata: {
        full_name: newUser.user_metadata?.full_name || 'New User',
        avatar_url: newUser.user_metadata?.avatar_url || '',
      },
    });
    
    currentUser = newUser;
    authListeners.forEach(listener => listener(currentUser));
    
    return { data: { user: currentUser }, error: null };
  },
  
  // Sign out
  signOut: async () => {
    currentUser = null;
    authListeners.forEach(listener => listener(null));
    return { error: null };
  },
  
  // Subscribe to auth changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    authListeners.push(callback);
    // Call immediately with current state
    callback(currentUser);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners = authListeners.filter(listener => listener !== callback);
          },
        },
      },
    };
  },
};
