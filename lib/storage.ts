import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const USER_KEY = '@user';
const TOKEN_KEY = '@token';
const DATA_PREFIX = '@data_';
const EVENTS_KEY = `${DATA_PREFIX}events`;
const REGISTRATIONS_KEY = `${DATA_PREFIX}registrations`;
const PROFILES_KEY = `${DATA_PREFIX}profiles`;
const COMMENTS_KEY = `${DATA_PREFIX}comments`;
const LIKES_KEY = `${DATA_PREFIX}likes`;

import type { User, UserProfile as IUserProfile, UserPushToken as IUserPushToken } from '@/types';

// Re-export types for backward compatibility
export type { User };

// Export the interfaces for use in other files
export type { IUserProfile as UserProfile, IUserPushToken as UserPushToken };

export type Event = {
  id: string;
  title: string;
  name?: string; // For backward compatibility
  description: string;
  date: string;
  time: string;
  location?: string;
  venue?: string; // Alternative to location
  capacity: number;
  category: string;
  imageUrl?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  popularity?: number;
  organizer?: string;
};

export type Registration = {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: string;
  updatedAt: string;
};

// Using imported IUserProfile type instead of redeclaring

// Using imported IUserPushToken type instead of redeclaring

export type Comment = {
  id: string;
  eventId: string;
  content: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommentLike = {
  id: string;
  commentId: string;
  userId: string;
  createdAt: string;
};

// Initialize default data if needed
const initializeDefaultData = async () => {
  try {
    // Initialize events if empty
    const events = await AsyncStorage.getItem(EVENTS_KEY);
    if (!events) {
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify([]));
    }

    // Initialize registrations if empty
    const registrations = await AsyncStorage.getItem(REGISTRATIONS_KEY);
    if (!registrations) {
      await AsyncStorage.setItem(REGISTRATIONS_KEY, JSON.stringify([]));
    }

    // Initialize profiles if empty
    const profiles = await AsyncStorage.getItem(PROFILES_KEY);
    if (!profiles) {
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Call initialization
initializeDefaultData();

export const storage = {
  // User
  async getUser(): Promise<User | null> {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async setUser(user: User | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  },

  // Token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string | null): Promise<void> {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  // Clear all auth data
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
    ]);
  },

  // Generic data storage
  async getData<T = any>(key: string): Promise<T | null> {
    const data = await AsyncStorage.getItem(`${DATA_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  },

  async setData<T = any>(key: string, data: T): Promise<void> {
    await AsyncStorage.setItem(`${DATA_PREFIX}${key}`, JSON.stringify(data));
  },

  async removeData(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${DATA_PREFIX}${key}`);
  },

  async clearAllData(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    // Don't remove push tokens when clearing other data
    const dataKeys = keys.filter(key => key.startsWith(DATA_PREFIX) && !key.includes('push_token_'));
    await AsyncStorage.multiRemove(dataKeys);
  },
  
  async clearAllPushTokens(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const pushTokenKeys = keys.filter(key => key.includes('push_token_'));
    await AsyncStorage.multiRemove(pushTokenKeys);
  },

  // Clear everything (auth + data)
  async clearEverything(): Promise<void> {
    await this.clearAll();
    await this.clearAllData();
  },

  // Events
  async getEvents(): Promise<Event[]> {
    const events = await AsyncStorage.getItem(EVENTS_KEY);
    return events ? JSON.parse(events) : [];
  },

  async getEvent(id: string): Promise<Event | null> {
    const events = await this.getEvents();
    const eventData = events.find((event: Event) => event.id === id);
    if (!eventData) return null;

    const formattedEvent: Event = {
      id: eventData.id,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '12:00',
      location: eventData.location || 'TBD',
      category: eventData.category || 'general',
      capacity: eventData.capacity || 0,
      imageUrl: eventData.imageUrl || 'https://via.placeholder.com/400x300',
      creatorId: eventData.creatorId || '',
      createdAt: eventData.createdAt || new Date().toISOString(),
      updatedAt: eventData.updatedAt || new Date().toISOString(),
    };

    return formattedEvent;
  },

  async saveEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Event> {
    const events = await this.getEvents();
    const now = new Date().toISOString();
    
    if (event.id) {
      // Update existing event
      const index = events.findIndex((e: Event) => e.id === event.id);
      if (index !== -1) {
        const existingEvent = events[index];
        events[index] = { 
          ...existingEvent,
          ...event,
          updatedAt: now,
          // Ensure creatorId is preserved
          creatorId: event.creatorId || existingEvent.creatorId
        };
        await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
        return events[index];
      }
    }
    
    // Create new event
    const newEvent: Event = {
      ...event,
      id: event.id || uuidv4(),
      creatorId: event.creatorId || '',
      createdAt: now,
      updatedAt: now,
    };
    
    events.push(newEvent);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    return newEvent;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const events = await this.getEvents();
    const filtered = events.filter((event: Event) => event.id !== id);
    
    if (filtered.length < events.length) {
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(filtered));
      return true;
    }
    
    return false;
  },

  // Registrations
  async getRegistrations(): Promise<Registration[]> {
    const registrations = await AsyncStorage.getItem(REGISTRATIONS_KEY);
    return registrations ? JSON.parse(registrations) : [];
  },

  async getRegistration(id: string): Promise<Registration | null> {
    const registrations = await this.getRegistrations();
    return registrations.find((r: Registration) => r.id === id) || null;
  },

  async getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    const registrations = await this.getRegistrations();
    return registrations.filter((r: Registration) => r.eventId === eventId);
  },

  async getRegistrationsByUser(userId: string): Promise<Registration[]> {
    const registrations = await this.getRegistrations();
    return registrations.filter((r: Registration) => r.userId === userId);
  },

  async saveRegistration(registration: Omit<Registration, 'id' | 'registeredAt' | 'updatedAt'> & { id?: string }): Promise<Registration> {
    const registrations = await this.getRegistrations();
    const now = new Date().toISOString();
    
    if (registration.id) {
      // Update existing registration
      const index = registrations.findIndex((r: Registration) => r.id === registration.id);
      if (index !== -1) {
        registrations[index] = {
          ...registrations[index],
          ...registration,
          updatedAt: now,
        };
        await AsyncStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
        return registrations[index];
      }
    }
    
    // Create new registration
    const newRegistration: Registration = {
      ...registration,
      id: registration.id || uuidv4(),
      registeredAt: now,
      updatedAt: now,
    };
    
    registrations.push(newRegistration);
    await AsyncStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
    return newRegistration;
  },

  async deleteRegistration(id: string): Promise<boolean> {
    const registrations = await this.getRegistrations();
    const filtered = registrations.filter((r: Registration) => r.id !== id);
    
    if (filtered.length < registrations.length) {
      await AsyncStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(filtered));
      return true;
    }
    
    return false;
  },

  // User Profiles
  async getUserProfiles(): Promise<IUserProfile[]> {
    const profiles = await AsyncStorage.getItem(PROFILES_KEY);
    return profiles ? JSON.parse(profiles) : [];
  },

  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    const profiles = await this.getUserProfiles();
    return profiles.find((p: IUserProfile) => p.userId === userId) || null;
  },

  async saveUserProfile(profile: Omit<IUserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<IUserProfile> {
    const profiles = await this.getUserProfiles();
    const now = new Date().toISOString();
    
    // Check if profile exists for user
    const existingIndex = profiles.findIndex((p: IUserProfile) => p.userId === profile.userId);
    
    if (existingIndex !== -1) {
      // Update existing profile
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        ...profile,
        updatedAt: now,
      };
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      return profiles[existingIndex];
    }
    
    // Create new profile
    const newProfile: IUserProfile = {
      ...profile,
      id: profile.id || uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    profiles.push(newProfile);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return newProfile;
  },

  // Helper to get user with profile
  async getUserWithProfile(userId: string): Promise<{ user: User | null; profile: IUserProfile | null }> {
    const profiles = await this.getUserProfiles();
    const profile = profiles.find(p => p.userId === userId) || null;
    // In a real app, you might want to fetch the user from your users list
    return { user: null, profile };
  },

  // Comments
  async getComments(): Promise<Comment[]> {
    return (await this.getData<Comment[]>(COMMENTS_KEY)) || [];
  },

  async getCommentsByEvent(eventId: string): Promise<Comment[]> {
    const comments = await this.getComments();
    return comments.filter(comment => comment.eventId === eventId);
  },

  async getComment(id: string): Promise<Comment | null> {
    const comments = await this.getComments();
    return comments.find(comment => comment.id === id) || null;
  },

  async saveComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Comment> {
    const comments = await this.getComments();
    const now = new Date().toISOString();
    
    if (comment.id) {
      // Update existing comment
      const index = comments.findIndex(c => c.id === comment.id);
      if (index !== -1) {
        const updatedComment = {
          ...comments[index],
          ...comment,
          updatedAt: now
        };
        comments[index] = updatedComment;
        await this.setData(COMMENTS_KEY, comments);
        return updatedComment;
      }
    }
    
    // Create new comment
    const newComment: Comment = {
      ...comment,
      id: comment.id || uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    await this.setData(COMMENTS_KEY, [...comments, newComment]);
    return newComment;
  },

  async deleteComment(id: string): Promise<boolean> {
    const comments = await this.getComments();
    const filtered = comments.filter(comment => comment.id !== id);
    
    if (filtered.length === comments.length) {
      return false; // No comment was deleted
    }
    
    // Also delete any replies to this comment
    const filteredReplies = filtered.filter(comment => comment.parentId !== id);
    await this.setData(COMMENTS_KEY, filteredReplies);
    
    // Delete associated likes
    await this.deleteLikesByComment(id);
    
    return true;
  },

  // Comment Likes
  async getLikes(): Promise<CommentLike[]> {
    return (await this.getData<CommentLike[]>(LIKES_KEY)) || [];
  },

  async getLikesByComment(commentId: string): Promise<CommentLike[]> {
    const likes = await this.getLikes();
    return likes.filter(like => like.commentId === commentId);
  },

  async getLikesByUser(userId: string): Promise<CommentLike[]> {
    const likes = await this.getLikes();
    return likes.filter(like => like.userId === userId);
  },

  async addLike(commentId: string, userId: string): Promise<CommentLike | null> {
    const likes = await this.getLikes();
    const existingLike = likes.find(like => like.commentId === commentId && like.userId === userId);
    
    if (existingLike) {
      return existingLike; // Already liked
    }
    
    const newLike: CommentLike = {
      id: uuidv4(),
      commentId,
      userId,
      createdAt: new Date().toISOString(),
    };
    
    await this.setData(LIKES_KEY, [...likes, newLike]);
    return newLike;
  },

  async removeLike(commentId: string, userId: string): Promise<boolean> {
    const likes = await this.getLikes();
    const filtered = likes.filter(like => !(like.commentId === commentId && like.userId === userId));
    
    if (filtered.length === likes.length) {
      return false; // No like was removed
    }
    
    await this.setData(LIKES_KEY, filtered);
    return true;
  },

  async deleteLikesByComment(commentId: string): Promise<void> {
    const likes = await this.getLikes();
    const filtered = likes.filter(like => like.commentId !== commentId);
    await this.setData(LIKES_KEY, filtered);
  },

  async deleteLikesByUser(userId: string): Promise<void> {
    const likes = await this.getLikes();
    const filtered = likes.filter(like => like.userId !== userId);
    await this.setData(LIKES_KEY, filtered);
  },

  // Push Tokens
  async setUserPushToken(userId: string, tokenData: Omit<IUserPushToken, 'updatedAt'>): Promise<void> {
    const token: IUserPushToken = {
      ...tokenData,
      updatedAt: new Date().toISOString()
    };
    await this.setData(`${DATA_PREFIX}push_token_${userId}`, token);
  },

  async getUserPushToken(userId: string): Promise<IUserPushToken | null> {
    return await this.getData<IUserPushToken>(`${DATA_PREFIX}push_token_${userId}`);
  },

  async removeUserPushToken(userId: string): Promise<void> {
    const key = `${DATA_PREFIX}push_token_${userId}`;
    await AsyncStorage.removeItem(key);
  },
};
