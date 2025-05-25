import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useTheme } from '@/contexts/ThemeContext';
import { CalendarPlus, Check } from 'lucide-react-native';

interface CalendarIntegrationProps {
  eventName: string;
  eventLocation: string;
  eventDescription: string;
  startDate: Date;
  endDate: Date;
  onSuccess?: () => void;
}

export default function CalendarIntegration({
  eventName,
  eventLocation,
  eventDescription,
  startDate,
  endDate,
  onSuccess,
}: CalendarIntegrationProps) {
  const { colors } = useTheme();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCalendarPermissions = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is required to add this event to your calendar.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const getDefaultCalendarId = async (): Promise<string | null> => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Try to find the default calendar
      let defaultCalendar;
      
      if (Platform.OS === 'ios') {
        // On iOS, find the default calendar
        defaultCalendar = calendars.find((cal: Calendar.Calendar) => cal.source.name === 'Default' && cal.allowsModifications);
      } else {
        // On Android, find the first calendar that allows modifications
        defaultCalendar = calendars.find((cal: Calendar.Calendar) => cal.allowsModifications);
      }
      
      if (!defaultCalendar) {
        // If no suitable calendar found, use the first one that allows modifications
        defaultCalendar = calendars.find((cal: Calendar.Calendar) => cal.allowsModifications);
      }
      
      return defaultCalendar?.id || null;
    } catch (error) {
      console.error('Error finding calendar:', error);
      return null;
    }
  };

  const addEventToCalendar = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      const hasPermission = await requestCalendarPermissions();
      if (!hasPermission) {
        setLoading(false);
        return;
      }
      
      // Get default calendar ID
      const calendarId = await getDefaultCalendarId();
      if (!calendarId) {
        Alert.alert('Error', 'No suitable calendar found on your device.');
        setLoading(false);
        return;
      }
      
      // Create the event
      const eventDetails = {
        title: eventName,
        location: eventLocation,
        notes: eventDescription,
        startDate: startDate,
        endDate: endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }], // Reminder 1 hour before
      };
      
      const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
      
      if (eventId) {
        setAdded(true);
        if (onSuccess) onSuccess();
        Alert.alert('Success', 'Event added to your calendar');
      }
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      Alert.alert('Error', 'Failed to add event to calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: added ? colors.success : colors.card }]}
      onPress={addEventToCalendar}
      disabled={loading || added}
    >
      {added ? (
        <View style={styles.contentRow}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.addedText}>Added to Calendar</Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <CalendarPlus size={18} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {loading ? 'Adding to Calendar...' : 'Add to Calendar'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  addedText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

// Helper function to check if an event exists in the calendar
export async function checkEventExistsInCalendar(eventName: string, startDate: Date): Promise<boolean> {
  try {
    // Request permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return false;
    
    // Get calendars
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars
      .filter((cal: Calendar.Calendar) => cal.allowsModifications)
      .map((cal: Calendar.Calendar) => cal.id);
    
    if (calendarIds.length === 0) return false;
    
    // Set up time range for search (1 day before and after)
    const startSearchDate = new Date(startDate);
    startSearchDate.setDate(startSearchDate.getDate() - 1);
    
    const endSearchDate = new Date(startDate);
    endSearchDate.setDate(endSearchDate.getDate() + 1);
    
    // Search for events with the same name in the time range
    for (const calendarId of calendarIds) {
      const events = await Calendar.getEventsAsync(
        [calendarId],
        startSearchDate,
        endSearchDate
      );
      
      // Check if any event matches our event name
      const matchingEvent = events.find((event: Calendar.Event) => 
        event.title.toLowerCase() === eventName.toLowerCase()
      );
      
      if (matchingEvent) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking calendar events:', error);
    return false;
  }
}
