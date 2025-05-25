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