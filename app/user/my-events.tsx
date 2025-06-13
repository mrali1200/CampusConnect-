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
import { storage, type Event, type Registration } from '@/lib/storage';
import { ArrowLeft, Calendar, Clock, MapPin, Tag } from 'lucide-react-native';

export default function MyEventsScreen() {
  const { colors } = useTheme(); 
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);


  // Define a type for registration with event data
  type RegistrationWithEvent = Registration & { event: Event };

  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to view your events.');
      router.replace('/sign-in');
      return;
    }

    loadUserEvents();
  }, [user, activeTab]);

  const loadUserEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all registrations for the current user
      const allRegistrations = await storage.getRegistrationsByUser(user.id);
      
      // Get all events to match with registrations
      const allEvents = await storage.getEvents();
      
      // Create a map of events for quick lookup
      const eventsMap = new Map(allEvents.map(event => [event.id, event]));
      
      // Map registrations to include event data
      const registrationsWithEvents = allRegistrations
        .map(reg => {
          const event = eventsMap.get(reg.eventId);
          return event ? { ...reg, event } : null;
        })
        .filter((reg): reg is Registration & { event: Event } => reg !== null);

          // Filter based on active tab
      const today = new Date();
      let filteredData: Array<Registration & { event: Event }> = [];

      if (activeTab === 'upcoming') {
        filteredData = registrationsWithEvents.filter(reg => 
          new Date(reg.event.date) >= today && reg.status !== 'cancelled'
        );
      } else if (activeTab === 'past') {
        filteredData = registrationsWithEvents.filter(reg => 
          new Date(reg.event.date) < today && reg.status !== 'cancelled'
        );
      } else if (activeTab === 'cancelled') {
        filteredData = registrationsWithEvents.filter(reg => reg.status === 'cancelled');
      }

      setRegistrations(filteredData);
    } catch (error) {
      console.error('Error loading user events:', error);
      Alert.alert('Error', 'Failed to load your events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserEvents();
  };

  const getStatusColor = (status: 'registered' | 'attended' | 'cancelled'): string => {
    switch (status) {
      case 'attended':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const renderEventItem = ({ item }: { item: RegistrationWithEvent }): React.ReactElement => {
    return (
      <TouchableOpacity
        style={[styles.eventCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/event-details/${item.event.id}`)}
      >
        <Image
          source={{ 
            uri: item.event.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' 
          }}
          style={styles.eventImage}
        />
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
              {item.event.title}
            </Text>
            <View 
              style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(item.status) + '20' }
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Calendar size={16} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {format(new Date(item.event.date), 'MMM d, yyyy')}
              </Text>
            </View>
            
            <View style={styles.eventDetailItem}>
              <Clock size={16} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {item.event.time}
              </Text>
            </View>
            
            <View style={styles.eventDetailItem}>
              <MapPin size={16} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
                {item.event.location}
              </Text>
            </View>
          </View>
          
          <View style={styles.eventActions}>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/check-in/${item.event.id}`)}
              >
                <Text style={styles.actionButtonText}>View QR</Text>
              </TouchableOpacity>
            )}
            
            {activeTab === 'past' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => router.push(`/event-feedback/${item.event.id}`)}
              >
                <Text style={styles.actionButtonText}>Feedback</Text>
              </TouchableOpacity>
            )}
            
            {activeTab === 'cancelled' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/event-details/${item.event.id}`)}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Events',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'upcoming' && { 
              borderBottomWidth: 2, 
              borderBottomColor: colors.primary 
            },
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'upcoming' ? colors.primary : colors.subtext },
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'past' && { 
              borderBottomWidth: 2, 
              borderBottomColor: colors.primary 
            },
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'past' ? colors.primary : colors.subtext },
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'cancelled' && { 
              borderBottomWidth: 2, 
              borderBottomColor: colors.primary 
            },
          ]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'cancelled' ? colors.primary : colors.subtext },
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming events."
                  : activeTab === 'past'
                  ? "You don't have any past events."
                  : "You don't have any cancelled events."}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={[styles.browseButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.browseButtonText}>Browse Events</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: 100,
    height: 'auto',
    aspectRatio: 1,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
