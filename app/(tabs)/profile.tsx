import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getRegisteredEvents, clearAllData } from '@/services/storage';
import { Event } from '@/types';
import { ChevronRight, LogOut, Moon, Sun, User, UserCog, Calendar, Settings } from 'lucide-react-native';

interface ProfileScreenProps {}

export default function ProfileScreen({}: ProfileScreenProps) {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, profile, isAdmin, isGuest, signOut } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine the display name and email
  const displayName = profile?.fullName || user?.fullName || 'Guest User';
  const displayEmail = isGuest ? 'Guest User' : (user?.email || 'Not signed in');
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

  useEffect(() => {
    loadRegisteredEvents();
  }, []);

  const loadRegisteredEvents = async () => {
    setIsLoading(true);
    try {
      const events = await getRegisteredEvents();
      setRegisteredEvents(events);
    } catch (error) {
      console.error('Failed to load registered events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSystemThemeToggle = () => {
    setTheme(theme === 'system' ? (isDark ? 'dark' : 'light') : 'system');
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      setRegisteredEvents([]);
      Alert.alert('Success', 'All data has been cleared successfully.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            user && (
              <TouchableOpacity 
                onPress={handleSignOut}
                style={{ marginRight: 16 }}
              >
                <LogOut size={24} color={colors.text} />
              </TouchableOpacity>
            )
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.profileImage}
            accessibilityLabel={`${displayName}'s profile picture`}
          />
          <Text style={[styles.profileName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.profileDetail, { color: colors.subtext }]}>
            {displayEmail}
          </Text>
          {isAdmin && !isGuest && (
            <View style={[styles.adminBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                Admin
              </Text>
            </View>
          )}
        </View>

        {/* Account Section */}
        {user ? (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Account
            </Text>
            
            <TouchableOpacity 
              style={styles.sectionButton}
              onPress={() => router.push('/user')}
            >
              <View style={styles.sectionButtonContent}>
                <User size={20} color={colors.primary} style={styles.sectionButtonIcon} />
                <Text style={[styles.sectionButtonText, { color: colors.text }]}>
                  Dashboard
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sectionButton}
              onPress={() => router.push('/user/my-events')}
            >
              <View style={styles.sectionButtonContent}>
                <Calendar size={20} color={colors.primary} style={styles.sectionButtonIcon} />
                <Text style={[styles.sectionButtonText, { color: colors.text }]}>
                  My Events ({registeredEvents.length})
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sectionButton}
              onPress={() => router.push('/user/edit-profile')}
            >
              <View style={styles.sectionButtonContent}>
                <Settings size={20} color={colors.primary} style={styles.sectionButtonIcon} />
                <Text style={[styles.sectionButtonText, { color: colors.text }]}>
                  Edit Profile
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
            <TouchableOpacity 
              style={[styles.signInButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/sign-in')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Admin Section */}
        {isAdmin && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Admin
            </Text>
            
            <TouchableOpacity 
              style={styles.sectionButton}
              onPress={() => router.push('/admin')}
            >
              <View style={styles.sectionButtonContent}>
                <UserCog size={20} color={colors.secondary} style={styles.sectionButtonIcon} />
                <Text style={[styles.sectionButtonText, { color: colors.text }]}>
                  Admin Dashboard
                </Text>
              </View>
              <ChevronRight size={20} color={colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sectionButton}
              onPress={() => router.push('/admin/create-event')}
            >
              <View style={styles.sectionButtonContent}>
                <Calendar size={20} color={colors.secondary} style={styles.sectionButtonIcon} />
                <Text style={[styles.sectionButtonText, { color: colors.text }]}>
                  Create Event
                </Text>
              </View>
              <ChevronRight size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Theme Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              {isDark ? (
                <Moon size={20} color={colors.text} style={styles.settingIcon} />
              ) : (
                <Sun size={20} color={colors.text} style={styles.settingIcon} />
              )}
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Use Device Settings
              </Text>
            </View>
            <Switch
              value={theme === 'system'}
              onValueChange={handleSystemThemeToggle}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Data & Security
          </Text>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Settings size={20} color={colors.error} style={styles.settingIcon} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>
              Clear Local Data
            </Text>
          </TouchableOpacity>
          
          {user && (
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={handleSignOut}
            >
              <LogOut size={20} color={colors.error} style={styles.settingIcon} />
              <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            CampusConnect+ v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionButtonText: {
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    fontSize: 16,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  adminBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionButtonIcon: {
    marginRight: 12,
  },
  signInButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});