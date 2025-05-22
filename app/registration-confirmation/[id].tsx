import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { format, addHours } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchEventById } from '@/services/api';
import { getUserId } from '@/services/storage';
import { Event } from '@/types';
import { Calendar, Clock, MapPin, Check, X, Bell } from 'lucide-react-native';

export default function RegistrationConfirmationScreen() {
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
      
      // Generate QR code value (eventId + userId)
      const userId = await getUserId();
      const qrData = JSON.stringify({
        eventId: eventId,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      
      setQrValue(qrData);
    } catch (err) {
      setError('Failed to load event details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllEvents = () => {
    router.push('/');
  };

  const handleViewCheckIn = () => {
    if (!event) return;
    router.push(`/check-in/${event.id}`);
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <X size={60} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Registration Error</Text>
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
          headerShown: false,
        }}
      />

      <View style={styles.successContent}>
        <View style={[styles.successHeader, { backgroundColor: colors.success }]}>
          <Check size={60} color="#FFFFFF" />
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successSubtitle}>You're all set for the event</Text>
        </View>

        <View style={styles.eventCard}>
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

        <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.qrTitle, { color: colors.text }]}>Your Check-in QR Code</Text>
          <View style={[styles.qrWrapper, { backgroundColor: colors.background }]}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={200}
                color={colors.text}
                backgroundColor={colors.background}
              />
            ) : (
              <Text style={{ color: colors.error }}>Error generating QR code</Text>
            )}
          </View>
          <Text style={[styles.qrInstructions, { color: colors.subtext }]}>
            Please present this QR code at the event for check-in
          </Text>
        </View>
        
        <View style={[styles.reminderContainer, { backgroundColor: colors.card }]}>
          <View style={styles.reminderHeader}>
            <Bell size={20} color={colors.primary} style={styles.reminderIcon} />
            <Text style={[styles.reminderTitle, { color: colors.text }]}>Event Reminders Set</Text>
          </View>
          <Text style={[styles.reminderText, { color: colors.subtext }]}>
            We'll send you a reminder 24 hours before the event starts
            {event.date && (
              <Text style={{ fontWeight: '500' }}>
                {' '}(on {format(addHours(new Date(event.date), -24), 'MMM d, h:mm a')})
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleViewCheckIn}
          >
            <Text style={styles.buttonText}>View Check-in QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleViewAllEvents}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Browse More Events
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  successContent: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  successSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  eventCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
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
  qrContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 12,
  },
  qrInstructions: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  reminderContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderIcon: {
    marginRight: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reminderText: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 28,
  },
  buttonContainer: {
    padding: 16,
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