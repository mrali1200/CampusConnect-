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

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: event.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' }}
        style={styles.image}
      />
      
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{event.category}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text 
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {event.name}
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
              {event.time}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <MapPin size={16} color={colors.primary} style={styles.metadataIcon} />
            <Text 
              style={[styles.metadataText, { color: colors.text }]}
              numberOfLines={1}
            >
              {event.venue}
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