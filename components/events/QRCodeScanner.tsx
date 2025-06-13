import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import CustomBarCodeScanner from './CustomBarCodeScanner';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/lib/storage';
import { X, Check, RefreshCw } from 'lucide-react-native';

interface QRCodeScannerProps {
  eventId: string;
  onClose: () => void;
  onSuccess: (data: CheckInResult) => void;
}

interface CheckInResult {
  success: boolean;
  message: string;
  userName?: string;
  timestamp?: string;
}

export default function QRCodeScanner({ eventId, onClose, onSuccess }: QRCodeScannerProps) {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      // Request barcode scanner permissions
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    
    try {
      setScanned(true);
      setProcessing(true);
      
      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (e) {
        throw new Error('Invalid QR code format');
      }
      
      // Validate QR code data
      if (qrData.type !== 'event-checkin' || !qrData.eventId || !qrData.userId || !qrData.registrationId) {
        throw new Error('Invalid check-in QR code');
      }
      
      // Verify this is for the correct event
      if (qrData.eventId !== eventId) {
        throw new Error('This QR code is for a different event');
      }
      
      // Get all registrations
      const registrations = await storage.getRegistrations();
      
      // Find the registration
      const registration = registrations.find(
        r => r.id === qrData.registrationId && 
             r.eventId === eventId && 
             r.userId === qrData.userId
      );
      
      if (!registration) {
        throw new Error('Registration not found');
      }
      
      // Check if already checked in
      if (registration.status === 'attended') {
        const userProfile = await storage.getUserProfile(registration.userId);
        const result: CheckInResult = {
          success: false,
          message: 'Already checked in',
          userName: userProfile?.fullName || 'Unknown',
          timestamp: new Date().toISOString(),
        };
        onSuccess(result);
        return;
      }
      
      // Update registration status to attended
      await storage.saveRegistration({
        ...registration,
        status: 'attended',
      });
      
      // Get user profile for the success message
      const userProfile = await storage.getUserProfile(registration.userId);
      
      // Success
      const result: CheckInResult = {
        success: true,
        message: 'Check-in successful!',
        userName: userProfile?.fullName || 'Guest',
        timestamp: new Date().toISOString(),
      };
      onSuccess(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process QR code';
      
      const result: CheckInResult = {
        success: false,
        message: errorMessage,
      };
      
      onSuccess(result);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Camera permission is required to scan QR codes.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Scan Check-In QR Code</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cameraContainer}>
        <CustomBarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={styles.camera}
          disabled={scanned}
        />
        
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </View>
      
      <Text style={[styles.instructions, { color: colors.text }]}>
        Position the QR code within the square.
      </Text>
      
      {scanned && (
        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: colors.primary }]}
          onPress={handleReset}
        >
          <RefreshCw size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 12,
    position: 'relative',
    marginBottom: 20,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
