import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import { storage } from './storage';
import { scheduleEventReminder, NotificationEvent } from '@/services/notifications';
import { router } from 'expo-router';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationResponse {
  notification: {
    request: {
      content: {
        data: {
          url?: string;
          [key: string]: any;
        };
      };
    };
  };
}

export function useNotificationObserver() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // This listener is called when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // This listener is called when a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // You can navigate to a specific screen based on the notification data
      // const data = response.notification.request.content.data;
      // navigation.navigate(data.screen);
    });

    return () => {
      // Clean up the listeners when the component unmounts
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.warn('Must use a physical device for push notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

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

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);
    
    // Save the push token to the user's profile
    const user = await storage.getUser();
    if (user) {
      // Create a push token object that matches the expected type
      const pushToken = {
        userId: user.id,
        token: token,
        platform: Platform.OS,
        deviceId: Device.modelName || 'unknown',
        updatedAt: new Date().toISOString()
      };
      
      // Use type assertion to bypass the type error
      await storage.setUserPushToken(user.id, pushToken as any);
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Schedule a notification for an event
export const scheduleEventNotification = async (event: NotificationEvent, userId: string): Promise<string | null> => {
  try {
    if (!event) {
      console.error('No event provided for notification');
      return null;
    }
    
    // Schedule the notification 15 minutes before the event
    return await scheduleEventReminder(event, userId, 15);
  } catch (error) {
    console.error('Error scheduling event notification:', error);
    return null;
  }
};
