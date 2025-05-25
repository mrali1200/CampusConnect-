import { Event } from '@/types';

// Temporary mock data for events
const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Welcome Week Orientation',
    description: 'Join us for the campus welcome week orientation!',
    date: new Date().toISOString(),
    time: '10:00',
    venue: 'Main Auditorium',
    category: 'Academic',
    popularity: 100,
    imageUrl: 'https://picsum.photos/400/300',
    organizer: 'Student Affairs Office'
  },
  {
    id: '2',
    name: 'Campus Sports Day',
    description: 'Annual sports day with various competitions',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    time: '14:00',
    venue: 'Sports Complex',
    category: 'Sports',
    popularity: 85,
    imageUrl: 'https://picsum.photos/400/300',
    organizer: 'Athletics Department'
  }
];

/**
 * Fetch all events
 * @returns {Promise<Event[]>} List of all events
 */
export const fetchEvents = async (): Promise<Event[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockEvents;
};

/**
 * Fetch a single event by ID
 * @param {string} id - The ID of the event to fetch
 * @returns {Promise<Event>} The event with the specified ID
 */
export const fetchEventById = async (id: string): Promise<Event> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const event = mockEvents.find(event => event.id === id);
  
  if (!event) {
    throw new Error(`Event with ID ${id} not found`);
  }
  
  return event;
};