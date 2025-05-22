import React, { useEffect, useState } from 'react';
import { getRegisteredEvents, getUserPreferences, saveUserPreferences } from '@/services/storage';
import { Event } from '@/types';

interface AIRecommenderProps {
  allEvents: Event[];
  onRecommendationsGenerated: (recommendations: Event[]) => void;
}

export default function AIRecommender({ allEvents, onRecommendationsGenerated }: AIRecommenderProps) {
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  
  useEffect(() => {
    loadUserPreferencesAndGenerateRecommendations();
  }, [allEvents]);
  
  const loadUserPreferencesAndGenerateRecommendations = async () => {
    try {
      // Try to load existing preferences
      let preferences = await getUserPreferences();
      
      // If no preferences exist, generate them from registered events
      if (!preferences || preferences.length === 0) {
        preferences = await generatePreferencesFromRegisteredEvents();
      }
      
      setUserPreferences(preferences);
      
      // Generate recommendations based on preferences
      const recommendations = generateRecommendations(preferences);
      onRecommendationsGenerated(recommendations);
      
    } catch (error) {
      console.error('Error in AI recommender:', error);
      onRecommendationsGenerated([]);
    }
  };
  
  const generatePreferencesFromRegisteredEvents = async (): Promise<string[]> => {
    try {
      const registeredEvents = await getRegisteredEvents();
      
      if (registeredEvents.length === 0) {
        return [];
      }
      
      // Extract categories and count occurrences
      const categoryCounts: Record<string, number> = {};
      registeredEvents.forEach(event => {
        if (event.category) {
          categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        }
      });
      
      // Convert to array of categories, sort by count (descending)
      const sortedCategories = Object.entries(categoryCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([category]) => category);
      
      // Save these preferences
      await saveUserPreferences(sortedCategories);
      
      return sortedCategories;
    } catch (error) {
      console.error('Error generating preferences:', error);
      return [];
    }
  };
  
  const generateRecommendations = (preferences: string[]): Event[] => {
    if (preferences.length === 0 || allEvents.length === 0) {
      return [];
    }
    
    // Filter future events
    const today = new Date();
    const futureEvents = allEvents.filter(event => 
      new Date(event.date) >= today
    );
    
    // Score each event based on preferences
    const scoredEvents = futureEvents.map(event => {
      let score = 0;
      
      // Higher score for preferred categories
      const categoryIndex = preferences.indexOf(event.category);
      if (categoryIndex !== -1) {
        // Give higher score to categories that appear earlier in preferences
        score += (preferences.length - categoryIndex) * 10;
      }
      
      // Higher score for events with higher popularity
      score += event.popularity || 0;
      
      // Higher score for events happening sooner
      const daysUntilEvent = Math.max(
        0, 
        Math.floor((new Date(event.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );
      if (daysUntilEvent < 7) {
        score += (7 - daysUntilEvent) * 2; // Higher score for events within a week
      }
      
      return { event, score };
    });
    
    // Sort by score (descending) and return top 5
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.event);
  };
  
  // This component doesn't render anything visible
  return null;
}