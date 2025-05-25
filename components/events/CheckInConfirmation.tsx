import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, X, Clock } from 'lucide-react-native';
import { format } from 'date-fns';

interface CheckInConfirmationProps {
  success: boolean;
  message: string;
  userName?: string;
  timestamp?: string;
  onClose: () => void;
}

export default function CheckInConfirmation({
  success,
  message,
  userName,
  timestamp,
  onClose,
}: CheckInConfirmationProps) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const formattedTime = timestamp
    ? format(new Date(timestamp), 'h:mm a, MMM d, yyyy')
    : '';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: success ? colors.success : colors.error },
        ]}
      >
        {success ? (
          <Check size={40} color="#FFFFFF" />
        ) : (
          <X size={40} color="#FFFFFF" />
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {success ? 'Check-In Successful' : 'Check-In Failed'}
      </Text>

      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

      {userName && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.subtext }]}>Name:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{userName}</Text>
        </View>
      )}

      {timestamp && (
        <View style={styles.detailRow}>
          <Clock size={16} color={colors.subtext} style={styles.detailIcon} />
          <Text style={[styles.detailValue, { color: colors.text }]}>{formattedTime}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onClose}
      >
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  detailLabel: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  detailIcon: {
    marginRight: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
