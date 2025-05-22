import React from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Text, Image } from 'react-native';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types';
import { Calendar } from 'lucide-react-native';

interface EventHorizontalListProps {
  events: Event[];
}

export default function EventHorizontalList({ events }: EventHorizontalListProps) {
  const { colors } = useTheme();

  const handleEventPress = (eventId: string) => {
    router.push(`/event-details/${eventId}`);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.card }]}
      onPress={() => handleEventPress(item.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg' }}
        style={styles.eventImage}
      />
      <View style={styles.cardContent}>
        <Text 
          style={[styles.eventTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.dateContainer}>
          <Calendar size={14} color={colors.primary} style={styles.dateIcon} />
          <Text style={[styles.dateText, { color: colors.subtext }]}>
            {format(new Date(item.date), 'MMM d')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      horizontal
      data={events}
      renderItem={renderEventItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsHorizontalScrollIndicator={false}
      ListEmptyComponent={
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No events available
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16,
  },
  eventCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  eventImage: {
    width: '100%',
    height: 100,
  },
  cardContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
  },
  emptyContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});