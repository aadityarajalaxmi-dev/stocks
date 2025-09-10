import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightTheme = {
  colors: {
    // Primary colors
    primary: '#2196F3',
    primaryDark: '#1976D2',
    primaryLight: '#BBDEFB',
    
    // Background colors
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    
    // Text colors
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#ffffff',
    
    // Border colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Stock change colors
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#757575',
    
    // Shadow
    shadow: '#000000',
    
    // Header
    headerBackground: '#2196F3',
    headerText: '#ffffff',
    
    // Card
    cardBackground: '#ffffff',
    cardBorder: '#e0e0e0',
  },
  isDark: false,
};

const darkTheme = {
  colors: {
    // Primary colors
    primary: '#64B5F6',
    primaryDark: '#42A5F5',
    primaryLight: '#90CAF9',
    
    // Background colors
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    textInverse: '#000000',
    
    // Border colors
    border: '#333333',
    borderLight: '#2d2d2d',
    
    // Status colors
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#64B5F6',
    
    // Stock change colors
    positive: '#66BB6A',
    negative: '#EF5350',
    neutral: '#9e9e9e',
    
    // Shadow
    shadow: '#000000',
    
    // Header
    headerBackground: '#1e1e1e',
    headerText: '#ffffff',
    
    // Card
    cardBackground: '#1e1e1e',
    cardBorder: '#333333',
  },
  isDark: true,
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
