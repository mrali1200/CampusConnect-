import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react-native';

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

interface SearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  sortOption: 'newest' | 'popular';
  setSortOption: (option: 'newest' | 'popular') => void;
}

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCategorySelect = (category: string) => {
    if (category === 'All' || category === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const handleSortSelect = (option: 'newest' | 'popular') => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  return (
    <View style={styles.container}>
      {/* Compact Search Bar with Toggle */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.toggleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Collapsible Categories and Filters */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
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
                    styles.categoryText,
                    {
                      color:
                        category === 'All' && !selectedCategory
                          ? colors.text
                          : category === selectedCategory
                          ? colors.text
                          : colors.text,
                    },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Button */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={toggleSortOptions}
            >
              <SlidersHorizontal size={16} color={colors.text} />
              <Text style={[styles.sortButtonText, { color: colors.text }]}>
                Sort: {sortOption === 'newest' ? 'Newest' : 'Popular'}
              </Text>
              <ChevronDown size={16} color={colors.text} />
            </TouchableOpacity>

            {/* Sort Options Dropdown */}
            {showSortOptions && (
              <View style={[styles.sortOptions, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'newest' && { backgroundColor: colors.highlight },
                  ]}
                  onPress={() => handleSortSelect('newest')}
                >
                  <Text style={[styles.sortOptionText, { color: colors.text }]}>Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortOption === 'popular' && { backgroundColor: colors.highlight },
                  ]}
                  onPress={() => handleSortSelect('popular')}
                >
                  <Text style={[styles.sortOptionText, { color: colors.text }]}>Popular</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    height: 42,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  toggleButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    width: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 1,
    marginTop: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  sortOptions: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 150,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortOptionText: {
    fontSize: 14,
  },
});