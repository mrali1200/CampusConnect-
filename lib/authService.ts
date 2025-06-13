import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './storage';
import type { User, AuthResponse } from '@/types';

// Re-export the User type for backward compatibility
export type { User };

const STORAGE_KEY = '@CampusConnect:users';

// Guest user data
const guestUser: User = {
  id: 'guest-1',
  email: 'guest@example.com',
  fullName: 'Guest User',
  role: 'guest',
  avatarUrl: 'https://ui-avatars.com/api/?name=Guest+User&background=CCCCCC&color=000000',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Admin user data - only created when explicitly requested
const adminUser: User = {
  id: 'admin-1',
  email: 'admin@campusconnect.com', // Changed to a more generic email
  fullName: 'Admin User',
  role: 'admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Function to initialize the default admin user (must be called explicitly with correct credentials)
const createDefaultAdmin = async (email: string, password: string): Promise<{success: boolean, error?: string}> => {
  try {
    // In a real app, verify admin credentials before creating admin user
    if (email !== 'admin@campusconnect.com' || !password) {
      return { success: false, error: 'Invalid admin credentials' };
    }
    
    await storage.setUser(adminUser);
    console.log('Admin user created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return { success: false, error: 'Failed to create admin user' };
  }
};

export const authService = {
  // Create default admin user (call this explicitly when needed, e.g., in a setup screen)
  createDefaultAdmin,
  
  // Admin user data (readonly)
  get adminUser() {
    return { ...adminUser }; // Return a copy to prevent modification
  },
  // Get current user from storage
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const user = await storage.getUser();
      if (!user) {
        // If no user is logged in, sign in as guest
        const { user: guest, error } = await authService.signInAsGuest();
        return guest;
      }
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If there's an error, sign in as guest
      try {
        const { user: guest } = await authService.signInAsGuest();
        return guest;
      } catch (guestError) {
        console.error('Error signing in as guest:', guestError);
        return null;
      }
    }
  },

  // Sign in as guest
  signInAsGuest: async (): Promise<AuthResponse> => {
    try {
      // Set guest user in storage
      await storage.setUser(guestUser);
      console.log('Signed in as guest');
      return { user: guestUser, error: null };
    } catch (error) {
      console.error('Error signing in as guest:', error);
      return { user: null, error: 'Failed to sign in as guest' };
    }
  },

  // Check if current user is a guest
  isGuest: async (): Promise<boolean> => {
    const user = await storage.getUser();
    return user?.role === 'guest';
  },

  // Check if current user is an admin
  isAdmin: async (): Promise<boolean> => {
    const user = await storage.getUser();
    return user?.role === 'admin';
  },

  // Get current user role
  getUserRole: async (): Promise<string | null> => {
    const user = await storage.getUser();
    return user?.role || null;
  },

  // Sign in with email and password
  signInWithEmail: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!email || !password) {
        return { user: null, error: 'Please provide both email and password' };
      }

      // Special case: Admin login
      if (email.toLowerCase() === adminUser.email.toLowerCase()) {
        // In a real app, verify admin password with your backend
        // For demo purposes, we'll use a simple check
        if (password === 'admin123') { // CHANGE THIS IN PRODUCTION
          // Clear any existing user data first
          await storage.clearAll();
          // Set admin user
          await storage.setUser(adminUser);
          return { user: adminUser, error: null };
        } else {
          return { user: null, error: 'Invalid admin credentials' };
        }
      }

      // Get all users from storage
      const allUsers = await storage.getData<User[]>(STORAGE_KEY) || [];
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        console.log('User not found for email:', email);
        return { 
          user: null, 
          error: 'No account found with this email. Please sign up first.' 
        };
      }

      // In a real app, you would verify the hashed password here
      // For demo purposes, we'll check if the password is not empty
      if (!password.trim()) {
        console.log('Empty password provided');
        return { user: null, error: 'Please enter your password' };
      }
      
      // Set the current user in storage
      await storage.setUser(user);
      
      // Generate and save a token for the session
      const token = `token-${Date.now()}`;
      await storage.setToken(token);
      
      return { user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error: 'An error occurred during sign in' };
    }
  },

  // Sign up with email and password
  signUpWithEmail: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!email || !password || !fullName) {
        return { user: null, error: 'Please provide all required fields' };
      }

      // Get all users from storage
      const allUsers = await storage.getData<User[]>(STORAGE_KEY) || [];
      
      // Check if user already exists
      const userExists = allUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return { user: null, error: 'An account with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add default avatar URL
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=random`
      };

      // Save user to storage
      allUsers.push(newUser);
      await storage.setData(STORAGE_KEY, allUsers);
      await storage.setUser(newUser);
      
      // Generate and save a token for the session
      const token = `token-${Date.now()}`;
      await storage.setToken(token);

      console.log('New user created:', newUser.email);
      return { user: newUser, error: null };
    } catch (error) {
      console.error('Error during sign up:', error);
      return { 
        user: null, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  },

  /**
   * Signs out the current user and optionally signs in as a guest
   * @param keepGuest Whether to sign in as a guest after sign out
   * @returns Object with error message if any
   */
  signOut: async (keepGuest: boolean = true): Promise<{ error: string | null }> => {
    console.log('Starting sign out process, keepGuest:', keepGuest);
    let currentUser: User | null = null;
    
    try {
      // 1. Get current user before clearing anything
      currentUser = await storage.getUser();
      console.log('Current user before sign out:', currentUser?.email || 'none');
      
      // 2. Clear storage in a specific order
      try {
        // Clear sensitive data first
        await storage.clearAll();
        console.log('Storage cleared successfully');
        
        // Clear any remaining user data from AsyncStorage
        await AsyncStorage.multiRemove([
          '@CampusConnect:user',
          '@CampusConnect:token',
          '@CampusConnect:session',
        ]);
        console.log('AsyncStorage cleared successfully');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
        // Continue even if storage clearing fails
      }
      
      // 3. Handle guest sign-in if needed
      if (keepGuest && currentUser?.role !== 'guest') {
        console.log('Attempting to sign in as guest');
        try {
          await authService.signInAsGuest();
          console.log('Successfully signed in as guest');
        } catch (guestError) {
          console.error('Error signing in as guest after sign out:', guestError);
          // Don't fail the sign out process if guest sign-in fails
        }
      } else {
        console.log('Skipping guest sign-in');
      }
      
      return { error: null };
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      
      // Try to ensure we're in a clean state even if something went wrong
      try {
        await storage.clearAll();
        await AsyncStorage.multiRemove([
          '@CampusConnect:user',
          '@CampusConnect:token',
          '@CampusConnect:session',
        ]);
        
        // If we were supposed to be a guest but had an error, try one last time
        if (keepGuest && currentUser?.role !== 'guest') {
          try {
            await authService.signInAsGuest();
          } catch (e) {
            console.error('Final attempt to sign in as guest failed:', e);
          }
        }
      } catch (cleanupError) {
        console.error('Error during sign out cleanup:', cleanupError);
      }
      
      return { 
        error: 'An error occurred during sign out. Please try again.' 
      };
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    // For simplicity, we'll use a polling mechanism
    // In a real app, you might want to use a more efficient approach
    const intervalId = setInterval(async () => {
      try {
        const user = await authService.getCurrentUser();
        callback(user);
      } catch (error) {
        console.error('Error in auth state change:', error);
        callback(null);
      }
    }, 1000);

    // Initial callback
    authService.getCurrentUser().then(callback).catch(() => callback(null));

    // Return unsubscribe function
    return {
      unsubscribe: () => clearInterval(intervalId),
    };
  },
};

export default authService;
