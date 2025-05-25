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
  organizer?: string;
}