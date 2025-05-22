import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchEventById } from '@/services/api';
import { 
  saveFeedback, 
  getFeedbackForEvent, 
  saveCommentReaction, 
  getCommentReactions 
} from '@/services/storage';
import { Event, Feedback, CommentReaction } from '@/types';
import { Star, Heart, ThumbsUp, MessageSquare, ArrowLeft } from 'lucide-react-native';

export default function EventFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [reactions, setReactions] = useState<Record<string, CommentReaction>>({});

  useEffect(() => {
    if (id) {
      loadEventAndFeedback(id);
    }
  }, [id]);

  const loadEventAndFeedback = async (eventId: string) => {
    setLoading(true);
    try {
      const eventData = await fetchEventById(eventId);
      setEvent(eventData);
      
      const feedbackData = await getFeedbackForEvent(eventId);
      setFeedbackList(feedbackData);
      
      const reactionsData = await getCommentReactions(eventId);
      setReactions(reactionsData);
    } catch (err) {
      setError('Failed to load event details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!event || !id || rating === 0 || !commentText.trim()) {
      alert('Please provide both a rating and a comment.');
      return;
    }
    
    try {
      const newFeedback: Feedback = {
        id: Date.now().toString(),
        eventId: id,
        userName: 'John Doe', // In a real app, get from user profile
        rating,
        comment: commentText,
        timestamp: new Date().toISOString(),
      };
      
      await saveFeedback(newFeedback);
      
      // Update local state
      setFeedbackList([newFeedback, ...feedbackList]);
      setCommentText('');
      setRating(0);
      
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Failed to save feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleReaction = async (feedbackId: string, reactionType: 'like' | 'love') => {
    if (!id) return;
    
    try {
      const reactionKey = `${feedbackId}_${reactionType}`;
      const currentReactions = { ...reactions };
      
      if (currentReactions[reactionKey]) {
        // Toggle reaction off if already selected
        const newCount = currentReactions[reactionKey].count - 1;
        if (newCount <= 0) {
          delete currentReactions[reactionKey];
        } else {
          currentReactions[reactionKey] = {
            ...currentReactions[reactionKey],
            count: newCount,
            selected: false,
          };
        }
      } else {
        // Add new reaction
        currentReactions[reactionKey] = {
          type: reactionType,
          count: 1,
          selected: true,
        };
      }
      
      setReactions(currentReactions);
      await saveCommentReaction(id, feedbackId, reactionType, currentReactions[reactionKey]?.selected || false);
    } catch (err) {
      console.error('Failed to save reaction:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Event Feedback',
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

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Event Feedback',
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
          <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Event not found.'}</Text>
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
          title: 'Event Feedback',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Event Title */}
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.name}</Text>

          {/* Feedback Form */}
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Share Your Feedback</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: colors.text }]}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color={star <= rating ? colors.accent : colors.border}
                      fill={star <= rating ? colors.accent : 'none'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <Text style={[styles.commentLabel, { color: colors.text }]}>Your Comment:</Text>
              <TextInput
                style={[
                  styles.commentInput, 
                  { 
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                placeholder="Share your thoughts about the event..."
                placeholderTextColor={colors.subtext}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (!commentText.trim() || rating === 0) && { opacity: 0.7 }
              ]}
              onPress={handleSubmitFeedback}
              disabled={!commentText.trim() || rating === 0}
            >
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MessageSquare size={20} color={colors.text} />
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                Comments {feedbackList.length > 0 ? `(${feedbackList.length})` : ''}
              </Text>
            </View>
            
            {feedbackList.length === 0 ? (
              <View style={[styles.emptyCommentsContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyCommentsText, { color: colors.subtext }]}>
                  Be the first to leave a comment!
                </Text>
              </View>
            ) : (
              feedbackList.map((feedback) => (
                <View 
                  key={feedback.id} 
                  style={[styles.commentCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.commentHeader}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {feedback.userName}
                    </Text>
                    <View style={styles.ratingDisplay}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          color={i < feedback.rating ? colors.accent : colors.border}
                          fill={i < feedback.rating ? colors.accent : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    {feedback.comment}
                  </Text>
                  
                  <View style={styles.commentActions}>
                    <TouchableOpacity 
                      style={styles.reactionButton}
                      onPress={() => handleReaction(feedback.id, 'like')}
                    >
                      <ThumbsUp 
                        size={18} 
                        color={reactions[`${feedback.id}_like`]?.selected ? colors.primary : colors.subtext}
                        fill={reactions[`${feedback.id}_like`]?.selected ? colors.primary : 'none'}
                      />
                      {reactions[`${feedback.id}_like`]?.count > 0 && (
                        <Text style={[
                          styles.reactionCount, 
                          { 
                            color: reactions[`${feedback.id}_like`]?.selected 
                              ? colors.primary 
                              : colors.subtext 
                          }
                        ]}>
                          {reactions[`${feedback.id}_like`]?.count}
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.reactionButton}
                      onPress={() => handleReaction(feedback.id, 'love')}
                    >
                      <Heart 
                        size={18} 
                        color={reactions[`${feedback.id}_love`]?.selected ? colors.error : colors.subtext}
                        fill={reactions[`${feedback.id}_love`]?.selected ? colors.error : 'none'}
                      />
                      {reactions[`${feedback.id}_love`]?.count > 0 && (
                        <Text style={[
                          styles.reactionCount, 
                          { 
                            color: reactions[`${feedback.id}_love`]?.selected 
                              ? colors.error 
                              : colors.subtext 
                          }
                        ]}>
                          {reactions[`${feedback.id}_love`]?.count}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 8,
  },
  commentInputContainer: {
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyCommentsContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
  },
  commentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingDisplay: {
    flexDirection: 'row',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});