import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/lib/storage';

export default function ClearUsersScreen() {
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClearUsers = async () => {
    if (!isAdmin) {
      Alert.alert('Error', 'You must be an admin to perform this action.');
      return;
    }

    Alert.alert(
      'Warning',
      'This will delete all users and profiles. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              // Clear all user data including profiles
              await storage.clearAllData();

              // Clear all data including users and profiles
              await storage.clearEverything();
              
              Alert.alert('Success', 'All users and profiles have been deleted.');
              router.back();
            } catch (error) {
              console.error('Error clearing users:', error);
              Alert.alert('Error', 'Failed to clear users. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    router.replace('/');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Clear Users</Text>
      <Text style={[styles.warning, { color: colors.error }]}>
        Warning: This action will remove all users from the database.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.error }]}
        onPress={handleClearUsers}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Clear All Users</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  warning: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 