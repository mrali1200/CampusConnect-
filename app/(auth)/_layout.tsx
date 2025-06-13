import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { session, loading, isAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';

    if (session) {
      if (inAuthGroup) {
        // Redirect authenticated users based on their role
        if (isAdmin) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      } else if (inAdminGroup && !isAdmin) {
        // If user is not admin but trying to access admin routes, redirect to user home
        router.replace('/(tabs)');
      }
    } else if (!inAuthGroup) {
      // Redirect unauthenticated users to sign in
      router.replace('/sign-in');
    }
  }, [session, segments, loading, isAdmin]);

  return <Stack screenOptions={{ headerShown: false }} />;
}