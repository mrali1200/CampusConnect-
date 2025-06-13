const AsyncStorage = require('@react-native-async-storage/async-storage');

async function clearStorage() {
  try {
    console.log('Clearing all app data...');
    await AsyncStorage.clear();
    console.log('✅ Successfully cleared all app data');
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
  } finally {
    process.exit(0);
  }
}

clearStorage();
