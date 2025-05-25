import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { 
  getRegisteredEvents, 
  getUserPreferences, 
  saveUserPreferences, 
  getTagsForEvent,
  saveTagsForEvent
} from '@/services/storage';
import { Event } from '@/types';

interface AIRecommenderProps {
  allEvents: Event[];
  onRecommendationsGenerated: (recommendations: Event[]) => void;
}

// Define event tags for better categorization
const EVENT_TAGS = {
  ACADEMIC: ['lecture', 'seminar', 'workshop', 'study', 'research', 'academic', 'education', 'learning'],
  SOCIAL: ['party', 'mixer', 'social', 'networking', 'meetup', 'gathering'],
  SPORTS: ['game', 'match', 'tournament', 'sports', 'athletic', 'fitness', 'workout'],
  ARTS: ['performance', 'concert', 'exhibition', 'art', 'music', 'theater', 'dance'],
  CAREER: ['career', 'job', 'internship', 'professional', 'resume', 'interview'],
  TECHNOLOGY: ['tech', 'coding', 'programming', 'hackathon', 'technology', 'digital'],
};

// Time of day preferences
const TIME_PREFERENCES = {
  MORNING: '06:00-12:00',
  AFTERNOON: '12:00-17:00',
  EVENING: '17:00-21:00',
  NIGHT: '21:00-06:00'
};

