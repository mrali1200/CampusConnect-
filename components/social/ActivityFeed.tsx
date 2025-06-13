import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { Heart, MessageCircle, Share2, Calendar, Users } from 'lucide-react-native';
import { format } from 'date-fns';

type ActivityType = 'event_registration' | 'event_checkin' | 'comment' | 'like' | 'share';

interface ActivityLike {
  id: string;
  user_id: string;
  activity_id: string;
  created_at: string;
}

interface ActivityShare {
  id: string;
  activity_id: string;
  shared_at: string;
}

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
      const currentUserId = user?.id;

      // Load activities from local storage
      const activities = await storage.getData<ActivityItem[]>('activities') || [];
      
      // Filter by user or event if specified
      let filteredActivities = [...activities];
      
      if (userId) {
        filteredActivities = filteredActivities.filter(activity => activity.user_id === userId);
      }
      
      if (eventId) {
        filteredActivities = filteredActivities.filter(activity => activity.event_id === eventId);
      }
      
      // Sort by most recent
      filteredActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Apply limit
      if (limit) {
        filteredActivities = filteredActivities.slice(0, limit);
      }
      
      // Check if current user has liked each activity
      const activitiesWithLikes = await Promise.all(
        filteredActivities.map(async (activity) => {
          if (!currentUserId) return { ...activity, has_liked: false };
          
          // Check if user has liked this activity
          const likes = await storage.getData<ActivityLike[]>('activity_likes') || [];
          const hasLiked = likes.some(like => 
            like.user_id === currentUserId && like.activity_id === activity.id
          );
          
          return { ...activity, has_liked: hasLiked };
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

  const handleLike = async (activityId: string) => {
    if (!user) return;
    
    try {
      // Get all activities and likes
      const [activitiesData, likesData] = await Promise.all([
        storage.getData<ActivityItem[]>('activities'),
        storage.getData<ActivityLike[]>('activity_likes')
      ]);
      
      const allActivities: ActivityItem[] = activitiesData || [];
      const allLikes = likesData || [];
      
      // Find the activity
      const activity = allActivities.find(a => a.id === activityId);
      if (!activity) return;
      
      const hasLiked = allLikes.some(like => 
        like.user_id === user.id && like.activity_id === activityId
      );
      
      let updatedLikes = [...allLikes];
      
      if (hasLiked) {
        // Unlike: Remove the like
        updatedLikes = allLikes.filter(like => 
          !(like.user_id === user.id && like.activity_id === activityId)
        );
      } else {
        // Like: Add new like
        updatedLikes.push({
          id: `like-${Date.now()}`,
          user_id: user.id,
          activity_id: activityId,
          created_at: new Date().toISOString()
        });
      }
      
      // Update the activity's like count
      const updatedActivities = allActivities.map(a => {
        if (a.id === activityId) {
          return {
            ...a,
            likes_count: hasLiked 
              ? Math.max(0, (a.likes_count || 0) - 1)
              : (a.likes_count || 0) + 1,
            has_liked: !hasLiked
          };
        }
        return a;
      });
      
      // Save all changes
      await Promise.all([
        storage.setData('activities', updatedActivities),
        storage.setData('activity_likes', updatedLikes)
      ]);
      
      // Update local state with filtered activities
      const filteredActivities = updatedActivities
        .filter(a => {
          const matchesUser = !userId || a.user_id === userId;
          const matchesEvent = !eventId || a.event_id === eventId;
          return matchesUser && matchesEvent;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      
      setActivities(filteredActivities);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleShare = async (activity: ActivityItem) => {
    try {
      // In a real app, you would use the Share API to share content
      // For now, we'll just show an alert
      Alert.alert(
        'Share Activity', 
        `Share this ${activity.event_name ? 'event' : 'activity'} with others!`
      );
      
      // Log the share event
      const shares = await storage.getData<ActivityShare[]>('activity_shares') || [];
      shares.push({
        id: `share-${Date.now()}`,
        activity_id: activity.id,
        shared_at: new Date().toISOString()
      });
      await storage.setData('activity_shares', shares);
      
    } catch (error) {
      console.error('Error sharing activity:', error);
    }
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
