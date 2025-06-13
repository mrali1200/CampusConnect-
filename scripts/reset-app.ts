import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../lib/storage';
import { authService } from '../lib/authService';

async function resetApp() {
  try {
    console.log('Resetting app data...');
    
    // Clear all storage
    await storage.clearAll();
    
    // Clear AsyncStorage completely
    await AsyncStorage.clear();
    
    // Sign in as guest
    await authService.signInAsGuest();
    
    console.log('App reset successful. You are now signed in as a guest.');
  } catch (error) {
    console.error('Error resetting app:', error);
  } finally {
    // Exit the script
    process.exit(0);
  }
}

// Run the reset
resetApp();
