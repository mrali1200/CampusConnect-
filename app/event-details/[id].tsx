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
import { useAuth } from '../../contexts/AuthContext';
import { configureNotifications, scheduleEventReminder } from '@/services/notifications';
import { Calendar, Clock, MapPin, Share2, Users, ArrowLeft, Bell } from 'lucide-react-native';
import { storage } from '@/lib/storage';

type Event = import('@/lib/storage').Event;
type Registration = import('@/lib/storage').Registration;

export default function EventDetailsScreen() { 
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user, isGuest } = useAuth();
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
      const data = await storage.getEvent(eventId);
      if (!data) {
        setError('Event not found');
        return;
      }
      setEvent(data);
    } catch (err) {
      setError('Failed to load event details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async (eventId: string) => {
    if (!user) return;
    
    try {
      const registrations = await storage.getRegistrationsByUser(user.id);
      const registered = registrations.some(
        reg => reg.eventId === eventId && reg.status !== 'cancelled'
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleRegister = async () => {
    if (!event || !user) return;
    
    if (isGuest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to register for events. Guest users cannot register for events.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: () => router.push('/sign-in'),
          },
        ]
      );
      return;
    }
    
    try {
      // Save registration to local storage
      const registration: Omit<Registration, 'id' | 'registeredAt' | 'updatedAt'> = {
        eventId: event.id,
        userId: user.id,
        status: 'registered'
      };
      
      await storage.saveRegistration(registration);
      setIsRegistered(true);
      
      // Show success message
      Alert.alert(
        'Registration Successful',
        `You've successfully registered for ${event.title}. We'll send you a reminder before the event!`,
        [
          { 
            text: 'OK',
            onPress: () => {
              // Refresh registration status
              checkRegistrationStatus(event.id);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        'There was an error processing your registration. Please try again.'
      );
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      await Share.share({
        title: event.title,
        message: `Check out this event: ${event.title} at ${event.location} on ${format(new Date(event.date), 'MMMM d, yyyy')}. ${event.description}`,
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
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
          
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
                {event.location}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Users size={20} color={colors.primary} style={styles.metadataIcon} />
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Capacity: {event.capacity}
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
                  Organizer ID: {event.creatorId}
                </Text>
                <Text style={[styles.organizerDescription, { color: colors.subtext }]}>
                  Campus event organizer
                </Text>
              </View>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actionContainer}>
            {!user ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/sign-in')}
              >
                <Text style={styles.buttonText}>Sign In to Register</Text>
              </TouchableOpacity>
            ) : isRegistered ? (
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