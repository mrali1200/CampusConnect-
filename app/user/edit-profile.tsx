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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Mail, Camera, Save } from 'lucide-react-native';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, profile } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Define the profile form data interface
  interface ProfileFormData {
    full_name: string;
    email: string;
    avatar_url: string;
  }

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to edit your profile.');
      router.replace('/sign-in');
      return;
    }

    // Initialize form with current profile data
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user.email || '',
        avatar_url: profile.avatar_url || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      });
      setLoading(false);
    }
  }, [user, profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string): void => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: formData.avatar_url }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={[styles.imageEditButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // Define extended Alert options type with prompt
                  interface ExtendedAlertOptions {
                    cancelable?: boolean;
                    onDismiss?: () => void;
                    prompt?: {
                      defaultValue?: string;
                      placeholder?: string;
                    };
                  }

                  // Cast the options to any to avoid TypeScript errors
                  const alertOptions: ExtendedAlertOptions = {
                    cancelable: true,
                    prompt: {
                      defaultValue: formData.avatar_url,
                      placeholder: 'Enter image URL'
                    }
                  };

                  Alert.alert(
                    'Update Profile Picture',
                    'Enter a URL for your profile picture:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Update',
                        onPress: (value?: string) => {
                          if (value && value.trim() !== '') {
                            handleInputChange('avatar_url', value);
                          }
                        },
                      },
                    ],
                    alertOptions as any
                  );
                }}
              >
                <Camera size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <User size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.subtext}
                    value={formData.full_name}
                    onChangeText={(text) => handleInputChange('full_name', text)}
                  />
                </View>
              </View>

              {/* Email (read-only) */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.7 }]}>
                  <Mail size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={formData.email}
                    editable={false}
                  />
                </View>
                <Text style={[styles.helperText, { color: colors.subtext }]}>
                  Email cannot be changed
                </Text>
              </View>

              {/* Avatar URL */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Profile Picture URL</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Camera size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter image URL"
                    placeholderTextColor={colors.subtext}
                    value={formData.avatar_url}
                    onChangeText={(text) => handleInputChange('avatar_url', text)}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  saving && { opacity: 0.7 },
                ]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    width: '100%',
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
  input: {
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
