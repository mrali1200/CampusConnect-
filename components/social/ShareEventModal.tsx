import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Link2, Share2 as ShareIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { type Event } from '@/lib/storage';

interface ShareEventModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event;
}

export default function ShareEventModal({ visible, onClose, event }: ShareEventModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'platform'>('platform');

  const shareLink = async () => {
    try {
      const eventUrl = `https://campusconnect.app/event/${event.id}`;
      const shareMessage = `Check out this event: ${event.title}\n\n${event.description || ''}\n\n${eventUrl}`;
      
      if (shareMethod === 'platform') {
        await Share.share({
          message: shareMessage,
          title: event.title,
        });
      } else {
        await Clipboard.setStringAsync(eventUrl);
        Alert.alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    await shareLink();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Share Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.methodsContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                shareMethod === 'platform' && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setShareMethod('platform')}
            >
              <ShareIcon size={24} color={colors.primary} />
              <Text style={[styles.methodText, { color: colors.text }]}>Share via...</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                shareMethod === 'link' && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setShareMethod('link')}
            >
              <Link2 size={24} color={colors.primary} />
              <Text style={[styles.methodText, { color: colors.text }]}>Copy Link</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.shareButtonText}>
                {shareMethod === 'platform' ? 'Share' : 'Copy Link'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  methodsContainer: {
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  methodText: {
    marginLeft: 15,
    fontSize: 16,
  },
  shareButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});