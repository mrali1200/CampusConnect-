// Polyfills must be imported first
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useNotificationObserver, registerForPushNotifications } from '@/lib/notificationService';
// import { Footer } from '@/components/ui';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import 'react-native-url-polyfill/auto';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function NotificationHandler() {
  useNotificationObserver();
  return null;
}

export default function RootLayout() {
  useFrameworkReady();
  
  useEffect(() => {
    // Initialize notifications when the app starts
    const initNotifications = async () => {
      try {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }

        // Get and log the push token
        const token = await registerForPushNotifications();
        console.log('Push notification token:', token);

        // Set the notification categories if needed
        if (Platform.OS === 'ios') {
          await Notifications.setNotificationCategoryAsync('EVENT_REMINDER', [
            {
              identifier: 'VIEW_EVENT',
              buttonTitle: 'View Event',
              options: {
                opensAppToForeground: true,
              },
            },
          ]);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initNotifications();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="splash-screen" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-setup" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
                </Stack>
                <NotificationHandler />
              </View>
              {/* <Footer /> */}
              <StatusBar style="auto" />
            </SafeAreaView>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </ThemeProvider>
  );
}