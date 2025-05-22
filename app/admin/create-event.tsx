import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext'; 
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, Clock, MapPin, Tag, Info, Image as ImageIcon } from 'lucide-react-native';

const CATEGORIES = [
  'Academic',
  'Social',
  'Sports',
  'Workshop',
  'Conference',
  'Performance',
  'Club',
];

export default function CreateEventScreen() {
  const { colors } = useTheme();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    date: new Date(),
    time: '18:00',
    venue: '',
    category: '',
    image_url: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
    organizer: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      Alert.alert('Unauthorized', 'You do not have permission to access this page.');
      router.replace('/');
    }
  }, [isAdmin]);

  // Define form data interface
  interface EventFormData {
    name: string;
    description: string;
    date: Date;
    time: string;
    venue: string;
    category: string;
    image_url: string;
    organizer: string;
  }

  const handleInputChange = (field: keyof EventFormData, value: string | Date): void => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        date: selectedDate,
      });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date): void => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData({
        ...formData,
        time: `${hours}:${minutes}`,
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Event name is required');
      return false;
    }
    if (!formData.venue.trim()) {
      Alert.alert('Error', 'Venue is required');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const eventData = {
        name: formData.name,
        description: formData.description,
        date: format(formData.date, 'yyyy-MM-dd'),
        time: formData.time,
        venue: formData.venue,
        category: formData.category,
        image_url: formData.image_url,
        organizer: formData.organizer || 'ConnectCampus+',
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Event created successfully!',
        [{ text: 'OK', onPress: () => router.push('/admin/manage-events') }]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create New Event',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            {/* Event Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Event Name*</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter event name"
                placeholderTextColor={colors.subtext}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Info size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Enter event description"
                  placeholderTextColor={colors.subtext}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Date*</Text>
              <TouchableOpacity
                style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={[styles.inputText, { color: colors.text }]}>
                  {format(formData.date, 'MMMM d, yyyy')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Time*</Text>
              <TouchableOpacity
                style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={colors.primary} style={styles.inputIcon} />
                <Text style={[styles.inputText, { color: colors.text }]}>
                  {formData.time}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const [hours, minutes] = formData.time.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0);
                    return date;
                  })()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Venue */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Venue*</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MapPin size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter venue"
                  placeholderTextColor={colors.subtext}
                  value={formData.venue}
                  onChangeText={(text) => handleInputChange('venue', text)}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category*</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => handleInputChange('category', category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category
                          ? { color: '#FFFFFF' }
                          : { color: colors.text },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Organizer */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Organizer</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter organizer name"
                placeholderTextColor={colors.subtext}
                value={formData.organizer}
                onChangeText={(text) => handleInputChange('organizer', text)}
              />
            </View>

            {/* Image URL */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Image URL</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ImageIcon size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter image URL"
                  placeholderTextColor={colors.subtext}
                  value={formData.image_url}
                  onChangeText={(text) => handleInputChange('image_url', text)}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    flex: 1,
    height: 100,
    fontSize: 16,
    paddingTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
