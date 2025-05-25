export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  popularity: number;
  imageUrl: string;
  image_url?: string; // Alternative property name for image URL
  organizer?: string;
  categories?: Category[];
  tags?: string[];
  likes_count?: number;
  registrations_count?: number;
  created_at?: string;
  updated_at?: string;
}

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