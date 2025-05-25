import React from 'react';
import { BarCodeScanner as ExpoBarCodeScanner } from 'expo-barcode-scanner';
import { StyleSheet, ViewStyle } from 'react-native';

interface CustomBarCodeScannerProps {
  onBarCodeScanned: (data: { type: string; data: string }) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * A custom wrapper for the Expo BarCodeScanner that avoids using the problematic Constants property
 * which causes errors on iOS devices.
 */
export default function CustomBarCodeScanner({ 
  onBarCodeScanned, 
  style, 
  disabled = false 
}: CustomBarCodeScannerProps) {
  return (
    <ExpoBarCodeScanner
      onBarCodeScanned={disabled ? undefined : onBarCodeScanned}
      style={style || styles.scanner}
    />
  );
}

const styles = StyleSheet.create({
  scanner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
