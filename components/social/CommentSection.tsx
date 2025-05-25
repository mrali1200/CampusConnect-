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
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, Reply, MoreHorizontal, Send } from 'lucide-react-native';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  user_name: string;
  user_avatar?: string;
  likes_count: number;
  has_liked?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  eventId: string;
  onCommentAdded?: () => void;
}

export default function CommentSection({ eventId, onCommentAdded }: CommentSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all comments for this event
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          parent_id,
          created_at,
          users:user_id (name, avatar_url),
          likes:comment_likes (count)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process comments to include user info and likes count
      const processedComments: Comment[] = await Promise.all(
        (data || []).map(async (comment: any) => {
          // Get user info
          const { data: userData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          // Get likes count
          const { count: likesCount } = await supabase
            .from('comment_likes')
            .select('id', { count: 'exact' })
            .eq('comment_id', comment.id);

          // Check if current user has liked this comment
          let hasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .single();
            hasLiked = !!likeData;
          }

          return {
            ...comment,
            user_name: userData?.name || 'Anonymous',
            user_avatar: userData?.avatar_url,
            likes_count: likesCount,
            has_liked: hasLiked,
            replies: [] as Comment[],  // Initialize with empty array
          };
        })
      );

      // Organize comments into threads
      const threadedComments = processedComments.filter(comment => !comment.parent_id);
      const replies = processedComments.filter(comment => comment.parent_id);

      // Add replies to their parent comments
      threadedComments.forEach(comment => {
        comment.replies = replies.filter(reply => reply.parent_id === comment.id);
      });

      setComments(threadedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      // Prompt user to sign in
      alert('Please sign in to add a comment');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmitting(true);

      const newComment = {
        event_id: eventId,
        content: commentText.trim(),
        user_id: user.id,
        parent_id: replyingTo ? replyingTo.id : null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(newComment)
        .select();

      if (error) throw error;

      // Also create an activity entry
      await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'comment',
        content: commentText.trim(),
        event_id: eventId,
        created_at: new Date().toISOString(),
      });

      // Clear input and refresh comments
      setCommentText('');
      setReplyingTo(null);
      loadComments();
      
      // Notify parent component
      if (onCommentAdded) onCommentAdded();
      
      // Dismiss keyboard
      Keyboard.dismiss();
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      alert('Please sign in to like comments');
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
      }

      // Update local state
      const updateComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            has_liked: !currentlyLiked,
            likes_count: currentlyLiked 
              ? Math.max(0, comment.likes_count - 1) 
              : comment.likes_count + 1
          };
        }
        
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment)
          };
        }
        
        return comment;
      };

      setComments(comments.map(updateComment));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const renderReply = ({ item }: { item: Comment }) => (
    <View style={[styles.replyContainer, { borderLeftColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: item.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user_name) 
            }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.user_name}</Text>
            <Text style={[styles.timestamp, { color: colors.subtext }]}>
              {format(new Date(item.created_at), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id, !!item.has_liked)}
        >
          <Heart 
            size={16} 
            color={item.has_liked ? colors.error : colors.subtext} 
            fill={item.has_liked ? colors.error : 'transparent'}
          />
          <Text 
            style={[styles.actionText, { 
              color: item.has_liked ? colors.error : colors.subtext 
            }]}
          >
            {item.likes_count > 0 ? item.likes_count : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: item.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user_name) 
            }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.user_name}</Text>
            <Text style={[styles.timestamp, { color: colors.subtext }]}>
              {format(new Date(item.created_at), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id, !!item.has_liked)}
        >
          <Heart 
            size={16} 
            color={item.has_liked ? colors.error : colors.subtext} 
            fill={item.has_liked ? colors.error : 'transparent'}
          />
          <Text 
            style={[styles.actionText, { 
              color: item.has_liked ? colors.error : colors.subtext 
            }]}
          >
            {item.likes_count > 0 ? item.likes_count : ''}
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
              Replying to <Text style={{ fontWeight: '600' }}>{replyingTo.user_name}</Text>
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
