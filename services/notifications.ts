import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from '@/lib/storage';
import type { Event } from '@/lib/storage';
import * as Device from 'expo-device';

// Notification event type for scheduling notifications
type NotificationEvent = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  date?: string;
  time?: string;
  startTime?: string | number | Date;
  location?: string;
  venue?: string;
  creatorId?: string;
  category?: string;
  capacity?: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  [key: string]: any; // Allow additional properties
};

// In-memory store for notifications
const notificationsStore = new Map<string, any>();

// Configure notification channels (Android)
const configureNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

/**
 * Configure notification settings and request permissions
 * @returns {Promise<boolean>} Whether notification permissions are granted
 */
export async function configureNotifications(): Promise<boolean> {
  try {
    // Configure notification channels for Android
    await configureNotificationChannels();

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission yet, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    // Check if notifications are supported on the device
    if (!Device.isDevice) {
      console.warn('Must use a physical device for push notifications');
      return false;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error configuring notifications:', error);
    return false;
  }
}

/**
 * Schedule a reminder for an event
 * @param event - The event object to schedule a reminder for
 * @param userId - The ID of the user to notify
 * @param minutesBefore - How many minutes before the event to send the reminder (default: 15)
 * @returns The notification ID if scheduled successfully, null otherwise
 */
export async function scheduleEventReminder(
  event: NotificationEvent,
  userId: string,
  minutesBefore: number = 15
): Promise<string | null> {
  try {
    // Calculate when to show the notification
    let eventTime: Date;
    
    if (event.startTime) {
      eventTime = new Date(event.startTime);
    } else if (event.date) {
      const time = event.time || '12:00';
      const [hours, minutes] = time.split(':').map(Number);
      eventTime = new Date(event.date);
      eventTime.setHours(hours, minutes, 0, 0);
    } else {
      console.warn('No valid event time found');
      return null;
    }
    
    // Calculate notification time (X minutes before event)
    const notificationTime = new Date(eventTime.getTime() - minutesBefore * 60 * 1000);
    
    // Don't schedule if the notification time is in the past
    if (notificationTime <= new Date()) {
      console.warn('Notification time is in the past');
      return null;
    }
    
    // Schedule the notification
    return await scheduleNotification(event, userId, notificationTime);
  } catch (error) {
    console.error('Error scheduling event reminder:', error);
    return null;
  }
}

/**
 * Schedule a notification for an event
 * @param event - The event object
 * @param userId - The ID of the user
 * @param trigger - When to trigger the notification (Date or number of milliseconds)
 * @returns The notification ID if scheduled successfully, null otherwise
 */
export async function scheduleNotification(
  event: NotificationEvent,
  userId: string,
  trigger: Date | number = new Date(Date.now() + 15 * 60 * 1000) // Default: 15 minutes from now
): Promise<string | null> {
  try {
    // Check if we have permission
    const hasPermission = await configureNotifications();
    if (!hasPermission) {
      console.error('No notification permissions granted');
      return null;
    }

    // If trigger is a Date, convert it to a timestamp
    const triggerTimestamp = trigger instanceof Date ? trigger.getTime() : trigger;
    
    // Calculate the delay in seconds
    const now = Date.now();
    const delayInSeconds = Math.max(0, Math.floor((triggerTimestamp - now) / 1000));

    // Don't schedule if the event is in the past
    if (delayInSeconds <= 0) {
      console.warn('Event is in the past, not scheduling notification');
      return null;
    }

    // Format the start time for the notification body
    let startTimeFormatted = 'soon';
    if (event.startTime) {
      try {
        startTimeFormatted = new Date(event.startTime).toLocaleString();
      } catch (e) {
        console.warn('Error formatting event time:', e);
      }
    } else if (event.date) {
      try {
        startTimeFormatted = new Date(event.date).toLocaleString();
      } catch (e) {
        console.warn('Error formatting event date:', e);
      }
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Upcoming: ${event.name || event.title || 'Event'}`,
        body: `Starts ${startTimeFormatted}\n${event.venue || event.location ? `Location: ${event.venue || event.location}` : ''}`,
        data: { 
          eventId: event.id, 
          userId,
          url: `campusconnect://event/${event.id}`
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'EVENT_REMINDER',
        autoDismiss: true,
        sticky: false,
      },
      trigger: {
        seconds: Math.max(60, delayInSeconds), // At least 1 minute in the future
        channelId: 'event-reminders',
      },
    });

    console.log(`Scheduled notification ${notificationId} for event ${event.id}`);

    // Track the notification in local storage
    const notifications = (await storage.getData<Array<any>>('notifications')) || [];
    notifications.push({
      id: notificationId,
      userId,
      eventId: event.id,
      scheduledTime: new Date(now + delayInSeconds * 1000).toISOString(),
      status: 'scheduled',
      eventName: event.name || event.title,
      eventVenue: event.venue || event.location
    });
    await storage.setData('notifications', notifications);

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 * @param notificationId - The ID of the scheduled notification
 * @returns Whether the notification was cancelled successfully
 */
export async function cancelNotification(notificationId: string): Promise<boolean> {
  try {
    // Cancel the notification
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    
    // Update notification status in local storage
    const notifications = (await storage.getData<Array<any>>('notifications')) || [];
    const notificationIndex = notifications.findIndex((n: any) => n.id === notificationId);
    
    if (notificationIndex !== -1) {
      notifications[notificationIndex] = {
        ...notifications[notificationIndex],
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };
      await storage.setData('notifications', notifications);
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
}

/**
 * Get all notifications for a user
 * @param userId - The ID of the user
 * @returns List of notifications
 */
type UserNotification = {
  id: string;
  userId: string;
  eventId: string;
  scheduledTime: string;
  status: 'scheduled' | 'cancelled' | 'delivered';
  eventName?: string;
  eventVenue?: string;
  cancelledAt?: string;
};

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  try {
    const notifications = (await storage.getData<UserNotification[]>('notifications')) || [];
    return notifications.filter(n => n.userId === userId);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}
