import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

/**
 * Configure notification settings and request permissions
 * @returns {Promise<boolean>} Whether notification permissions are granted
 */
export async function configureNotifications(): Promise<boolean> {
  // Configure how notifications appear when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If we don't have permission yet, ask for it
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a reminder notification for an event
 * @param {string} eventId - The ID of the event
 * @param {string} userId - The ID of the user
 * @returns {Promise<string|null>} The notification ID if scheduled successfully, null otherwise
 */
export async function scheduleEventReminder(eventId: string, userId: string): Promise<string | null> {
  try {
    // Get event details from Supabase
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      console.error('Error fetching event for notification:', error);
      return null;
    }

    // Schedule notification for 1 hour before the event
    const eventDate = new Date(event.date);
    const eventTime = event.time.split(':');
    eventDate.setHours(parseInt(eventTime[0], 10));
    eventDate.setMinutes(parseInt(eventTime[1], 10));
    
    // Set reminder time to 1 hour before event
    const reminderTime = new Date(eventDate);
    reminderTime.setHours(reminderTime.getHours() - 1);
    
    // Don't schedule if the reminder time is in the past
    if (reminderTime <= new Date()) {
      console.log('Event time is too close or in the past, not scheduling reminder');
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Event Reminder',
        body: `${event.name} is starting in 1 hour at ${event.venue}`,
        data: { eventId, userId },
      },
      trigger: {
        date: reminderTime,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Track a scheduled notification in the database
 * @param {string} userId - The ID of the user
 * @param {string} eventId - The ID of the event
 * @param {string} notificationId - The ID of the scheduled notification
 * @returns {Promise<boolean>} Whether the notification was tracked successfully
 */
export async function trackNotification(userId: string, eventId: string, notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        event_id: eventId,
        notification_id: notificationId,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking notification:', error);
    return false;
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - The ID of the scheduled notification
 * @returns {Promise<boolean>} Whether the notification was cancelled successfully
 */
export async function cancelNotification(notificationId: string): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
}
