import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { getRegisteredEvents } from '@/services/storage';
import { Event } from '@/types';
import { Calendar, Clock, MapPin, ChevronRight, ArrowLeft } from 'lucide-react-native';

export default function RegisteredEventsScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegisteredEvents();
  }, []);

  const loadRegisteredEvents = async () => {
    setLoading(true);
    try {
      const data = await getRegisteredEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load your registered events. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/event-details/${item.id}`)}
    >
      <View style={styles.eventDetails}>
        <Text style={[styles.eventName, { color: colors.text }]}>{item.name}</Text>
        
        <View style={styles.eventMetadata}>
          <View style={styles.metadataItem}>
            <Calendar size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text style={[styles.metadataText, { color: colors.text }]}>
              {format(new Date(item.date), 'MMMM d, yyyy')}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Clock size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text style={[styles.metadataText, { color: colors.text }]}>
              {item.time}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <MapPin size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text style={[styles.metadataText, { color: colors.text }]}>
              {item.venue}
            </Text>
          </View>
        </View>
      </View>
      
      <ChevronRight size={20} color={colors.subtext} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Registered Events',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={loadRegisteredEvents}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Registered Events
          </Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            You haven't registered for any events yet.
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventMetadata: {
    marginTop: 4,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataIcon: {
    marginRight: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});