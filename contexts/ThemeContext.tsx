import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: typeof lightColors;
  toggleTheme: () => void;
}

const lightColors = {
  primary: '#4361EE',
  secondary: '#3A0CA3',
  accent: '#F72585',
  success: '#4CAF50',
  warning: '#FB8500',
  error: '#E63946',
  background: '#FFFFFF',
  card: '#F8F9FA',
  text: '#1E1E24',
  subtext: '#6C757D',
  border: '#DEE2E6',
  highlight: '#E9ECEF',
  gradient: {
    primary: ['#4361EE', '#3A0CA3'],
    accent: ['#F72585', '#7209B7'],
    success: ['#4CAF50', '#2E7D32'],
  },
  footer: '#F8F9FA',
};

const darkColors = {
  primary: '#4CC9F0',
  secondary: '#7209B7',
  accent: '#F72585',
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  background: '#121212',
  card: '#1E1E1E',
  text: '#F8F9FA',
  subtext: '#ADB5BD',
  border: '#333333',
  highlight: '#1A2E52',
  gradient: {
    primary: ['#4CC9F0', '#4361EE'],
    accent: ['#F72585', '#7209B7'],
    success: ['#66BB6A', '#388E3C'],
  },
  footer: '#1E1E1E',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  colors: lightColors,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);

  const isDark =
    theme === 'system'
      ? deviceTheme === 'dark'
      : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('@theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};