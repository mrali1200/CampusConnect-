import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { storage } from '@/lib/storage';
import { ArrowLeft, CheckCircle, Clock, Calendar, User, Search } from 'lucide-react-native';

// Define the theme colors type based on the actual theme structure
type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  highlight: string;
  gradient: {
    primary: string[];
    secondary: string[];
  };
  footer: string;
  [key: string]: any; // Allow any other properties
};

// Theme context type
type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
};

// Define the registration status type
type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

// Define the registration interface
interface Registration {
  id: string;
  status: RegistrationStatus;
  created_at: string;
  updated_at?: string;
  event_id: string;
  user_id: string;
  events: {
    id: string;
    name: string;
    date: string;
    time: string;
    category: string;
  };
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function RegistrationsScreen() {
  const theme = useTheme() as unknown as ThemeContextType;
  const colors = theme.colors;
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true); 
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Redirect if not admin
      if (!isAdmin) {
        Alert.alert('Unauthorized', 'You do not have permission to access this page.');
        router.replace('/');
        return;
      }

      loadRegistrations();
    }, [isAdmin])
  );

  const loadRegistrations = async () => {
    try {
      setLoading(true);

      // Get all data from local storage with proper null checks
      const [registrationsData, eventsData, profilesData] = await Promise.all([
        storage.getData<Registration[]>('registrations'),
        storage.getData<Array<{id: string, name: string, date: string, time: string, category: string}>>('events'),
        storage.getData<Array<{id: string, full_name: string, email: string}>>('users')
      ]);

      // Ensure we have arrays for all data
      const safeRegistrations = Array.isArray(registrationsData) ? registrationsData : [];
      const safeEvents = Array.isArray(eventsData) ? eventsData : [];
      const safeProfiles = Array.isArray(profilesData) ? profilesData : [];

      // Map registrations to include related event and profile data
      const registrationsWithDetails: Registration[] = safeRegistrations.map(reg => {
        const event = safeEvents.find(e => e?.id === reg.event_id) || { 
          id: 'unknown', 
          name: 'Unknown Event', 
          date: new Date().toISOString().split('T')[0], 
          time: '00:00', 
          category: 'Other' 
        };
        
        const profile = safeProfiles.find(p => p?.id === reg.user_id) || { 
          id: 'unknown', 
          full_name: 'Unknown User', 
          email: 'unknown@example.com' 
        };
        
        return {
          ...reg,
          events: event,
          profiles: profile
        } as Registration;
      });

      // Sort by most recent
      const sortedRegistrations = [...registrationsWithDetails].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRegistrations(sortedRegistrations);
    } catch (error) {
      console.error('Error loading registrations:', error);
      Alert.alert('Error', 'Failed to load registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRegistrations();
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: RegistrationStatus): Promise<void> => {
    try {
      setLoading(true);

      // Get current registrations
      const registrationsData = await storage.getData<Registration[]>('registrations');
      const currentRegistrations = Array.isArray(registrationsData) ? registrationsData : [];
      
      // Update the registration status
      const updatedRegistrations = currentRegistrations.map(reg => 
        reg.id === registrationId 
          ? { 
              ...reg, 
              status: newStatus, 
              updated_at: new Date().toISOString() 
            } 
          : reg
      );

      // Save to local storage
      await storage.setData('registrations', updatedRegistrations);

      // Update local state
      setRegistrations(prevRegistrations =>
        prevRegistrations.map(reg =>
          reg.id === registrationId ? { ...reg, status: newStatus } : reg
        )
      );

      Alert.alert('Success', `Registration marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating registration:', error);
      Alert.alert('Error', 'Failed to update registration status');
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: RegistrationStatus): string => {
    switch (status) {
      case 'attended':
        return colors.success;
      case 'cancelled':
        return colors.error; // Using error instead of danger
      default:
        return colors.primary;
    }
  };

  const renderRegistrationItem = ({ item }: { item: Registration }) => {
    const statusColor = getStatusColor(item.status);
    const statusBgColor = `${statusColor}20`; // Add 20% opacity for background
    
    return (
      <View style={[styles.registrationCard, { backgroundColor: colors.card }]}>
        <View style={styles.registrationHeader}>
          <View style={styles.userInfo}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.profiles.full_name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { 
                backgroundColor: statusBgColor,
                borderColor: statusColor
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={[styles.eventName, { color: colors.text }]}>
          {item.events.name}
        </Text>
        <Text style={[styles.eventCategory, { color: colors.primary }]}>
          {item.events.category}
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Calendar size={16} color={colors.subtext} />
            <Text style={[styles.detailText, { color: colors.subtext }]}>
              {format(new Date(item.events.date), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color={colors.subtext} />
            <Text style={[styles.detailText, { color: colors.subtext }]}>
              {item.events.time}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {item.status === 'registered' && (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: `${getStatusColor('attended')}20`,
                    borderColor: getStatusColor('attended')
                  }
                ]}
                onPress={() => updateRegistrationStatus(item.id, 'attended')}
              >
                <CheckCircle size={18} color={getStatusColor('attended')} />
                <Text style={[styles.actionButtonText, { color: getStatusColor('attended') }]}>
                  Mark Attended
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: `${getStatusColor('cancelled')}20`,
                    borderColor: getStatusColor('cancelled')
                  }
                ]}
                onPress={() => updateRegistrationStatus(item.id, 'cancelled')}
              >
                <Text style={[styles.actionButtonText, { color: getStatusColor('cancelled') }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'attended' && (
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: `${getStatusColor('cancelled')}20`,
                  borderColor: getStatusColor('cancelled')
                }
              ]}
              onPress={() => updateRegistrationStatus(item.id, 'cancelled')}
            >
              <Text style={[styles.actionButtonText, { color: getStatusColor('cancelled') }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          {item.status === 'cancelled' && (
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: `${getStatusColor('registered')}20`,
                  borderColor: getStatusColor('registered')
                }
              ]}
              onPress={() => updateRegistrationStatus(item.id, 'registered')}
            >
              <Text style={[styles.actionButtonText, { color: getStatusColor('registered') }]}>
                Reinstate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };  

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Event Registrations',
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
          data={registrations}
          renderItem={renderRegistrationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No registrations found.
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  registrationCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});
