import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      // Redirect authenticated users to the main app
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirect unauthenticated users to sign in
      router.replace('/sign-in');
    }
  }, [session, segments, isLoading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}