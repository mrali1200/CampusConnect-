import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share2, MoreHorizontal, Calendar, Users } from 'lucide-react-native';
import { format } from 'date-fns';

type ActivityType = 'event_registration' | 'event_checkin' | 'comment' | 'like' | 'share';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  content: string;
  event_id?: string;
  event_name?: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
}

interface ActivityFeedProps {
  userId?: string; // If provided, show only activities for this user
  eventId?: string; // If provided, show only activities for this event
  limit?: number;
}

export default function ActivityFeed({ userId, eventId, limit = 20 }: ActivityFeedProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [userId, eventId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('activities')
        .select(`
          id,
          user_id,
          activity_type,
          content,
          event_id,
          created_at,
          users:user_id (name, avatar_url),
          events:event_id (name),
          likes:activity_likes (count),
          comments:activity_comments (count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Check if current user has liked each activity
      const activitiesWithLikes = await Promise.all(
        (data || []).map(async (activity: any) => {
          let hasLiked = false;
          
          if (user) {
            const { data: likeData } = await supabase
              .from('activity_likes')
              .select('id')
              .eq('activity_id', activity.id)
              .eq('user_id', user.id)
              .single();
            
            hasLiked = !!likeData;
          }

          return {
            id: activity.id,
            user_id: activity.user_id,
            activity_type: activity.activity_type,
            content: activity.content,
            event_id: activity.event_id,
            event_name: activity.events?.name,
            created_at: activity.created_at,
            user_name: activity.users?.name || 'Unknown User',
            user_avatar: activity.users?.avatar_url,
            likes_count: activity.likes?.count || 0,
            comments_count: activity.comments?.count || 0,
            has_liked: hasLiked
          };
        })
      );

      setActivities(activitiesWithLikes);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activity feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const handleLike = async (activityId: string, currentlyLiked: boolean) => {
    if (!user) return; // Require authentication

    try {
      if (currentlyLiked) {
        // Unlike
        await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
      }

      // Update local state
      setActivities(activities.map(activity => {
        if (activity.id === activityId) {
          return {
            ...activity,
            has_liked: !currentlyLiked,
            likes_count: currentlyLiked 
              ? Math.max(0, activity.likes_count - 1) 
              : activity.likes_count + 1
          };
        }
        return activity;
      }));
    } catch (err) {
      console.error('Error liking activity:', err);
    }
  };

  const handleShare = async (activity: ActivityItem) => {
    // Implement share functionality
    console.log('Share activity:', activity.id);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'event_registration':
        return <Calendar size={16} color={colors.primary} />;
      case 'event_checkin':
        return <Users size={16} color={colors.primary} />;
      case 'comment':
        return <MessageCircle size={16} color={colors.primary} />;
      case 'like':
        return <Heart size={16} color={colors.primary} />;
      case 'share':
        return <Share2 size={16} color={colors.primary} />;
      default:
        return <Calendar size={16} color={colors.primary} />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case 'event_registration':
        return `registered for ${activity.event_name || 'an event'}`;
      case 'event_checkin':
        return `checked in to ${activity.event_name || 'an event'}`;
      case 'comment':
        return `commented: "${activity.content}"`;
      case 'like':
        return `liked ${activity.event_name || 'an event'}`;
      case 'share':
        return `shared ${activity.event_name || 'an event'}`;
      default:
        return activity.content;
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <View style={[styles.activityItem, { backgroundColor: colors.card }]}>
      <View style={styles.activityHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: item.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user_name) 
            }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{item.user_name}</Text>
            <View style={styles.activityTypeContainer}>
              {getActivityIcon(item.activity_type)}
              <Text style={[styles.activityType, { color: colors.subtext }]}>
                {getActivityText(item)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.timestamp, { color: colors.subtext }]}>
          {format(new Date(item.created_at), 'MMM d')}
        </Text>
      </View>
      
      {item.content && item.activity_type !== 'comment' && (
        <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
      )}
      
      <View style={styles.activityFooter}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id, !!item.has_liked)}
        >
          <Heart 
            size={18} 
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
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={18} color={colors.subtext} />
          <Text style={[styles.actionText, { color: colors.subtext }]}>
            {item.comments_count > 0 ? item.comments_count : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Share2 size={18} color={colors.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadActivities}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No activity to show yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
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
  listContent: {
    padding: 16,
  },
  activityItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityType: {
    fontSize: 13,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
