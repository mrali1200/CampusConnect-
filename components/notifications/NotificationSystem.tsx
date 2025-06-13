import React, { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
// Using type-only import to avoid runtime errors if the module isn't installed yet
import type * as DeviceType from 'expo-device';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationSystemProps {
  children: React.ReactNode;
}

export default function NotificationSystem({ children }: NotificationSystemProps) {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const { data } = response.notification.request.content;
      handleNotificationResponse(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Update token in database when user logs in
  useEffect(() => {
    if (user && expoPushToken) {
      updatePushToken(user.id, expoPushToken);
    }
  }, [user, expoPushToken]);

  const updatePushToken = async (userId: string, token: string) => {
    try {
      // In a real app, you would send this token to your server
      // For local storage, we'll just store it for demonstration
      console.log('Push token updated:', { userId, token, deviceType: Platform.OS });
      
      // Store the token in local storage
      await storage.setUserPushToken(userId, {
        userId,
        pushToken: token,
        deviceType: Platform.OS,
      });
    } catch (err) {
      console.error('Error updating push token:', err);
    }
  };

  const handleNotificationResponse = (data: any) => {
    // Handle different notification types
    if (data?.type === 'event_reminder') {
      // Navigate to event details
      // router.push(`/event/${data.eventId}`);
    } else if (data?.type === 'new_comment') {
      // Navigate to event comments
      // router.push(`/event/${data.eventId}?showComments=true`);
    } else if (data?.type === 'friend_request') {
      // Navigate to friend requests
      // router.push('/social?tab=friends');
    } else if (data?.type === 'event_share') {
      // Navigate to shared event
      // router.push(`/event/${data.eventId}`);
    }
  };

  return <>{children}</>;
}

// Function to register for push notifications
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;
  
  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Push notifications are disabled. To receive event reminders and updates, please enable notifications in your device settings.',
        [{ text: 'OK' }]
      );
      return undefined;
    }
    
    // Get the token that uniquely identifies this device
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    token = pushTokenResponse.data;
  } catch (error) {
    console.log('Error getting push token:', error);
    return undefined;
  }

  return token;
}

// Function to schedule a local notification
export async function scheduleEventReminder(eventId: string, eventName: string, eventDate: Date) {
  // Schedule notification 1 hour before event
  const triggerDate = new Date(eventDate);
  triggerDate.setHours(triggerDate.getHours() - 1);
  
  // Only schedule if the event is in the future
  if (triggerDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Event Reminder',
        body: `${eventName} starts in 1 hour!`,
        data: { type: 'event_reminder', eventId },
      },
      trigger: triggerDate,
    });
  }
}

// Function to send a push notification (would be called from a server)
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
