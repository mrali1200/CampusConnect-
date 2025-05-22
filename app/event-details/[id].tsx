import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Share,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEventById } from '@/services/api';
import { registerForEvent, isEventRegistered } from '@/services/storage';
import { configureNotifications, scheduleEventReminder, trackNotification } from '@/services/notifications';
import { Event } from '@/types';
import { Calendar, Clock, MapPin, Share2, Users, ArrowLeft, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function EventDetailsScreen() { 
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent(id);
      checkRegistrationStatus(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await fetchEventById(eventId);
      setEvent(data);
    } catch (err) {
      setError('Failed to load event details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async (eventId: string) => {
    const registered = await isEventRegistered(eventId);
    setIsRegistered(registered);
  };

  const handleRegister = async () => {
    if (!event) return;
    
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'You need to sign in to register for events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/sign-in') }
        ]
      );
      return;
    }
    
    try {
      // Register for the event
      await registerForEvent(event);
      
      // Also save registration to Supabase
      const { error } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'registered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      // Schedule notification for the event
      const hasPermission = await configureNotifications();
      if (hasPermission) {
        const notificationId = await scheduleEventReminder(event.id, user.id);
        if (notificationId) {
          // Track notification in database
          await trackNotification(user.id, event.id, notificationId);
        }
      }
      
      setIsRegistered(true);
      router.push(`/registration-confirmation/${event.id}`);
    } catch (err) {
      console.error('Failed to register:', err);
      Alert.alert('Registration Failed', 'Failed to register for the event. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      await Share.share({
        title: event.name,
        message: Platform.OS === 'ios' 
          ? `Check out this event: ${event.name}`
          : `Check out this event: ${event.name} at ${event.venue} on ${format(new Date(event.date), 'MMMM d, yyyy')}. ${event.description}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewFeedback = () => {
    if (!event) return;
    router.push(`/event-feedback/${event.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Event Details',
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Event Details',
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
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Event not found.'}
          </Text>
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
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Share2 color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' }}
            style={styles.eventImage}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.name}</Text>
          
          {/* Event metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Calendar size={20} color={colors.primary} style={styles.metadataIcon} />
              <Text style={[styles.metadataText, { color: colors.text }]}>
                {format(new Date(event.date), 'MMMM d, yyyy')}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Clock size={20} color={colors.primary} style={styles.metadataIcon} />
              <Text style={[styles.metadataText, { color: colors.text }]}>
                {event.time}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <MapPin size={20} color={colors.primary} style={styles.metadataIcon} />
              <Text style={[styles.metadataText, { color: colors.text }]}>
                {event.venue}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Users size={20} color={colors.primary} style={styles.metadataIcon} />
              <Text style={[styles.metadataText, { color: colors.text }]}>
                {event.popularity} attending
              </Text>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Event</Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {event.description}
            </Text>
          </View>
          
          {/* Organizer */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Organizer</Text>
            <View style={[styles.organizerCard, { backgroundColor: colors.card }]}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg' }}
                style={styles.organizerLogo}
              />
              <View style={styles.organizerInfo}>
                <Text style={[styles.organizerName, { color: colors.text }]}>
                  {event.organizer || 'Student Activities Board'}
                </Text>
                <Text style={[styles.organizerDescription, { color: colors.subtext }]}>
                  Campus event organizer
                </Text>
              </View>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actionContainer}>
            {isRegistered ? (
              <>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={() => router.push(`/check-in/${event.id}`)}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                    View Check-in QR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleViewFeedback}
                >
                  <Text style={styles.buttonText}>View Feedback</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleRegister}
              >
                <View style={styles.buttonContent}>
                  <Bell size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Register & Get Reminders</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metadataContainer: {
    marginBottom: 24,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    marginRight: 8,
  },
  metadataText: {
    fontSize: 14,
  },
  section: {
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
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  organizerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  organizerDescription: {
    fontSize: 14,
  },
  actionContainer: {
    marginTop: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
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
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});