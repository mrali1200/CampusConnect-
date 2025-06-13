import { storage } from '@/lib/storage';
import { Event } from '@/types';

// Fallback image URL
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

/**
 * Fetch all events
 * @returns {Promise<Event[]>} List of all events
 */
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const events = await storage.getEvents();
    // Ensure each event has an image URL
    return events.map(event => ({
      ...event,
      imageUrl: event.imageUrl || FALLBACK_IMAGE_URL,
      venue: event.venue || event.location || 'TBD',
      time: event.time || '10:00 AM',
      category: event.category || 'General'
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Fetch a single event by ID
 * @param {string} id - The ID of the event to fetch
 * @returns {Promise<Event>} The event with the specified ID
 */
export const fetchEventById = async (id: string): Promise<Event> => {
  try {
    const event = await storage.getEvent(id);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Ensure the event has required fields
    return {
      ...event,
      imageUrl: event.imageUrl || FALLBACK_IMAGE_URL,
      venue: event.venue || event.location || 'TBD',
      time: event.time || '10:00 AM',
      category: event.category || 'General'
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
};