export default function AIRecommender({ allEvents, onRecommendationsGenerated }: AIRecommenderProps) {
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [userTimePreference, setUserTimePreference] = useState<string | null>(null);
  const [userTagPreferences, setUserTagPreferences] = useState<string[]>([]);
  
  useEffect(() => {
    if (allEvents && allEvents.length > 0) {
      // Analyze and tag events when they're loaded
      analyzeAndTagEvents(allEvents);
      // Generate recommendations
      loadUserPreferencesAndGenerateRecommendations();
    }
  }, [allEvents]);
  
  /**
   * Analyze event descriptions and titles to extract relevant tags
   */
  const analyzeAndTagEvents = async (events: Event[]) => {
    try {
      for (const event of events) {
        // Check if event already has tags
        const existingTags = await getTagsForEvent(event.id);
        if (existingTags && existingTags.length > 0) {
          continue; // Skip if already tagged
        }
        
        const combinedText = `${event.name} ${event.description} ${event.category}`.toLowerCase();
        const tags: string[] = [];
        
        // Extract tags based on keywords in the event text
        Object.entries(EVENT_TAGS).forEach(([category, keywords]) => {
          if (keywords.some(keyword => combinedText.includes(keyword))) {
            tags.push(category);
          }
        });
        
        // Add the event's category as a tag if not already included
        if (event.category && !tags.includes(event.category.toUpperCase())) {
          tags.push(event.category.toUpperCase());
        }
        
        // Determine time of day preference based on event time
        if (event.time) {
          const [hours] = event.time.split(':').map(Number);
          if (hours >= 6 && hours < 12) {
            tags.push('MORNING');
          } else if (hours >= 12 && hours < 17) {
            tags.push('AFTERNOON');
          } else if (hours >= 17 && hours < 21) {
            tags.push('EVENING');
          } else {
            tags.push('NIGHT');
          }
        }
        
        // Save tags for this event
        if (tags.length > 0) {
          await saveTagsForEvent(event.id, tags);
        }
      }
    } catch (error) {
      console.error('Error analyzing and tagging events:', error);
    }
  };
  
  /**
   * Load user preferences and generate recommendations
   */
  const loadUserPreferencesAndGenerateRecommendations = async () => {
    try {
      // Try to load existing preferences
      let categoryPreferences = await getUserPreferences();
      
      // If no preferences exist, generate them from registered events
      if (!categoryPreferences || categoryPreferences.length === 0) {
        const generatedPreferences = await generatePreferencesFromRegisteredEvents();
        categoryPreferences = generatedPreferences.categories;
        setUserTimePreference(generatedPreferences.timePreference);
        setUserTagPreferences(generatedPreferences.tags);
      }
      
      setUserPreferences(categoryPreferences);
      
      // Generate recommendations based on preferences
      const recommendations = await generateRecommendations(categoryPreferences);
      onRecommendationsGenerated(recommendations);
      
    } catch (error) {
      console.error('Error in AI recommender:', error);
      onRecommendationsGenerated([]);
    }
  };
  
  /**
   * Generate user preferences based on registered events
   */
  const generatePreferencesFromRegisteredEvents = async (): Promise<{
    categories: string[];
    timePreference: string | null;
    tags: string[];
  }> => {
    try {
      const registeredEventIds = await getRegisteredEvents();
      
      if (registeredEventIds.length === 0) {
        return { categories: [], timePreference: null, tags: [] };
      }
      
      // Find registered events in allEvents
      const registeredEvents = allEvents.filter(event => 
        registeredEventIds.includes(event.id)
      );
      
      if (registeredEvents.length === 0) {
        return { categories: [], timePreference: null, tags: [] };
      }
      
      // Extract categories and count occurrences
      const categoryCounts: Record<string, number> = {};
      const timeCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      
      // Process each registered event
      for (const event of registeredEvents) {
        // Count categories
        if (event.category) {
          categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        }
        
        // Count time preferences
        if (event.time) {
          const [hours] = event.time.split(':').map(Number);
          let timeOfDay = '';
          
          if (hours >= 6 && hours < 12) timeOfDay = 'MORNING';
          else if (hours >= 12 && hours < 17) timeOfDay = 'AFTERNOON';
          else if (hours >= 17 && hours < 21) timeOfDay = 'EVENING';
          else timeOfDay = 'NIGHT';
          
          timeCounts[timeOfDay] = (timeCounts[timeOfDay] || 0) + 1;
        }
        
        // Get and count tags
        const eventTags = await getTagsForEvent(event.id);
        if (eventTags && eventTags.length > 0) {
          eventTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      }
      
      // Convert to arrays and sort by count (descending)
      const sortedCategories = Object.entries(categoryCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([category]) => category);
      
      // Find most preferred time of day
      const sortedTimes = Object.entries(timeCounts)
        .sort(([, countA], [, countB]) => countB - countA);
      
      const preferredTime = sortedTimes.length > 0 ? sortedTimes[0][0] : null;
      
      // Get top tags
      const sortedTags = Object.entries(tagCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([tag]) => tag)
        .slice(0, 5); // Top 5 tags
      
      // Save these preferences
      await saveUserPreferences(sortedCategories);
      
      return { 
        categories: sortedCategories, 
        timePreference: preferredTime, 
        tags: sortedTags 
      };
    } catch (error) {
      console.error('Error generating preferences:', error);
      return { categories: [], timePreference: null, tags: [] };
    }
  };
  
  /**
   * Generate personalized event recommendations
   */
  const generateRecommendations = async (preferences: string[]): Promise<Event[]> => {
    if (preferences.length === 0 || allEvents.length === 0) {
      return [];
    }
    
    // Filter future events
    const today = new Date();
    const futureEvents = allEvents.filter(event => 
      new Date(event.date) >= today
    );
    
    // Score each event based on multiple factors
    const scoredEvents = await Promise.all(futureEvents.map(async event => {
      let score = 0;
      
      // 1. Category preference score (0-50 points)
      const categoryIndex = preferences.indexOf(event.category);
      if (categoryIndex !== -1) {
        // Give higher score to categories that appear earlier in preferences
        score += Math.max(50 - (categoryIndex * 10), 10); // Max 50 points for top category
      }
      
      // 2. Tag matching score (0-30 points)
      const eventTags = await getTagsForEvent(event.id);
      if (eventTags && eventTags.length > 0 && userTagPreferences.length > 0) {
        const matchingTags = eventTags.filter(tag => userTagPreferences.includes(tag));
        score += matchingTags.length * 6; // 6 points per matching tag, max 30 points
      }
      
      // 3. Time preference score (0-20 points)
      if (userTimePreference && event.time) {
        const [hours] = event.time.split(':').map(Number);
        let eventTimeOfDay = '';
        
        if (hours >= 6 && hours < 12) eventTimeOfDay = 'MORNING';
        else if (hours >= 12 && hours < 17) eventTimeOfDay = 'AFTERNOON';
        else if (hours >= 17 && hours < 21) eventTimeOfDay = 'EVENING';
        else eventTimeOfDay = 'NIGHT';
        
        if (eventTimeOfDay === userTimePreference) {
          score += 20; // 20 points for matching preferred time of day
        }
      }
      
      // 4. Popularity score (0-20 points)
      score += Math.min(event.popularity / 5, 20); // Max 20 points for popularity
      
      // 5. Recency/urgency score (0-30 points)
      const daysUntilEvent = Math.max(
        0, 
        Math.floor((new Date(event.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );
      
      // Higher score for events happening soon, but not too soon (sweet spot: 2-7 days)
      if (daysUntilEvent <= 1) {
        score += 15; // Tomorrow or today
      } else if (daysUntilEvent <= 3) {
        score += 30; // 2-3 days away (highest priority)
      } else if (daysUntilEvent <= 7) {
        score += 25; // This week
      } else if (daysUntilEvent <= 14) {
        score += 15; // Next week
      } else {
        score += 5; // Further in the future
      }
      
      return { event, score };
    }));
    
    // Sort by score (descending) and return top 5
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.event);
  };
  
  // This component doesn't render anything visible
  return null;
}