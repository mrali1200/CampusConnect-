import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Clock, Tag } from 'lucide-react-native';

export default function ManageEventsScreen() {
  const { colors } = useTheme(); 
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  // Define the Event interface
  interface Event {
    id: string;
    name: string;
    description: string;
    date: string;
    time: string;
    location: string;
    venue: string;
    category: string;
    capacity: number;
    image_url?: string;
  }

  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      Alert.alert('Unauthorized', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }

    loadEvents();
  }, [isAdmin]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleEditEvent = (eventId: string): void => {
    router.push(`/admin/edit-event/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string): Promise<void> => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // First delete all registrations for this event
              const { error: regError } = await supabase
                .from('registrations')
                .delete()
                .eq('event_id', eventId);

              if (regError) throw regError;

              // Then delete the event
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

              if (error) throw error;

              // Update the local state
              setEvents(events.filter(event => event.id !== eventId));
              Alert.alert('Success', 'Event deleted successfully');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderEventItem = ({ item }: { item: Event }): React.ReactElement => {
    const eventDate = new Date(item.date);
    const isPastEvent = eventDate < new Date();

    return (
      <View 
        style={[
          styles.eventCard, 
          { backgroundColor: colors.card },
          isPastEvent && styles.pastEventCard
        ]}
      >
        <View style={styles.eventImageContainer}>
          <Image
            source={{ uri: item.image_url || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' }}
            style={styles.eventImage}
          />
          <View 
            style={[
              styles.categoryBadge, 
              { backgroundColor: isPastEvent ? colors.subtext : colors.primary }
            ]}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text 
            style={[
              styles.eventTitle, 
              { color: colors.text },
              isPastEvent && { color: colors.subtext }
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Calendar size={16} color={isPastEvent ? colors.subtext : colors.primary} style={styles.detailIcon} />
              <Text 
                style={[
                  styles.detailText, 
                  { color: colors.text },
                  isPastEvent && { color: colors.subtext }
                ]}
              >
                {format(new Date(item.date), 'MMM d, yyyy')}
              </Text>
            </View>

            <View style={styles.eventDetailItem}>
              <Clock size={16} color={isPastEvent ? colors.subtext : colors.primary} style={styles.detailIcon} />
              <Text 
                style={[
                  styles.detailText, 
                  { color: colors.text },
                  isPastEvent && { color: colors.subtext }
                ]}
              >
                {item.time}
              </Text>
            </View>

            <View style={styles.eventDetailItem}>
              <MapPin size={16} color={isPastEvent ? colors.subtext : colors.primary} style={styles.detailIcon} />
              <Text 
                style={[
                  styles.detailText, 
                  { color: colors.text },
                  isPastEvent && { color: colors.subtext }
                ]}
                numberOfLines={1}
              >
                {item.venue}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
              onPress={() => handleEditEvent(item.id)}
            >
              <Edit size={18} color={colors.secondary} />
              <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
              onPress={() => handleDeleteEvent(item.id)}
            >
              <Trash2 size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Events',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No events found. Create your first event!
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/admin/create-event')}
              >
                <Text style={styles.createButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {!loading && events.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/admin/create-event')}
        >
          <Text style={styles.floatingButtonText}>+ New Event</Text>
        </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventImageContainer: {
    position: 'relative',
    height: 120,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
