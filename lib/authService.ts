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
  email: 'qadirdadkazi@gmail.com',
  fullName: 'Admin User',
  role: 'admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Function to initialize the default admin user (call this explicitly when needed)
const createDefaultAdmin = async (): Promise<boolean> => {
  try {
    const existingUser = await storage.getUser();
    
    if (!existingUser) {
      // If no user exists, create the admin user
      await storage.setUser(adminUser);
      console.log('Created admin user');
      return true;
    } else if (existingUser.email === adminUser.email) {
      // If admin user exists, update it
      await storage.setUser(adminUser);
      console.log('Updated admin user');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing default admin:', error);
    return false;
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

      // Special case: If signing in with admin email, ensure admin user exists
      if (email.toLowerCase() === adminUser.email.toLowerCase()) {
        await createDefaultAdmin();
        const adminUserFromStorage = await storage.getUser();
        if (adminUserFromStorage) {
          return { user: adminUserFromStorage, error: null };
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

  // Sign out
  signOut: async (keepGuest: boolean = true): Promise<{ error: string | null }> => {
    try {
      const currentUser = await storage.getUser();
      await storage.clearAll();
      
      // If keepGuest is true and the current user isn't already a guest, sign in as guest
      if (keepGuest && currentUser?.role !== 'guest') {
        await authService.signInAsGuest();
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: 'Failed to sign out. Please try again.' };
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
