import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Reply, MoreHorizontal, Send } from 'lucide-react-native';
import { format } from 'date-fns';
import storage from '@/lib/storage';

interface CommentWithLikes extends storage.Comment {
  userName: string;
  userAvatar?: string;
  likes: string[];
  replies?: CommentWithLikes[];
  hasLiked: boolean;
}

interface CommentSectionProps {
  eventId: string;
  onCommentAdded?: () => void;
}

export default function LocalCommentSection({ eventId, onCommentAdded }: CommentSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentWithLikes | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all comments for this event
      const eventComments = await storage.getCommentsByEvent(eventId);
      const allLikes = await storage.getLikes();
      const userId = user?.id;

      // Process comments to include user info and likes
      const processedComments = await Promise.all(
        eventComments
          .filter((comment) => !comment.parentId) // Only top-level comments
          .map(async (comment) => {
            const userProfile = await storage.getUserProfile(comment.userId);
            const commentLikes = allLikes.filter((like) => like.commentId === comment.id);
            
            // Process replies
            const replies = eventComments
              .filter((reply) => reply.parentId === comment.id)
              .map((reply) => {
                const replyLikes = allLikes.filter((like) => like.commentId === reply.id);
                const replyUserProfile = userProfiles.find((p) => p.userId === reply.userId);
                
                return {
                  ...reply,
                  userName: replyUserProfile?.fullName || 'Anonymous',
                  userAvatar: replyUserProfile?.avatarUrl,
                  likes: replyLikes.map((like) => like.userId),
                  hasLiked: userId ? replyLikes.some((like) => like.userId === userId) : false,
                };
              });

            return {
              ...comment,
              userName: userProfile?.fullName || 'Anonymous',
              userAvatar: userProfile?.avatarUrl,
              likes: commentLikes.map((like) => like.userId),
              hasLiked: userId ? commentLikes.some((like) => like.userId === userId) : false,
              replies,
            };
          })
      );

      setComments(processedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to add a comment');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmitting(true);

      const newComment = {
        eventId,
        content: commentText.trim(),
        userId: user.id,
        parentId: replyingTo?.id || null,
      };

      await storage.saveComment(newComment);

      // Clear input and refresh comments
      setCommentText('');
      setReplyingTo(null);
      await loadComments();
      
      // Notify parent component
      if (onCommentAdded) onCommentAdded();
      
      // Dismiss keyboard
      Keyboard.dismiss();
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to like comments');
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId) || 
                    comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
      
      if (!comment) return;

      if (comment.hasLiked) {
        await storage.removeLike(commentId, user.id);
      } else {
        await storage.addLike(commentId, user.id);
      }

      // Refresh comments to show updated likes
      await loadComments();
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const renderReply = ({ item }: { item: CommentWithLikes }) => (
    <View style={[styles.replyContainer, { borderLeftColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: item.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}`
            }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
            <Text style={[styles.timestamp, { color: colors.subtext }]}>
              {format(new Date(item.createdAt), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart 
            size={16} 
            color={item.hasLiked ? colors.error : colors.subtext} 
            fill={item.hasLiked ? colors.error : 'transparent'}
          />
          <Text 
            style={[styles.actionText, { 
              color: item.hasLiked ? colors.error : colors.subtext 
            }]}
          >
            {item.likes.length > 0 ? item.likes.length : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: CommentWithLikes }) => (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: item.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}`
            }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
            <Text style={[styles.timestamp, { color: colors.subtext }]}>
              {format(new Date(item.createdAt), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart 
            size={16} 
            color={item.hasLiked ? colors.error : colors.subtext} 
            fill={item.hasLiked ? colors.error : 'transparent'}
          />
          <Text 
            style={[styles.actionText, { 
              color: item.hasLiked ? colors.error : colors.subtext 
            }]}
          >
            {item.likes.length > 0 ? item.likes.length : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setReplyingTo(item)}
        >
          <Reply size={16} color={colors.subtext} />
          <Text style={[styles.actionText, { color: colors.subtext }]}>Reply</Text>
        </TouchableOpacity>
      </View>
      
      {/* Render replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          <FlatList
            data={item.replies}
            renderItem={renderReply}
            keyExtractor={(reply) => reply.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.commentsListContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadComments}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
          />
        )}
      </View>
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {replyingTo && (
          <View style={[styles.replyingToContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.replyingToText, { color: colors.subtext }]}>
              Replying to <Text style={{ fontWeight: '600' }}>{replyingTo.userName}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MoreHorizontal size={16} color={colors.subtext} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.subtext}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: commentText.trim() ? 1 : 0.5 }]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Send size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentsListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  replyContainer: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    marginBottom: 12,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 12,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
});
