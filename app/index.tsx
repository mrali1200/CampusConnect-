import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // This screen will immediately redirect to the splash screen
  return <Redirect href="/splash-screen" />;
}
