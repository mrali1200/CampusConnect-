import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Send, Copy, Users, Link2, MessageSquare, Share as ShareIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Event } from '@/types';

interface ShareEventModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event;
}

export default function ShareEventModal({ visible, onClose, event }: ShareEventModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [shareMethod, setShareMethod] = useState<'friends' | 'link' | 'platform'>('platform');

  // Load friends when modal opens
  React.useEffect(() => {
    if (visible && user) {
      loadFriends();
    }
  }, [visible, user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      setLoadingFriends(true);

      // In a real app, this would fetch the user's friends from the database
      // For this example, we'll simulate a friends list
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      setFriends(
        data.map((friend) => ({
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar_url,
        }))
      );
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleShareWithFriends = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to share with friends');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Select Friends', 'Please select at least one friend to share with');
      return;
    }

    try {
      setLoading(true);

      // Create share records in the database
      const sharePromises = selectedFriends.map((friendId) =>
        supabase.from('event_shares').insert({
          event_id: event.id,
          sender_id: user.id,
          recipient_id: friendId,
          message: message.trim() || `Check out this event: ${event.name}`,
          created_at: new Date().toISOString(),
        })
      );

      await Promise.all(sharePromises);

      // Also create an activity entry
      await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'share',
        content: message.trim() || `Shared ${event.name} with ${selectedFriends.length} friends`,
        event_id: event.id,
        created_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Event shared successfully!');
      onClose();
    } catch (err) {
      console.error('Error sharing event with friends:', err);
      Alert.alert('Error', 'Failed to share event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareViaLink = async () => {
    try {
      // Generate a shareable link
      const eventLink = `https://campusconnect.app/event/${event.id}`;
      
      // Copy to clipboard
      await Clipboard.setStringAsync(eventLink);
      
      Alert.alert('Link Copied', 'Event link copied to clipboard!');
      
      // Create an activity entry if user is logged in
      if (user) {
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'share',
          content: `Shared ${event.name} via link`,
          event_id: event.id,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error generating share link:', err);
      Alert.alert('Error', 'Failed to generate share link. Please try again.');
    }
  };

  const handleShareViaPlatform = async () => {
    try {
      const eventLink = `https://campusconnect.app/event/${event.id}`;
      const shareContent = {
        title: event.name,
        message: Platform.OS === 'ios' 
          ? `Check out this event: ${event.name}`
          : `Check out this event: ${event.name} at ${event.venue} on ${event.date}. ${eventLink}`,
        url: Platform.OS === 'ios' ? eventLink : undefined,
      };
      
      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction && user) {
        // Create an activity entry if user is logged in and share was successful
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'share',
          content: `Shared ${event.name} via ${Platform.OS}`,
          event_id: event.id,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error sharing via platform:', err);
    }
  };

  const renderShareMethod = () => {
    switch (shareMethod) {
      case 'friends':
        return (
          <View style={styles.methodContent}>
            <TextInput
              style={[styles.messageInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Add a message (optional)"
              placeholderTextColor={colors.subtext}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Friends</Text>
            
            {loadingFriends ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
            ) : friends.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                No friends found. Add friends to share events with them.
              </Text>
            ) : (
              <ScrollView style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[styles.friendItem, selectedFriends.includes(friend.id) && { backgroundColor: colors.highlight }]}
                    onPress={() => toggleFriendSelection(friend.id)}
                  >
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, { color: colors.text }]}>{friend.name}</Text>
                    </View>
                    <View style={[styles.checkbox, selectedFriends.includes(friend.id) && { backgroundColor: colors.primary }]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShareWithFriends}
              disabled={loading || selectedFriends.length === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.shareButtonText}>Share with {selectedFriends.length} friends</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
        
      case 'link':
        return (
          <View style={styles.methodContent}>
            <View style={[styles.linkContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={1}>
                https://campusconnect.app/event/{event.id}
              </Text>
              <TouchableOpacity onPress={handleShareViaLink}>
                <Copy size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.linkDescription, { color: colors.subtext }]}>
              Copy this link to share the event with anyone. They can view the event details and register if they have a CampusConnect account.
            </Text>
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShareViaLink}
            >
              <Copy size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.shareButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'platform':
        return (
          <View style={styles.methodContent}>
            <Text style={[styles.platformDescription, { color: colors.text }]}>
              Share this event using your device's native sharing options. This allows you to share via messaging apps, email, social media, and more.
            </Text>
            
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShareViaPlatform}
            >
              <ShareIcon size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.shareButtonText}>Share via {Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Share Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.eventInfo}>
            <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
            <Text style={[styles.eventDetails, { color: colors.subtext }]}>{event.venue} • {event.date}</Text>
          </View>
          
          <View style={styles.shareMethods}>
            <TouchableOpacity
              style={[styles.methodTab, shareMethod === 'platform' && styles.activeMethodTab, shareMethod === 'platform' && { borderBottomColor: colors.primary }]}
              onPress={() => setShareMethod('platform')}
            >
              <Text style={[styles.methodTabText, { color: shareMethod === 'platform' ? colors.primary : colors.subtext }]}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.methodTab, shareMethod === 'link' && styles.activeMethodTab, shareMethod === 'link' && { borderBottomColor: colors.primary }]}
              onPress={() => setShareMethod('link')}
            >
              <Text style={[styles.methodTabText, { color: shareMethod === 'link' ? colors.primary : colors.subtext }]}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.methodTab, shareMethod === 'friends' && styles.activeMethodTab, shareMethod === 'friends' && { borderBottomColor: colors.primary }]}
              onPress={() => setShareMethod('friends')}
            >
              <Text style={[styles.methodTabText, { color: shareMethod === 'friends' ? colors.primary : colors.subtext }]}>Friends</Text>
            </TouchableOpacity>
          </View>
          
          {renderShareMethod()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  eventInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
  },
  shareMethods: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  methodTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeMethodTab: {
    borderBottomWidth: 2,
  },
  methodTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  methodContent: {
    padding: 20,
  },
  messageInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  friendsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  linkDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  platformDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
});
