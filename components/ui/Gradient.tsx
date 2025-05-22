import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientProps {
  type?: 'primary' | 'accent' | 'success';
  style?: ViewStyle;
  children?: React.ReactNode;
}

const Gradient: React.FC<GradientProps> = ({ 
  type = 'primary', 
  style, 
  children
}) => {
  const { colors } = useTheme();
  
  // Get colors for the gradient and ensure they match the required type
  const gradientArray = colors.gradient[type];
  // LinearGradient requires at least 2 colors
  const gradientColors: LinearGradientProps['colors'] = [
    gradientArray[0] || '#4361EE',
    gradientArray[1] || '#3A0CA3',
  ];
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default Gradient;
