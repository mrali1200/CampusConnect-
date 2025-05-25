import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ScrollView, Modal, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, ChevronDown, SlidersHorizontal, Calendar, X, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, isAfter, isBefore, isEqual } from 'date-fns';

const CATEGORIES = [
  'All',
  'Academic',
  'Social',
  'Sports',
  'Workshop',
  'Conference',
  'Performance',
  'Club',
  'Technology',
  'Career',
  'Arts',
];

interface SearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  sortOption: 'newest' | 'popular';
  setSortOption: (option: 'newest' | 'popular') => void;
  dateRange: { startDate: Date | null; endDate: Date | null } | null;
  setDateRange: (range: { startDate: Date | null; endDate: Date | null } | null) => void;
}

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
  dateRange,
  setDateRange,
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  // Initialize temp dates when date range changes
  useEffect(() => {
    if (dateRange) {
      setTempStartDate(dateRange.startDate);
      setTempEndDate(dateRange.endDate);
    } else {
      setTempStartDate(null);
      setTempEndDate(null);
    }
  }, [dateRange]);

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

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (datePickerMode === 'start') {
        setTempStartDate(selectedDate);
        if (Platform.OS === 'ios' && tempEndDate && (isAfter(selectedDate, tempEndDate) || isEqual(selectedDate, tempEndDate))) {
          // If start date is after or equal to end date, adjust end date
          setTempEndDate(addDays(selectedDate, 1));
        }
      } else {
        setTempEndDate(selectedDate);
        if (Platform.OS === 'ios' && tempStartDate && (isBefore(selectedDate, tempStartDate) || isEqual(selectedDate, tempStartDate))) {
          // If end date is before or equal to start date, adjust start date
          setTempStartDate(addDays(selectedDate, -1));
        }
      }
    }
  };

  const applyDateFilter = () => {
    setDateRange({ startDate: tempStartDate, endDate: tempEndDate });
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setDateRange(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setShowDatePicker(false);
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

          {/* Date Range Filter */}
          <View style={styles.dateFilterContainer}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Date Range</Text>
            <View style={styles.dateButtonsRow}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openDatePicker('start')}
              >
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {tempStartDate ? format(tempStartDate, 'MMM d, yyyy') : 'Start Date'}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.dateRangeSeparator, { color: colors.text }]}>to</Text>
              
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openDatePicker('end')}
              >
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {tempEndDate ? format(tempEndDate, 'MMM d, yyyy') : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Date Range Actions */}
            {(tempStartDate || tempEndDate) && (
              <View style={styles.dateActionsRow}>
                <TouchableOpacity
                  style={[styles.dateActionButton, { borderColor: colors.error }]}
                  onPress={clearDateFilter}
                >
                  <X size={14} color={colors.error} />
                  <Text style={[styles.dateActionText, { color: colors.error }]}>Clear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dateActionButton, { borderColor: colors.primary }]}
                  onPress={applyDateFilter}
                >
                  <Check size={14} color={colors.primary} />
                  <Text style={[styles.dateActionText, { color: colors.primary }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
      
      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent={true}
          visible={showDatePicker}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Select {datePickerMode === 'start' ? 'Start' : 'End'} Date
                </Text>
                <TouchableOpacity onPress={applyDateFilter}>
                  <Check size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={datePickerMode === 'start' ? tempStartDate || new Date() : tempEndDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={datePickerMode === 'end' && tempStartDate ? tempStartDate : undefined}
                maximumDate={datePickerMode === 'start' && tempEndDate ? tempEndDate : undefined}
              />
            </View>
          </View>
        </Modal>
      )}
      
      {/* Date Picker for Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? tempStartDate || new Date() : tempEndDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={datePickerMode === 'end' && tempStartDate ? tempStartDate : undefined}
          maximumDate={datePickerMode === 'start' && tempEndDate ? tempEndDate : undefined}
        />
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
  // Date Range Filter Styles
  dateFilterContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  dateActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  dateActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  dateActionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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