import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import EventList from '@/components/events/EventList';
import SearchFilterBar from '@/components/events/SearchFilterBar';
import { storage } from '@/lib/storage';
import { useTheme } from '@/contexts/ThemeContext';
type Event = import('@/lib/storage').Event;
import { Search, Tag, SlidersHorizontal } from 'lucide-react-native';

// Categories for filtering events
const CATEGORIES = [
  'All',
  'Academic',
  'Social',
  'Sports',
  'Workshop',
  'Conference',
  'Performance',
  'Club',
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'newest' | 'popular'>('newest');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null } | null>(null);
  
  // Animation for search bar hiding
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -200],
    extrapolate: 'clamp'
  });
  
  // Animation for opacity to completely hide the search bar
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 40, 50],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });

  // Load events on initial mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await storage.getEvents();
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterAndSortEvents();
  }, [searchQuery, selectedCategory, sortOption, dateRange, events]);

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          (event.description || '').toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((event) => event.category === selectedCategory || selectedCategory === 'All');
    }

    // Apply date range filter
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        
        // Check if event is after start date (if provided)
        if (dateRange.startDate && eventDate < dateRange.startDate) {
          return false;
        }
        
        // Check if event is before end date (if provided)
        if (dateRange.endDate) {
          // Add one day to end date to include events on the end date
          const endDatePlusOne = new Date(dateRange.endDate);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          if (eventDate >= endDatePlusOne) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Apply sorting
    if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOption === 'popular') {
      // Sort by date as a fallback for popularity since we don't track popularity in local storage
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setFilteredEvents(filtered);
  };

  const [showSearch, setShowSearch] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    // Reset the scroll position to show the search bar when toggled
    if (!showSearch) {
      scrollY.setValue(0);
    }
  };
  
  const handleCategorySelect = (category: string) => {
    if (category === 'All' || category === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
    // Hide the categories panel after selection
    setShowCategories(false);
  };

  // Set status bar to translucent for full screen effect
  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    return () => {
      StatusBar.setTranslucent(false);
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor="transparent" translucent />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Campus Events',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTransparent: true,
          headerRight: () => (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                onPress={toggleSearch} 
                style={[styles.headerButton, showSearch && styles.activeHeaderButton, { backgroundColor: showSearch ? colors.primary : 'transparent' }]}
              >
                <Search size={20} color={showSearch ? colors.background : colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  // Toggle sort option between newest and popular
                  setSortOption(sortOption === 'newest' ? 'popular' : 'newest');
                }} 
                style={[styles.headerButton, { marginLeft: 8 }]}
              >
                <SlidersHorizontal size={20} color={colors.text} />
                <Text style={[styles.sortIndicator, { color: colors.text }]}>
                  {sortOption === 'newest' ? 'Newest' : 'Popular'}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.contentContainer}>
        {showSearch && (
          <Animated.View 
            style={[
              styles.searchBarWrapper,
              { 
                transform: [{ translateY: searchBarTranslateY }],
                opacity: searchBarOpacity,
                backgroundColor: 'transparent',
                position: 'absolute',
                left: 0,
                right: 0,
                zIndex: 10
              }
            ]}
          >
            <SearchFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortOption={sortOption}
              setSortOption={setSortOption}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </Animated.View>
        )}
        
        {/* Categories are now integrated into the SearchFilterBar */}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No events found. Try adjusting your filters.
            </Text>
          </View>
        ) : (
          <EventList 
            events={filteredEvents} 
            onScroll={(event) => {
              // Manual update of the scroll value without using native driver
              scrollY.setValue(event.nativeEvent.contentOffset.y);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 50, // Add padding to make room for the absolute positioned search bar
  },
  searchBarWrapper: {
    zIndex: 10,
    paddingTop: 4,
    paddingHorizontal: 0,
  },
  categoriesWrapper: {
    zIndex: 10,
    paddingTop: 4,
    paddingHorizontal: 0,
  },
  categoriesScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  activeHeaderButton: {
    padding: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  sortIndicator: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
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
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});