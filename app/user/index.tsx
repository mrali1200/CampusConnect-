import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Calendar, CheckCircle, Clock, User, LogOut, ArrowLeft, Bell } from 'lucide-react-native';
import { Database } from '@/types/supabase';

interface Registration {
  id: string;
  status: string;
  created_at: string;
  events: {
    id: string;
    name: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    image_url?: string;
  };
}

export default function UserDashboardScreen() { 
  const { colors } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingEvents: 0, 
    pastEvents: 0,
    totalRegistrations: 0,
  });
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to access your dashboard.');
      router.replace('/sign-in');
      return;
    }

    loadUserDashboard();
  }, [user]);



  const loadUserDashboard = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all user registrations with event details
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          events (id, name, date, time, venue, category, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      const safeRegistrationsData = registrationsData as Registration[] || [];

      // Calculate stats
      const today = new Date();
      const upcoming = safeRegistrationsData.filter((reg: Registration) => 
        new Date(reg.events.date) >= today && reg.status !== 'cancelled'
      );
      const past = safeRegistrationsData.filter((reg: Registration) => 
        new Date(reg.events.date) < today && reg.status !== 'cancelled'
      );

      setStats({
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        totalRegistrations: safeRegistrationsData.filter((reg: Registration) => reg.status !== 'cancelled').length,
      });

      // Get upcoming registrations for display
      setUpcomingRegistrations(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error loading user dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'attended':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Dashboard',
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
          {/* User Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <Image
                source={{ 
                  uri: profile?.avatar_url || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
                }}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {profile?.full_name || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.subtext }]}>
                  {profile?.email || user?.email}
                </Text>
                <TouchableOpacity
                  style={[styles.editProfileButton, { borderColor: colors.primary }]}
                  onPress={() => router.push('/user/edit-profile')}
                >
                  <Text style={[styles.editProfileText, { color: colors.primary }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Calendar size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.upcomingEvents}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Upcoming</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <CheckCircle size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.pastEvents}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Attended</Text>
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statsIconContainer, { backgroundColor: colors.accent + '20' }]}>
                <Calendar size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statsNumber, { color: colors.text }]}>{stats.totalRegistrations}</Text>
              <Text style={[styles.statsLabel, { color: colors.subtext }]}>Total</Text>
            </View>
          </View>

          {/* Upcoming Events Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Events
              </Text>
              <TouchableOpacity onPress={() => router.push('/user/my-events')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {upcomingRegistrations.length > 0 ? (
              upcomingRegistrations.map((registration: Registration) => (
                <TouchableOpacity
                  key={registration.id}
                  style={[styles.eventCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/event-details/${registration.events.id}`)}
                >
                  <Image
                    source={{ 
                      uri: registration.events.image_url || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' 
                    }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
                      {registration.events.name}
                    </Text>
                    
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailItem}>
                        <Calendar size={16} color={colors.primary} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {new Date(registration.events.date).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={styles.eventDetailItem}>
                        <Clock size={16} color={colors.primary} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {registration.events.time}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.eventActions}>
                      <View 
                        style={[
                          styles.statusBadge, 
                          { backgroundColor: getStatusColor(registration.status) + '20' }
                        ]}
                      >
                        <Text style={[styles.statusText, { color: getStatusColor(registration.status) }]}>
                          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.viewButton, { borderColor: colors.primary }]}
                        onPress={() => router.push(`/check-in/${registration.events.id}`)}
                      >
                        <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                          View QR
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  You don't have any upcoming events.
                </Text>
                <TouchableOpacity
                  style={[styles.browseButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.browseButtonText}>Browse Events</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/user/my-events')}
            >
              <Calendar size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>My Events</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/user/edit-profile')}
            >
              <User size={20} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          {/* Notifications Button */}
          <TouchableOpacity
            style={[styles.notificationsButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/user/notifications')}
          >
            <View style={styles.notificationsContent}>
              <View style={[styles.notificationsIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Bell size={24} color={colors.primary} />
              </View>
              <View style={styles.notificationsTextContainer}>
                <Text style={[styles.notificationsTitle, { color: colors.text }]}>Event Reminders</Text>
                <Text style={[styles.notificationsDescription, { color: colors.subtext }]}>
                  Manage your event notifications and reminders
                </Text>
              </View>
            </View>
            <Text style={[styles.notificationsBadge, { color: colors.primary }]}>{stats.upcomingEvents}</Text>
          </TouchableOpacity>
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
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  editProfileButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: 80,
    height: 80,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  notificationsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationsTextContainer: {
    flex: 1,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationsDescription: {
    fontSize: 14,
  },
  notificationsBadge: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
