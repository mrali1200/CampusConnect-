import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import EventList from '@/components/events/EventList';
import SearchFilterBar from '@/components/events/SearchFilterBar';
import { fetchEvents } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types';
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

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
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
  }, [searchQuery, selectedCategory, sortOption, events]);

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }

    // Apply sorting
    if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOption === 'popular') {
      filtered.sort((a, b) => b.popularity - a.popularity);
    }

    setFilteredEvents(filtered);
  };

  const [showSearch, setShowSearch] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setShowCategories(false);
    // Reset the scroll position to show the search bar when toggled
    if (!showSearch) {
      scrollY.setValue(0);
    }
  };

  const toggleCategories = () => {
    setShowCategories(!showCategories);
    setShowSearch(false);
    // Reset the scroll position to show the categories when toggled
    if (!showCategories) {
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
          headerScrollEffect: 'none',
          headerRight: () => (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity onPress={toggleCategories} style={styles.headerButton}>
                <Tag size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSearch} style={styles.headerButton}>
                <Search size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  // Toggle sort option between newest and popular
                  setSortOption(sortOption === 'newest' ? 'popular' : 'newest');
                }} 
                style={styles.headerButton}
              >
                <SlidersHorizontal size={20} color={colors.text} />
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
            />
          </Animated.View>
        )}
        
        {showCategories && (
          <Animated.View 
            style={[
              styles.categoriesWrapper,
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === 'All' && !selectedCategory
                          ? colors.primary
                          : category === selectedCategory
                          ? colors.primary
                          : colors.card,
                    },
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          category === 'All' && !selectedCategory
                            ? colors.background
                            : category === selectedCategory
                            ? colors.background
                            : colors.text,
                      },
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

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