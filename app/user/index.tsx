import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Calendar, Clock, User, LogOut, MapPin, Bell } from 'lucide-react-native';
import { getRegisteredEvents } from '@/services/storage';
import { fetchEvents } from '@/services/api';
import { format } from 'date-fns';

type Event = {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
  category?: string;
  imageUrl?: string;
};

type EventWithRegistration = Event & {
  registrationDate: string;
  status: 'registered' | 'attended' | 'cancelled';
};

type Stats = {
  upcomingEvents: number;
  pastEvents: number;
  totalRegistrations: number;
};

export default function UserDashboardScreen() {
  const { colors } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    upcomingEvents: 0,
    pastEvents: 0,
    totalRegistrations: 0,
  });
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<EventWithRegistration[]>([]);

  const loadUserDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [allEvents, registeredEventIds] = await Promise.all([
        fetchEvents(),
        getRegisteredEvents(),
      ]);

      const registrations: EventWithRegistration[] = allEvents
        .filter(event => registeredEventIds.includes(event.id))
        .map(event => ({
          ...event,
          registrationDate: new Date().toISOString(),
          status: 'registered' as const,
        }));

      const today = new Date();
      const upcoming = registrations.filter(
        reg => new Date(reg.date) >= today && reg.status !== 'cancelled'
      );
      
      const past = registrations.filter(
        reg => new Date(reg.date) < today && reg.status !== 'cancelled'
      );

      setStats({
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        totalRegistrations: registrations.length,
      });

      const sortedUpcoming = [...upcoming]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
      
      setUpcomingRegistrations(sortedUpcoming);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderUpcomingEvent = (event: EventWithRegistration) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/event-details/${event.id}`)}
    >
      <Image
        source={{ uri: event.imageUrl || 'https://via.placeholder.com/80' }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      <View style={styles.eventInfo}>
        <Text style={[styles.eventName, { color: colors.text }]}>
          {event.title}
        </Text>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {format(new Date(event.date), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {event.time || '10:00 AM'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {event.venue || 'TBD'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 16 }}>
              <LogOut size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <User size={32} color={colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {profile?.name || 'Guest User'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.subtext }]}>
                  {user.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats.upcomingEvents}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Upcoming</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {stats.pastEvents}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Past Events</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {stats.totalRegistrations}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Total</Text>
            </View>
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Events
              </Text>
              <TouchableOpacity onPress={() => router.push('/user/my-events')}>
                <Text style={{ color: colors.primary }}>View All</Text>
              </TouchableOpacity>
            </View>

            {upcomingRegistrations.length > 0 ? (
              <View style={styles.eventsList}>
                {upcomingRegistrations.map(renderUpcomingEvent)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={32} color={colors.subtext} />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  No upcoming events
                </Text>
                <TouchableOpacity 
                  style={[styles.browseButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.browseButtonText}>Browse Events</Text>
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 12,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
