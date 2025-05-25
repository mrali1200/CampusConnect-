import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ActivityFeed from '@/components/social/ActivityFeed';
import { Users, UserPlus, Bell } from 'lucide-react-native';

export default function SocialScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'notifications'>('all');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Social',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.activeTab,
            activeTab === 'all' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? colors.primary : colors.subtext },
            ]}
          >
            All Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'friends' && styles.activeTab,
            activeTab === 'friends' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'friends' ? colors.primary : colors.subtext },
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'notifications' && styles.activeTab,
            activeTab === 'notifications' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'notifications' ? colors.primary : colors.subtext },
            ]}
          >
            Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {!user ? (
        <View style={styles.signInContainer}>
          <Text style={[styles.signInTitle, { color: colors.text }]}>
            Sign in to see your social feed
          </Text>
          <Text style={[styles.signInDescription, { color: colors.subtext }]}>
            Connect with friends, see their activity, and get notified about events you might be interested in.
          </Text>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'all' && (
            <ActivityFeed />
          )}

          {activeTab === 'friends' && (
            <View style={styles.friendsContainer}>
              <View style={styles.friendsHeader}>
                <Text style={[styles.friendsTitle, { color: colors.text }]}>
                  Your Friends
                </Text>
                <TouchableOpacity
                  style={[styles.addFriendButton, { backgroundColor: colors.primary }]}
                >
                  <UserPlus size={16} color="#FFFFFF" />
                  <Text style={styles.addFriendText}>Add Friends</Text>
                </TouchableOpacity>
              </View>

              {/* This would be replaced with a real FriendsList component */}
              <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
                <Users size={40} color={colors.subtext} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No friends yet
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.subtext }]}>
                  Add friends to see their activity and share events with them.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'notifications' && (
            <View style={styles.notificationsContainer}>
              {/* This would be replaced with a real NotificationsList component */}
              <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
                <Bell size={40} color={colors.subtext} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.subtext }]}>
                  You'll receive notifications when someone shares an event with you or comments on your activity.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  signInDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsContainer: {
    flex: 1,
    padding: 16,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  friendsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addFriendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  notificationsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    margin: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
