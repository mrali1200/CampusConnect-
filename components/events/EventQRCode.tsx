import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

interface EventQRCodeProps {
  eventId: string;
  eventName: string;
  userId: string;
  registrationId: string;
}

export default function EventQRCode({ eventId, eventName, userId, registrationId }: EventQRCodeProps) {
  const { colors } = useTheme();
  const qrRef = React.useRef<any>(null);

  // Create QR code data in a structured format
  const qrData = JSON.stringify({
    type: 'event-checkin',
    eventId,
    userId,
    registrationId,
    timestamp: new Date().toISOString(),
  });

  const handleSaveQRCode = async () => {
    try {
      // Request permission to save to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need media library permissions to save the QR code.');
        return;
      }

      // Get QR code as PNG data URL
      qrRef.current?.toDataURL(async (dataURL: string) => {
        const fileUri = FileSystem.documentDirectory + `qrcode-${eventId}.png`;
        const base64Data = dataURL.split(',')[1];
        
        // Write the file
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('CampusConnect', asset, false);
        
        alert('QR Code saved to your photos!');
      });
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code. Please try again.');
    }
  };

  const handleShareQRCode = async () => {
    try {
      qrRef.current?.toDataURL(async (dataURL: string) => {
        const fileUri = FileSystem.documentDirectory + `qrcode-${eventId}.png`;
        const base64Data = dataURL.split(',')[1];
        
        // Write the file
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Share the file
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(fileUri);
        } else {
          const shareOptions = {
            title: `QR Code for ${eventName}`,
            message: `Here's my check-in QR code for ${eventName}`,
            url: `file://${fileUri}`,
            type: 'image/png',
          };
          await Share.share(shareOptions);
        }
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      alert('Failed to share QR code. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Your Check-In QR Code</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Present this QR code to the event organizer for check-in
      </Text>
      
      <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
        <QRCode
          value={qrData}
          size={200}
          color="#000000"
          backgroundColor="#FFFFFF"
          getRef={(ref) => (qrRef.current = ref)}
        />
      </View>
      
      <Text style={[styles.eventName, { color: colors.text }]}>{eventName}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveQRCode}
        >
          <Download size={20} color="#FFFFFF" style={styles.actionIcon} />
          <Text style={styles.actionText}>Save to Photos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleShareQRCode}
        >
          <Share2 size={20} color="#FFFFFF" style={styles.actionIcon} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
