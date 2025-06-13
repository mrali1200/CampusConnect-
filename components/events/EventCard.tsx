import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types';
import { Calendar, Clock, MapPin } from 'lucide-react-native';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    router.push(`/event-details/${event.id}`);
  };

  // Ensure we have a valid image URL
  const imageUrl = event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  const eventTitle = event.title || event.name || 'Untitled Event';
  const eventLocation = event.venue || event.location || 'Location TBD';
  const eventTime = event.time || '10:00 AM';
  const eventCategory = event.category || 'General';
  
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
      />
      
      <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
        <Text style={[styles.categoryText, { color: '#fff' }]}>{eventCategory}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text 
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {eventTitle}
        </Text>
        
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Calendar size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text style={[styles.metadataText, { color: colors.text }]}>
              {format(new Date(event.date), 'MMM d, yyyy')}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Clock size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text style={[styles.metadataText, { color: colors.text }]}>
              {eventTime}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <MapPin size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text 
              style={[styles.metadataText, { color: colors.text }]}
              numberOfLines={1}
            >
              {eventLocation}
            </Text>
          </View>
        </View>
        
        <Text 
          style={[styles.description, { color: colors.subtext }]}
          numberOfLines={2}
        >
          {event.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metadataContainer: {
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metadataIcon: {
    marginRight: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});