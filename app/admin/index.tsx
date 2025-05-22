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
import { supabase } from '@/lib/supabase';
import { PlusCircle, Users, Calendar, LogOut, ArrowLeft } from 'lucide-react-native'; 

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const { signOut, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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

      // Get total events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) throw eventsError;

      // Get total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total registrations count
      const { count: registrationsCount, error: registrationsError } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      if (registrationsError) throw registrationsError;

      // Get upcoming events count
      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', today);

      if (upcomingError) throw upcomingError;

      setStats({
        totalEvents: eventsCount || 0,
        totalUsers: usersCount || 0,
        totalRegistrations: registrationsCount || 0,
        upcomingEvents: upcomingCount || 0,
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
