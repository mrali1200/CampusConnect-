import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/lib/storage';
import { PlusCircle, Users, Calendar, LogOut, ArrowLeft } from 'lucide-react-native'; 

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const { signOut, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  interface DashboardStats {
    totalEvents: number;
    totalUsers: number;
    totalRegistrations: number;
    upcomingEvents: number;
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      Alert.alert('Unauthorized', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }

    loadDashboardStats();
  }, [isAdmin]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Define event interface for type safety
      interface EventItem {
        id: string;
        date: string;
        [key: string]: any; // Allow additional properties
      }

      // Get all data from local storage with proper types
      const [eventsData, usersData, registrationsData] = await Promise.all([
        storage.getData<EventItem[]>('events'),
        storage.getData<any[]>('users'),
        storage.getData<any[]>('registrations')
      ]);

      // Ensure we have arrays, default to empty arrays if null/undefined
      const events: EventItem[] = Array.isArray(eventsData) ? eventsData : [];
      const users = Array.isArray(usersData) ? usersData : [];
      const registrations = Array.isArray(registrationsData) ? registrationsData : [];

      // Calculate upcoming events (events with date >= today)
      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = events.filter((event: EventItem) => 
        event?.date && new Date(event.date) >= new Date(today)
      );

      setStats({
        totalEvents: events?.length || 0,
        totalUsers: users?.length || 0,
        totalRegistrations: registrations?.length || 0,
        upcomingEvents: upcomingEvents?.length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Admin Dashboard',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut}>
              <LogOut color={colors.text} size={24} />
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
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Calendar size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.totalEvents}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Total Events</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <Users size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.totalUsers}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Total Users</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.success + '20' }]}>
                <Calendar size={24} color={colors.success} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.upcomingEvents}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Upcoming Events</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.accent + '20' }]}>
                <Users size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.totalRegistrations}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Registrations</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/admin/create-event')}
            >
              <PlusCircle size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Create New Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/admin/manage-events')}
            >
              <Calendar size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Manage Events</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/admin/registrations')}
            >
              <Users size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>View Registrations</Text>
            </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonIcon: {
    marginRight: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
