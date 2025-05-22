import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, Clock, Calendar, User, Search } from 'lucide-react-native';

export default function RegistrationsScreen() {
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true); 
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      Alert.alert('Unauthorized', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }

    loadRegistrations();
  }, [isAdmin]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          events (id, name, date, time, category),
          profiles (id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
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

      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', registrationId);

      if (error) throw error;

      // Update local state
      setRegistrations(
        registrations.map(reg => 
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

  // Define the registration status type
  type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

  // Define the registration interface
  interface Registration {
    id: string;
    status: RegistrationStatus;
    created_at: string;
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

  const getStatusColor = (status: RegistrationStatus): string => {
    switch (status) {
      case 'attended':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const renderRegistrationItem = ({ item }: { item: Registration }) => {
    return (
      <View style={[styles.registrationCard, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
            {item.events.name}
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

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <User size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {item.profiles.full_name || 'User'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {format(new Date(item.events.date), 'MMM d, yyyy')} at {item.events.time}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.subtext }]}>
              Registered on {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {item.status !== 'attended' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={() => updateRegistrationStatus(item.id, 'attended')}
            >
              <CheckCircle size={18} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success }]}>
                Mark Attended
              </Text>
            </TouchableOpacity>
          )}

          {item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
              onPress={() => updateRegistrationStatus(item.id, 'cancelled')}
            >
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'cancelled' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => updateRegistrationStatus(item.id, 'registered')}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Restore
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
    paddingBottom: 40,
  },
  registrationCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
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
  },
});
