import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/lib/storage';
import { X, Check } from 'lucide-react-native';

interface ManualCheckInProps {
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

export default function ManualCheckIn({ eventId, onClose, onSuccess }: ManualCheckInProps) {
  const { colors } = useTheme();
  const [registrationCode, setRegistrationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    if (!registrationCode.trim()) {
      setError('Please enter a registration code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get all registrations
      const registrations = await storage.getRegistrations();
      
      // Find the registration with this code and event ID
      const registration = registrations.find(
        r => r.id === registrationCode && r.eventId === eventId
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
          userName: userProfile?.fullName || 'Guest',
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
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Manual Check-In</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.instructions, { color: colors.text }]}>
          Enter the registration code to check in the attendee:
        </Text>
        
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Registration Code"
          placeholderTextColor={colors.subtext}
          value={registrationCode}
          onChangeText={setRegistrationCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleCheckIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Check In</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 5,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
  },
});
