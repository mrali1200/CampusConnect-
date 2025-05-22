import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bell, Calendar, Clock, MapPin, Settings, ChevronRight, ArrowLeft } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { 
  configureNotifications, 
  getAllScheduledNotifications, 
  cancelNotification 
} from '@/services/notifications';
import { NotificationRecord } from '@/types/notifications';
 
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userNotifications, setUserNotifications] = useState<NotificationRecord[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);

  useEffect(() => {
    checkNotificationPermissions();
    loadNotifications();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Load notifications from Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          notification_id,
          created_at,
          events (
            id,
            name,
            date,
            time,
            venue,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get scheduled notifications from device
      const scheduled = await getAllScheduledNotifications();
      
      setUserNotifications(data || []);
      setScheduledNotifications(scheduled);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        // If turning off, just show a warning
        Alert.alert(
          'Disable Notifications',
          'This will prevent you from receiving reminders for your events. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Disable', 
              style: 'destructive',
              onPress: async () => {
                // User needs to disable in system settings
                Alert.alert(
                  'Disable in Settings',
                  'Please disable notifications for ConnectCampus in your device settings.',
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
      } else {
        // If turning on, request permissions
        const hasPermission = await configureNotifications();
        setNotificationsEnabled(hasPermission);
        
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications for ConnectCampus in your device settings to receive event reminders.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Success', 'Notifications enabled successfully!');
        }
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
    }
  };

  const handleCancelNotification = async (notificationId: string, dbId: string) => {
    try {
      Alert.alert(
        'Cancel Reminder',
        'Are you sure you want to cancel this reminder?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: async () => {
              // Cancel the notification
              await cancelNotification(notificationId);
              
              // Delete from database
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', dbId);
                
              if (error) throw error;
              
              // Refresh the list
              loadNotifications();
              
              Alert.alert('Success', 'Reminder cancelled successfully');
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error cancelling notification:', err);
      Alert.alert('Error', 'Failed to cancel reminder. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Notifications',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={colors.text} size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Event Reminders
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
          <Text style={[styles.settingDescription, { color: colors.subtext }]}>
            Receive reminders for your registered events 24 hours before they start.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Reminders
          </Text>
        </View>

        {userNotifications.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Bell size={40} color={colors.subtext} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Upcoming Reminders
            </Text>
            <Text style={[styles.emptyStateDescription, { color: colors.subtext }]}>
              Register for events to receive reminders before they start.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/')}
            >
              <Text style={styles.buttonText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          userNotifications.map((notification: NotificationRecord) => {
            const event = notification.events;
            if (!event) return null;
            
            return (
              <View 
                key={notification.id} 
                style={[styles.notificationCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.notificationHeader}>
                  <Bell size={18} color={colors.primary} style={styles.notificationIcon} />
                  <Text style={[styles.notificationType, { color: colors.primary }]}>
                    Event Reminder
                  </Text>
                </View>
                
                <Text style={[styles.eventTitle, { color: colors.text }]}>
                  {event.name}
                </Text>
                
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailItem}>
                    <Calendar size={16} color={colors.subtext} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: colors.subtext }]}>
                      {format(new Date(event.date), 'MMMM d, yyyy')}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetailItem}>
                    <Clock size={16} color={colors.subtext} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: colors.subtext }]}>
                      {event.time}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetailItem}>
                    <MapPin size={16} color={colors.subtext} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: colors.subtext }]}>
                      {event.venue}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.notificationActions}>
                  <TouchableOpacity 
                    style={[styles.viewButton, { borderColor: colors.primary }]}
                    onPress={() => router.push(`/event-details/${event.id}`)}
                  >
                    <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                      View Event
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: colors.error }]}
                    onPress={() => handleCancelNotification(notification.notification_id, notification.id)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                      Cancel Reminder
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  settingsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginLeft: 32,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    marginRight: 8,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
