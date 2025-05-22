import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import AIRecommender from '@/components/recommendations/AIRecommender';
import EventHorizontalList from '@/components/events/EventHorizontalList';
import { fetchEvents } from '@/services/api';
import { getUserPreferences } from '@/services/storage';
import { Event } from '@/types';

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventsAndRecommendations();
  }, []);

  const loadEventsAndRecommendations = async () => {
    setLoading(true);
    try {
      const events = await fetchEvents();
      setAllEvents(events);
      
      // Get popular events
      const popular = [...events].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
      setPopularEvents(popular);
      
      // Initial empty recommendations (will be populated by AIRecommender)
      setRecommendedEvents([]);
    } catch (err) {
      setError('Failed to load recommendations. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationsGenerated = (events: Event[]) => {
    setRecommendedEvents(events);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'For You',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Recommender Component (Hidden - just processes data) */}
          <AIRecommender 
            allEvents={allEvents} 
            onRecommendationsGenerated={handleRecommendationsGenerated} 
          />
          
          {/* Recommended Events Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended For You
            </Text>
            {recommendedEvents.length > 0 ? (
              <EventHorizontalList events={recommendedEvents} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  Register for events to get personalized recommendations.
                </Text>
              </View>
            )}
          </View>
          
          {/* Popular Events Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Popular on Campus
            </Text>
            <EventHorizontalList events={popularEvents} />
          </View>
          
          {/* Upcoming This Week */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Happening This Week
            </Text>
            <EventHorizontalList 
              events={allEvents.filter(event => {
                const eventDate = new Date(event.date);
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                return eventDate >= today && eventDate <= nextWeek;
              }).slice(0, 5)}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});