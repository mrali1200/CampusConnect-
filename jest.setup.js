// Set up Jest global mocks
global.jest = jest;

// Mock modules that might cause issues in the test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => {
  return {
    shouldUseNativeDriver: () => false,
  };
});

// Mock all Expo native modules to prevent 'Cannot find native module' errors
jest.mock('expo-camera', () => ({}));
jest.mock('expo-barcode-scanner', () => ({}));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  createAssetAsync: jest.fn().mockResolvedValue({ id: 'mock-asset-id' }),
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/path/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-font', () => ({}));
jest.mock('expo-asset', () => ({}));
jest.mock('expo-constants', () => ({}));
jest.mock('expo-device', () => ({}));

// Mock React Native components that might cause issues
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock alert
global.alert = jest.fn();

// Extend Jest matchers
require('@testing-library/jest-native/extend-expect');
