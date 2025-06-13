import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import ManualCheckIn from '@/components/events/ManualCheckIn';
import QRCodeScanner from '@/components/events/QRCodeScanner';
import CheckInConfirmation from '@/components/events/CheckInConfirmation';
import { QrCode, ArrowLeft, Keyboard } from 'lucide-react-native';

interface CheckInResult {
  success: boolean;
  message: string;
  userName?: string;
  timestamp?: string;
}

function EventCheckInScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { eventId, eventName } = useLocalSearchParams<{ eventId: string; eventName: string }>();
  
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Check if user is an organizer for this event
  React.useEffect(() => {
    if (user && eventId) {
      checkOrganizerStatus();
    }
  }, [user, eventId]);

  const checkOrganizerStatus = async () => {
    try {
      // Check if user is an organizer for this event from local storage
      const events = await storage.getEvents();
      const event = events.find(e => e.id === eventId);
      
      if (event && user) {
        // Check if the current user is the creator of this event
        const isUserOrganizer = event.creatorId === user.id;
        setIsOrganizer(isUserOrganizer);
      }
    } catch (err) {
      console.error('Error checking organizer status:', err);
    }
  };

  const handleScanQRCode = () => {
    setScannerVisible(true);
  };

  const handleScanComplete = (result: CheckInResult) => {
    setScannerVisible(false);
    setCheckInResult(result);
  };

  const handleCloseConfirmation = () => {
    setCheckInResult(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: 'Event Check-In',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {eventName || 'Event'} Check-In
        </Text>

        {isOrganizer ? (
          <View style={styles.organizerSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Organizer Check-In Portal
            </Text>
            <Text style={[styles.description, { color: colors.subtext }]}>
              As an organizer, you can scan attendee QR codes to check them in to this event.
            </Text>

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={handleScanQRCode}
            >
              <QrCode size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Scan Attendee QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.attendeeSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendee Information
            </Text>
            <Text style={[styles.description, { color: colors.subtext }]}>
              You need to be an event organizer to access the check-in portal. If you are an
              organizer, please contact the administrator to update your permissions.
            </Text>
          </View>
        )}
      </View>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <ManualCheckIn
          eventId={eventId || ''}
          onClose={() => setScannerVisible(false)}
          onSuccess={handleScanComplete}
        />
      </Modal>

      {/* Check-in Confirmation Modal */}
      <Modal
        visible={!!checkInResult}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseConfirmation}
      >
        <View style={styles.modalOverlay}>
          {checkInResult && (
            <CheckInConfirmation
              success={checkInResult.success}
              message={checkInResult.message}
              userName={checkInResult.userName}
              timestamp={checkInResult.timestamp}
              onClose={handleCloseConfirmation}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  organizerSection: {
    marginBottom: 24,
  },
  attendeeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Explicitly export the component as default for Expo Router
const CheckInScreen = EventCheckInScreen;
export default CheckInScreen;
