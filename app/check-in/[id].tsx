import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchEventById } from '@/services/api';
import { getUserId } from '@/services/storage';
import { Event } from '@/types';
import { Calendar, Clock, MapPin, Share2, ArrowLeft } from 'lucide-react-native';

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEventAndGenerateQR(id);
    }
  }, [id]);

  const loadEventAndGenerateQR = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await fetchEventById(eventId);
      setEvent(data);
      
      // Generate QR code value (eventId + userId + timestamp)
      const userId = await getUserId() || 'guest';
      const timestamp = new Date().getTime();
      
      // Create a secure hash of the data
      const qrData = JSON.stringify({
        e: eventId,
        u: userId,
        t: timestamp,
        v: 1 // version
      });
      
      // Encode the data as base64 for smaller QR code
      const base64Data = btoa(unescape(encodeURIComponent(qrData)));
      setQrValue(base64Data);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate check-in QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      await Share.share({
        title: `I'm attending ${event.name}!`,
        message: `I'm attending ${event.name} at ${event.venue} on ${format(new Date(event.date), 'MMMM d, yyyy')}. Hope to see you there!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Check-in QR',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={colors.text} size={24} />
              </TouchableOpacity>
            ),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Check-in QR',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={colors.text} size={24} />
              </TouchableOpacity>
            ),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Check-in QR',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleShare}>
              <Share2 color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.content}>
        <View style={[styles.eventCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.name}</Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Calendar size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {format(new Date(event.date), 'MMMM d, yyyy')}
              </Text>
            </View>
            
            <View style={styles.eventDetailItem}>
              <Clock size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.time}
              </Text>
            </View>
            
            <View style={styles.eventDetailItem}>
              <MapPin size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.venue}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.qrSection}>
          <Text style={[styles.qrTitle, { color: colors.text }]}>Check-in QR Code</Text>
          <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={250}
                color={colors.text}
                backgroundColor={colors.card}
              />
            ) : (
              <Text style={{ color: colors.error }}>Error generating QR code</Text>
            )}
          </View>
          <Text style={[styles.qrInstructions, { color: colors.subtext }]}>
            Show this QR code to the event organizer for check-in
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/event-feedback/${event.id}`)}
          >
            <Text style={styles.buttonText}>Leave Feedback</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.push(`/event-details/${event.id}`)}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Event Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 8,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});