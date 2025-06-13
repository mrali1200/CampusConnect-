// Re-export all shared types
export * from './user';

// Re-export types from storage
export type { Event, Registration } from '@/lib/storage';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: 'registration' | 'like' | 'comment' | 'share';
  content?: string;
  event_id?: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  event_name?: string;
  event_image?: string;
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
}