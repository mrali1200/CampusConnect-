import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export default function SplashScreen() {
  const router = useRouter();

  const [status, setStatus] = useState('Checking for admin user...');

  useEffect(() => {
    const setupAdminUser = async () => {
      try {
        setStatus('Setting up admin user...');
        
        // Check if admin user already exists
        const users = (await storage.getData('users')) || [];
        const adminUser = users.find((user: any) => user.role === 'admin');
        
        if (adminUser) {
          setStatus('Admin user found, logging in...');
          // Set the admin user as logged in
          await storage.setUser(adminUser);
          await storage.setToken(`admin-token-${Date.now()}`);
          router.replace('/(tabs)');
          return;
        }

        // Create admin user if not exists
        setStatus('Creating admin user...');
        const newAdminUser = {
          id: uuidv4(),
          email: 'qadirdadkazi@gmail.com',
          fullName: 'Qadirdad Kazi',
          role: 'admin' as const,
          createdAt: new Date().toISOString(),
        };

        // Save admin user
        await storage.setUser(newAdminUser);
        await storage.setToken(`admin-token-${Date.now()}`);
        
        // Add to users list
        users.push({
          ...newAdminUser,
          password: 'Password1', // In a real app, hash the password
        });
        await storage.setData('users', users);

        console.log('✅ Admin user created successfully!');
        console.log('👉 Email:', newAdminUser.email);
        console.log('🔑 Password: Password1');
        
        // Navigate to home
        router.replace('/(tabs)');
      } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        Alert.alert(
          'Setup Error',
          'Failed to set up admin user. Please restart the app.',
          [{ text: 'OK', onPress: () => setupAdminUser() }]
        );
      }
    };

    setupAdminUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusConnect</Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      <Text style={styles.subtitle}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loader: {
    marginVertical: 10,
  },
});
