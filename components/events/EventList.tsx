import React from 'react';
import { StyleSheet, FlatList, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Event } from '@/types';
import EventCard from './EventCard';

interface EventListProps {
  events: Event[];
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export default function EventList({ events, onScroll }: EventListProps) {
  return (
    <FlatList
      data={events}
      renderItem={({ item }: { item: Event }) => <EventCard event={item} />}
      keyExtractor={(item: Event) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      scrollsToTop={false}
      stickyHeaderIndices={[]}
      scrollEventThrottle={16}
      onScroll={onScroll}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
});