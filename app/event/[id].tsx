import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage, type Event } from '@/lib/storage';
import LocalCommentSection from '@/components/social/LocalCommentSection';
import ShareEventModal from '@/components/social/ShareEventModal';
import CalendarIntegration from '@/components/calendar/CalendarIntegration';
import { scheduleEventReminder } from '@/components/notifications/NotificationSystem';
import { Calendar, MapPin, Clock, Users, Share2, MessageSquare, Bell, Heart, QrCode } from 'lucide-react-native';

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event details
      const eventData = await storage.getEvent(id);
      if (!eventData) throw new Error('Event not found');
      
      // Use the event data directly since it's already in the correct format from storage
      const formattedEvent: Event = {
        ...eventData,
        title: eventData.title || 'Untitled Event',
        description: eventData.description || '',
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '12:00',
        location: eventData.location || 'TBD',
        category: eventData.category || 'general',
        capacity: eventData.capacity || 0,
        imageUrl: eventData.imageUrl || 'https://via.placeholder.com/400x300',
        creatorId: eventData.creatorId || '',
        createdAt: eventData.createdAt || new Date().toISOString(),
        updatedAt: eventData.updatedAt || new Date().toISOString(),
      };

      setEvent(formattedEvent);

      // Check if user is registered and get counts
      if (user) {
        // Get all registrations for this event
        const registrations = await storage.getRegistrationsByEvent(id);
        const userRegistration = registrations.find(r => r.userId === user.id);
        
        setIsRegistered(!!userRegistration);
        setRegistrationCount(registrations.length);

        // For simplicity, we'll use the same registration status for likes
        // In a real app, you might have a separate likes system
        setIsLiked(!!userRegistration?.status && userRegistration.status === 'attended');
        setLikesCount(registrations.filter(r => r.status === 'attended').length);
      } else {
        // If not logged in, just get the counts
        const registrations = await storage.getRegistrationsByEvent(id);
        setRegistrationCount(registrations.length);
        setLikesCount(registrations.filter(r => r.status === 'attended').length);
      }

    } catch (err) {
      console.error('Error loading event:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    try {
      setLoading(true);

      if (isRegistered) {
        // Unregister from event
        const registrations = await storage.getRegistrations();
        const userRegistration = registrations.find(
          r => r.eventId === id && r.userId === user.id
        );

        if (userRegistration) {
          await storage.deleteRegistration(userRegistration.id);
          setRegistrationCount(prev => prev - 1);
          setIsRegistered(false);
        }
      } else {
        // Register for event
        await storage.saveRegistration({
          eventId: id,
          userId: user.id,
          status: 'registered',
        });

        setRegistrationCount(prev => prev + 1);
        setIsRegistered(true);
      }
    } catch (err) {
      console.error('Error updating registration:', err);
      Alert.alert('Error', 'Failed to update registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    try {
      setLoading(true);
      
      // Get existing registration or create a new one
      const registrations = await storage.getRegistrations();
      const userRegistration = registrations.find(
        r => r.eventId === id && r.userId === user.id
      );

      if (isLiked) {
        // Unlike the event by setting status back to registered
        if (userRegistration) {
          await storage.saveRegistration({
            ...userRegistration,
            status: 'registered',
          });
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like the event by setting status to attended
        if (userRegistration) {
          await storage.saveRegistration({
            ...userRegistration,
            status: 'attended',
          });
        } else {
          // If no registration exists, create one
          await storage.saveRegistration({
            eventId: id,
            userId: user.id,
            status: 'attended',
          });
        }
        setLikesCount(prev => prev + 1);
      }
      
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error updating like:', err);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerTitle: 'Event Details',
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
            headerTitle: 'Event Details',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Event not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadEvent}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const eventDate = new Date(event.date);
  const eventEndDate = new Date(eventDate);
  eventEndDate.setHours(eventEndDate.getHours() + 2); // Assuming 2-hour events

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: 'Event Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {showComments ? (
        <View style={styles.commentsContainer}>
          <View style={styles.commentsHeader}>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Text style={[styles.backButton, { color: colors.primary }]}>Back to Event</Text>
            </TouchableOpacity>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
            <View style={{ width: 80 }} /> {/* Spacer for alignment */}
          </View>
          <LocalCommentSection eventId={id} onCommentAdded={() => {}} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <Image
            source={{ uri: event.imageUrl || 'https://via.placeholder.com/400x200?text=Event+Image' }}
            style={[styles.eventImage, { width }]}
            resizeMode="cover"
          />

          <View style={styles.contentContainer}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Users size={16} color={colors.subtext} />
                <Text style={[styles.statText, { color: colors.subtext }]}>
                  {registrationCount} {registrationCount === 1 ? 'attendee' : 'attendees'}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Heart size={16} color={colors.subtext} />
                <Text style={[styles.statText, { color: colors.subtext }]}>
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Calendar size={18} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {eventDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Clock size={18} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {eventDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MapPin size={18} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>{event.location}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>About this event</Text>
            <Text style={[styles.description, { color: colors.text }]}>{event.description}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isRegistered ? colors.success : colors.primary }]}
                onPress={handleRegister}
              >
                <Text style={styles.actionButtonText}>
                  {isRegistered ? 'Registered' : 'Register'}
                </Text>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={[styles.iconButton, isLiked && { backgroundColor: colors.highlight }]}
                  onPress={handleLike}
                >
                  <Heart
                    size={20}
                    color={isLiked ? colors.error : colors.subtext}
                    fill={isLiked ? colors.error : 'transparent'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowComments(true)}
                >
                  <MessageSquare size={20} color={colors.subtext} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShareModalVisible(true)}
                >
                  <Share2 size={20} color={colors.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.integrationContainer}>
              <CalendarIntegration
                eventName={event.title}
                eventLocation={event.location}
                eventDescription={event.description}
                startDate={eventDate}
                endDate={eventEndDate}
              />
            </View>
            
            {isRegistered && (
              <View style={styles.qrCodeSection}>
                <TouchableOpacity
                  style={[styles.qrCodeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({
                    pathname: '/event/check-in',
                    params: { eventId: id, eventName: event.title }
                  })}
                >
                  <QrCode size={20} color={colors.primary} style={styles.qrCodeIcon} />
                  <View>
                    <Text style={[styles.qrCodeTitle, { color: colors.text }]}>Event Check-In</Text>
                    <Text style={[styles.qrCodeSubtitle, { color: colors.subtext }]}>
                      View your QR code or scan attendees
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Share Modal */}
      {event && (
        <ShareEventModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          event={event}
        />
      )}
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventImage: {
    height: 200,
  },
  contentContainer: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  integrationContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  qrCodeSection: {
    marginBottom: 16,
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrCodeIcon: {
    marginRight: 16,
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  qrCodeSubtitle: {
    fontSize: 14,
  },
  commentsContainer: {
    flex: 1,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
});
