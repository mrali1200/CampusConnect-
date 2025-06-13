export type UserRole = 'user' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  fullName: string;
  full_name?: string;  // For backward compatibility
  role: UserRole;
  avatarUrl?: string;
  avatar_url?: string;  // For backward compatibility
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;  // Allow additional properties
}

export type AuthResponse = {
  user: User | null;
  error: string | null;
};

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  major?: string;
  year?: string;
  interests?: string[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPushToken {
  userId: string;
  pushToken: string;
  deviceType: string;
  updatedAt: string;
}
