import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

// Get the Supabase configuration from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Debug: Log the configuration
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyExists: supabaseAnonKey ? 'Yes' : 'No',
  constantsExtra: Constants.expoConfig?.extra
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please check your .env file and app.config.js'
  );
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});