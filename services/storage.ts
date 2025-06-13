import AsyncStorage from '@react-native-async-storage/async-storage';

// User related storage
export const getUserId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('userId');
};

export const setUserId = async (userId: string): Promise<void> => {
  await AsyncStorage.setItem('userId', userId);
};

// Event related storage
export const isEventRegistered = async (eventId: string): Promise<boolean> => {
  const registeredEvents = await AsyncStorage.getItem('registeredEvents');
  if (!registeredEvents) return false;
  return JSON.parse(registeredEvents).includes(eventId);
};

export const registerForEvent = async (event: any): Promise<void> => {
  const eventId = typeof event === 'string' ? event : event.id;
  const registeredEvents = await AsyncStorage.getItem('registeredEvents');
  const events = registeredEvents ? JSON.parse(registeredEvents) : [];
  if (!events.includes(eventId)) {
    events.push(eventId);
    await AsyncStorage.setItem('registeredEvents', JSON.stringify(events));
  }
};

export const getRegisteredEvents = async (): Promise<string[]> => {
  const registeredEvents = await AsyncStorage.getItem('registeredEvents');
  return registeredEvents ? JSON.parse(registeredEvents) : [];
};

// Theme storage
export const getStoredTheme = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('theme');
};

export const setStoredTheme = async (theme: string): Promise<void> => {
  await AsyncStorage.setItem('theme', theme);
};

// User preferences for recommendations
export const getUserPreferences = async (): Promise<string[]> => {
  try {
    const preferences = await AsyncStorage.getItem('userPreferences');
    return preferences ? JSON.parse(preferences) : [];
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return [];
  }
};

export const saveUserPreferences = async (preferences: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

// Feedback storage
const FEEDBACK_KEY = 'event_feedback';
const COMMENT_REACTIONS_KEY = 'comment_reactions';

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  type: 'like' | 'heart' | 'thumbsUp';
  createdAt: string;
}

// Feedback functions
export const saveFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Feedback> => {
  try {
    const storedFeedbacks = await AsyncStorage.getItem(FEEDBACK_KEY);
    const feedbacks: Feedback[] = storedFeedbacks ? JSON.parse(storedFeedbacks) : [];
    
    const now = new Date().toISOString();
    const newFeedback: Feedback = {
      ...feedback,
      id: feedback.id || Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    
    const updatedFeedbacks = [...feedbacks.filter(f => f.id !== feedback.id), newFeedback];
    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(updatedFeedbacks));
    
    return newFeedback;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

export const getFeedbackForEvent = async (eventId: string): Promise<Feedback[]> => {
  try {
    const storedFeedbacks = await AsyncStorage.getItem(FEEDBACK_KEY);
    const feedbacks: Feedback[] = storedFeedbacks ? JSON.parse(storedFeedbacks) : [];
    return feedbacks.filter(feedback => feedback.eventId === eventId);
  } catch (error) {
    console.error('Error getting feedback:', error);
    return [];
  }
};

export const saveCommentReaction = async (reaction: Omit<CommentReaction, 'id' | 'createdAt'> & { id?: string }): Promise<CommentReaction> => {
  try {
    const storedReactions = await AsyncStorage.getItem(COMMENT_REACTIONS_KEY);
    const reactions: CommentReaction[] = storedReactions ? JSON.parse(storedReactions) : [];
    
    // Remove any existing reaction from the same user to the same comment
    const filteredReactions = reactions.filter(
      r => !(r.userId === reaction.userId && r.commentId === reaction.commentId)
    );
    
    const now = new Date().toISOString();
    const newReaction: CommentReaction = {
      ...reaction,
      id: reaction.id || Date.now().toString(),
      createdAt: now,
    };
    
    const updatedReactions = [...filteredReactions, newReaction];
    await AsyncStorage.setItem(COMMENT_REACTIONS_KEY, JSON.stringify(updatedReactions));
    
    return newReaction;
  } catch (error) {
    console.error('Error saving comment reaction:', error);
    throw error;
  }
};

export const getCommentReactions = async (eventId: string): Promise<Record<string, CommentReaction>> => {
  try {
    const storedReactions = await AsyncStorage.getItem(COMMENT_REACTIONS_KEY);
    const reactions: CommentReaction[] = storedReactions ? JSON.parse(storedReactions) : [];
    
    // Filter reactions for the specific event and convert to a record
    const eventReactions = reactions.filter(r => {
      // Assuming commentId contains the eventId
      return r.commentId.startsWith(eventId);
    });
    
    // Convert array to record with commentId as key
    return eventReactions.reduce((acc, reaction) => ({
      ...acc,
      [reaction.commentId]: reaction
    }), {});
  } catch (error) {
    console.error('Error getting comment reactions:', error);
    return {};
  }
};

// Event tags and categories
export const getTagsForEvent = async (eventId: string): Promise<string[]> => {
  try {
    const eventTags = await AsyncStorage.getItem(`eventTags_${eventId}`);
    return eventTags ? JSON.parse(eventTags) : [];
  } catch (error) {
    console.error(`Error getting tags for event ${eventId}:`, error);
    return [];
  }
};

export const saveTagsForEvent = async (eventId: string, tags: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`eventTags_${eventId}`, JSON.stringify(tags));
  } catch (error) {
    console.error(`Error saving tags for event ${eventId}:`, error);
  }
};