import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../lib/storage';

export default function AdminSetupScreen() {
  const router = useRouter();

  useEffect(() => {
    const setupAdminUser = async () => {
      try {
        const adminUser = {
          id: uuidv4(),
          email: 'qadirdadkazi@gmail.com',
          fullName: 'Qadirdad Kazi',
          role: 'admin' as const,
          createdAt: new Date().toISOString(),
        };

        // Save user to storage
        await storage.setUser(adminUser);
        
        // Create a simple token
        const token = `admin-token-${Date.now()}`;
        await storage.setToken(token);

        // Add user to users list in storage
        const users = (await storage.getData('users')) || [];
        const userExists = users.some((u: any) => u.email === adminUser.email);
        
        if (!userExists) {
          users.push({
            ...adminUser,
            password: 'Password1', // In a real app, hash the password
          });
          await storage.setData('users', users);
        }

        console.log('✅ Admin user created successfully!');
        console.log('👉 Email:', adminUser.email);
        console.log('🔑 Password: Password1');
        
        // Navigate to home after setup
        router.replace('/(tabs)');
      } catch (error) {
        console.error('❌ Error creating admin user:', error);
      }
    };

    setupAdminUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Setting up admin user...</Text>
      <Text style={styles.subtext}>Please wait a moment.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
  },
});
